import pdfParse from "pdf-parse";
import { uploadPDF, getPDFUrl } from "./awsService";
import { generateEmbeddings, generateResponse } from "./openaiService";
import { saveVectorData, searchVectorData, documentExistsInPinecone } from "./pineconeService";
import fs from "fs";
import path from "path";

const DOCUMENTS_FOLDER = "./documentos/";

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

export async function searchQuery(query: string, sessionId: string = "default"): Promise<string> {
  try {
    console.log(`🗣️ Consulta recibida: ${query}`);

    console.log("🔍 Buscando en Pinecone...");
    const content = await searchVectorData(query);

    if (!content.trim()) {
      console.log("⚠️ No se encontraron datos relevantes.");
      return "⚠️ No se encontraron datos relevantes.";
    }

    console.log("🤖 Generando respuesta con GPT-4...");
    const response = await generateResponse(query, content, sessionId);

    console.log(`💬 Respuesta generada: ${response}`);

    return response;
  } catch (error) {
    console.error("❌ Error en searchQuery:", error);
    throw new Error("Error procesando la consulta.");
  }
}