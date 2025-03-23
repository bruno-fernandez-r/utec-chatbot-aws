import pdfParse from "pdf-parse";
import fs from "fs";
import path from "path";
import { generateEmbeddings, generateResponse } from "./openaiService";
import { saveVectorData, searchVectorData, documentExistsInPinecone } from "./pineconeService";

// 📂 Carpeta de PDFs locales (no usada actualmente pero mantenida para compatibilidad)
const DOCUMENTS_FOLDER = "./documentos/";

// Procesar todos los PDFs en carpeta local (opcional)
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

      const exists = await documentExistsInPinecone(fileName);
      if (exists) {
        console.log(`✅ ${fileName} ya existe en Pinecone, saltando.`);
        continue;
      }

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

// 🤖 Procesar una consulta con historial incluido
export async function searchQuery(query: string, sessionId: string): Promise<string> {
  try {
    console.log(`🗣️ Consulta recibida: ${query}`);

    // 🔍 Buscar contexto relevante en Pinecone
    const context = await searchVectorData(query);

    // 🤖 Generar respuesta usando contexto y sesión
    const response = await generateResponse(query, context, sessionId);

    console.log(`💬 Respuesta generada: ${response}`);
    return response;
  } catch (error) {
    console.error("❌ Error en searchQuery:", error);
    throw new Error("Error procesando la consulta.");
  }
}
