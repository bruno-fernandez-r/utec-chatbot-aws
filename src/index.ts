// Este es el punto de entrada del proyecto. Aquí, conectamos todo y usamos las funciones de OpenAI y Pinecone.

import pdfParse from "pdf-parse";
import { uploadPDF, getPDFUrl } from "./services/awsService";
import { generateEmbeddings, generateResponse } from "./services/openaiService";
import { saveVectorData, searchVectorData, documentExistsInPinecone } from "./services/pineconeService";
import { loadCache, saveToCache, getFromCache } from "./services/cacheService";
import { Pinecone } from "@pinecone-database/pinecone";
import fs from "fs";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config();

// 📂 Carpeta de documentos
const DOCUMENTS_FOLDER = "./documentos/";

// 📌 Inicializar Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// 📌 Obtener el índice de Pinecone
async function getPineconeIndex() {
  if (!process.env.PINECONE_INDEX) {
    throw new Error("❌ ERROR: PINECONE_INDEX no está definido en .env");
  }
  return pinecone.index(process.env.PINECONE_INDEX!);
}

async function initialize() {
  try {
    console.log("🟢 Inicializando Pinecone...");
    const index = await getPineconeIndex();
    console.log("✅ Pinecone inicializado correctamente.");
  } catch (error) {
    console.error("❌ Error inicializando Pinecone:", error);
  }
}

// 📤 Procesar todos los PDFs en la carpeta `documentos/`
async function processAllPDFs() {
  try {
    const files = fs.readdirSync(DOCUMENTS_FOLDER).filter(file => file.endsWith(".pdf"));

    if (files.length === 0) {
      console.log("⚠️ No se encontraron archivos PDF en la carpeta.");
      return;
    }

    for (const fileName of files) {
      const filePath = path.join(DOCUMENTS_FOLDER, fileName);
      console.log(`📄 Procesando archivo: ${fileName}`);

      console.log("🔍 Verificando si el documento ya está en Pinecone...");
      const exists = await documentExistsInPinecone(fileName);

      if (exists) {
        console.log(`✅ ${fileName} ya existe en Pinecone, saltando procesamiento.`);
        continue; // 🚀 Evita procesar archivos ya indexados
      }

      console.log("📤 Subiendo archivo a S3...");
      const s3Path = await uploadPDF(filePath, fileName);
      console.log(`✅ Archivo subido: ${s3Path}`);

      console.log("🔍 Extrayendo texto del PDF...");
      const pdfData = await pdfParse(fs.readFileSync(filePath));
      const pdfText = pdfData.text;

      if (!pdfText.trim()) {
        console.error(`❌ No se pudo extraer texto del PDF: ${fileName}`);
        continue;
      }

      console.log("🧠 Generando embeddings...");
      await saveVectorData(fileName, pdfText); // ✅ Guarda en Pinecone solo si no existía

      console.log(`✅ ${fileName} procesado correctamente.`);
      console.log("🔗 Obteniendo URL de descarga...");
      const url = await getPDFUrl(fileName);
      console.log(`📥 URL del archivo en S3: ${url}`);
    }
  } catch (error) {
    console.error("❌ Error en el procesamiento de los PDFs:", error);
  }
}

// 🤖 Función del chatbot para responder preguntas
async function runChatbot() {
  try {
    await initialize();

    const searchQuery = "¿Qué carreras se ofrecen en Fraybentos?";
    console.log(`🗣️ Consulta: ${searchQuery}`);

    // 🔍 Primero, buscamos en el caché
    const cachedResponse = getFromCache(searchQuery);
    if (cachedResponse) {
      console.log("⚡ Respuesta obtenida desde caché.");
      console.log(`💬 Respuesta: ${cachedResponse}`);
      return;
    }

    console.log("🔍 Buscando en Pinecone...");
    const content = await searchVectorData(searchQuery);

    if (!content.trim()) {
      console.log("⚠️ No se encontraron datos relevantes en Pinecone.");
      console.log("💬 Respuesta: No tengo información suficiente.");
      return;
    }

    console.log(`📚 Contenido relevante encontrado:\n${content}`);

    console.log("🤖 Generando respuesta con GPT-4...");
    const response = await generateResponse(searchQuery, content);

    // 💾 Guardamos la respuesta en caché
    saveToCache(searchQuery, response);

    console.log(`💬 Respuesta: ${response}`);
  } catch (error) {
    console.error("❌ Error ejecutando el chatbot:", error);
  }
}

// 🔄 Ejecutar el proceso
async function main() {
  await processAllPDFs(); // 📤 Procesar todos los PDFs en la carpeta `documentos/`
  await runChatbot(); // 🤖 Ejecutar chatbot
}

main();

