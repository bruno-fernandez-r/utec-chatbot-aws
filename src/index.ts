// Este es el punto de entrada del proyecto. Aquí, conectamos todo y usamos las funciones de OpenAI y Pinecone.

import pdfParse from "pdf-parse";
import { uploadPDF, getPDFUrl } from "./services/awsService";
import { generateEmbeddings, generateResponse } from "./services/openaiService";
import { saveVectorData, searchVectorData } from "./services/pineconeService";
import { Pinecone } from "@pinecone-database/pinecone";
import fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

// 📂 Archivo a procesar
const filePath = "./documentos/test.pdf";
const fileName = "test.pdf";

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
    console.log("✅ Pinecone inicializado correctamente:", index);
  } catch (error) {
    console.error("❌ Error inicializando Pinecone:", error);
  }
}

// 📤 Función para subir y procesar PDFs
async function processPDF() {
  try {
    // Verificar si el archivo existe
    if (!fs.existsSync(filePath)) {
      console.error(`❌ El archivo ${filePath} no existe.`);
      return;
    }

    console.log("📤 Subiendo archivo a S3...");
    const s3Path = await uploadPDF(filePath, fileName);
    console.log(`✅ Archivo subido: ${s3Path}`);

    console.log("🔍 Extrayendo texto del PDF...");
    const pdfData = await pdfParse(fs.readFileSync(filePath)); // ✅ Corrección sin `.default`
    const pdfText = pdfData.text;

    if (!pdfText.trim()) {
      console.error("❌ No se pudo extraer texto del PDF.");
      return;
    }

    console.log("🧠 Generando embeddings...");
    const embedding = await generateEmbeddings(pdfText);

    console.log("💾 Guardando datos en Pinecone...");
    await saveVectorData(fileName, pdfText);
    console.log("✅ Documento guardado en Pinecone.");

    console.log("🔗 Obteniendo URL de descarga...");
    const url = await getPDFUrl(fileName);
    console.log(`📥 URL del archivo en S3: ${url}`);
  } catch (error) {
    console.error("❌ Error en el procesamiento del PDF:", error);
  }
}

// 🤖 Función del chatbot para responder preguntas
async function runChatbot() {
  try {
    await initialize();

    const searchQuery = "¿Cuál es el contacto de soporte técnico?";
    console.log(`🗣️ Consulta: ${searchQuery}`);

    console.log("🔍 Buscando en Pinecone...");
    const content = await searchVectorData(searchQuery);
    console.log(`📚 Contenido encontrado: ${content}`);

    console.log("🤖 Generando respuesta con GPT-4...");
    
    // ✅ Se pasa el contenido de Pinecone como contexto a OpenAI
    const response = await generateResponse(searchQuery, content);
    console.log(`💬 Respuesta: ${response}`);
  } catch (error) {
    console.error("❌ Error ejecutando el chatbot:", error);
  }
}

// 🔄 Ejecutar el proceso
async function main() {
  await processPDF(); // 📤 Procesar PDF
  await runChatbot(); // 🤖 Ejecutar chatbot
}

main();

