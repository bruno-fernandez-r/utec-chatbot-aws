
import { getFileBufferFromS3 } from "./awsService";
import { saveVectorData } from "./pineconeService";
import pdfParse from "pdf-parse";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Procesa un archivo confidencial desde S3 y lo indexa en Pinecone.
 * @param key - Clave (path) del archivo en S3
 */
export async function processDocumentFromS3(key: string): Promise<void> {
  try {
    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) {
      throw new Error("La variable de entorno AWS_S3_BUCKET no está definida.");
    }

    console.log(`📥 Descargando archivo desde S3: ${key}`);
    const fileBuffer = await getFileBufferFromS3(bucket, key);

    const ext = path.extname(key).toLowerCase();
    let extractedText = "";

    if (ext === ".pdf") {
      const pdfData = await pdfParse(fileBuffer);
      extractedText = pdfData.text;
    } else {
      throw new Error(`Tipo de archivo no soportado: ${ext}`);
    }

    if (!extractedText || extractedText.trim().length < 20) {
      throw new Error("El archivo no contiene texto suficiente para procesar.");
    }

    const documentId = key.replace(/\.[^/.]+$/, ""); // usar el nombre del archivo sin extensión como ID
    console.log(`📚 Procesando e indexando documento: ${documentId}`);

    await saveVectorData(documentId, extractedText);
  } catch (error) {
    console.error("❌ Error al procesar el documento desde S3:", error);
    throw error;
  }
}

