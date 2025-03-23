//Este archivo gestiona la carga, eliminación y entrenamiento de documentos.

import { uploadFileToS3 } from "./awsService";
import { processDocumentFromS3 } from "./documentProcessor";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config();

const BUCKET_NAME = process.env.AWS_BUCKET_NAME as string;

/**
 * Maneja la subida del archivo a S3 y dispara el procesamiento automático.
 * @param file Archivo recibido desde la API
 * @param customPath Ruta personalizada donde se almacenará dentro del bucket
 * @returns URL pública del archivo subido
 */
export async function handleUpload(file: Express.Multer.File, customPath: string) {
  // Subir archivo a S3
  const fileUrl = await uploadFileToS3(file, customPath);

  // 🔍 Obtener la clave (key) del archivo a partir de la URL
  const url = new URL(fileUrl);
  const key = decodeURIComponent(url.pathname.slice(1)); // Quita la barra inicial

  // Procesar el archivo directamente desde S3
  await processDocumentFromS3(key);


  return fileUrl;
}

