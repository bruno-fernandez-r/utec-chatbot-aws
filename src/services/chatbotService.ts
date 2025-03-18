import pdfParse from "pdf-parse";
import { uploadPDF, getPDFUrl } from "./awsService";
import { generateEmbeddings, generateResponse } from "./openaiService";
import { saveVectorData, searchVectorData, documentExistsInPinecone } from "./pineconeService";
import { loadCache, saveToCache, getFromCache } from "./cacheService";
import fs from "fs";
import path from "path";

const DOCUMENTS_FOLDER = "./documentos/";

// 📂 Procesar nuevos PDFs en la carpeta
export async function processAllPDFs() {
  try {
    const files = fs.readdirSync(DOCUMENTS_FOLDER).filter(file => file.endsWith(".pdf"));

    if (files.length === 0) {
      console.log("⚠️ No se encontraron archivos PDF en la carpeta.");
      return;
    }

    for (const fileName of files) {
      const filePath = path.join(DOCUMENTS_FOLDER, fileName);
      console.log(`📄 Procesando archivo: ${fileName}`);

      // 🔍 Verificar si ya está en Pinecone
      const exists = await documentExistsInPinecone(fileName);
      if (exists) {
        console.log(`✅ ${fileName} ya existe en Pinecone, saltando.`);
        continue;
      }

      console.log("📤 Subiendo archivo a S3...");
      await uploadPDF(filePath, fileName);

      console.log("🔍 Extrayendo texto del PDF...");
      const pdfData = await pdfParse(fs.readFileSync(filePath));
      const pdfText = pdfData.text;

      if (!pdfText.trim()) {
        console.error(`❌ No se pudo extraer texto del PDF: ${fileName}`);
        continue;
      }

      console.log("🧠 Generando embeddings y guardando en Pinecone...");
      await saveVectorData(fileName, pdfText);
      console.log(`✅ ${fileName} procesado correctamente.`);
    }
  } catch (error) {
    console.error("❌ Error procesando PDFs:", error);
  }
}

// 🤖 Buscar consultas en la base de conocimiento
export async function searchQuery(query: string): Promise<string> {
  try {
    console.log(`🗣️ Consulta recibida: ${query}`);

    // 🔍 Buscar en caché primero
    const cachedResponse = getFromCache(query);
    if (cachedResponse) {
      console.log("⚡ Respuesta obtenida desde caché.");
      return cachedResponse;
    }

    console.log("🔍 Buscando en Pinecone...");
    const content = await searchVectorData(query);

    if (!content.trim()) {
      return "⚠️ No se encontraron datos relevantes.";
    }

    console.log("🤖 Generando respuesta con GPT-4...");
    const response = await generateResponse(query, content);

    // Guardar en caché
    saveToCache(query, response);
    return response;
  } catch (error) {
    console.error("❌ Error en searchQuery:", error);
    throw new Error("Error procesando la consulta.");
  }
}
