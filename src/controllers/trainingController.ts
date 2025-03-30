
import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { AzureBlobService } from '../services/azureBlobService';
import {
  documentExistsInPinecone,
  deleteVectorsManualmente,
  saveVectorData,
  listDocumentsByChatbot
} from '../services/pineconeService';

export const train = async (req: Request, res: Response) => {
  const { filename } = req.params;
  const chatbotId = req.query.chatbotId as string;

  if (!chatbotId) {
    return res.status(400).json({ error: 'El parámetro "chatbotId" es requerido en la query string.' });
  }

  try {
    console.log(`📥 Iniciando entrenamiento para archivo '${filename}' (chatbot: ${chatbotId})`);

    // 1. Descargar el archivo desde Azure Blob
    const fileBuffer = await AzureBlobService.downloadFile(filename);
    if (!fileBuffer) {
      return res.status(404).json({ error: `El archivo '${filename}' no fue encontrado en Azure.` });
    }

    // 2. Guardar temporalmente para extraer texto
    const tempPath = path.join(os.tmpdir(), filename);
    fs.writeFileSync(tempPath, fileBuffer);

    // 3. Verificar si ya fue entrenado → eliminar vectores anteriores
    const yaExiste = await documentExistsInPinecone(filename, chatbotId);
    if (yaExiste) {
      console.log(`🧹 Eliminando vectores anteriores de ${filename} para chatbot ${chatbotId}`);
      await deleteVectorsManualmente(filename, chatbotId);
    }

    // 4. Extraer texto del PDF
    const pdfData = await pdfParse(fs.readFileSync(tempPath));
    const pdfText = pdfData.text?.trim();
    if (!pdfText) {
      fs.unlinkSync(tempPath);
      return res.status(400).json({ error: 'El PDF no contiene texto procesable.' });
    }

    // 5. Guardar nuevos vectores
    await saveVectorData(filename, pdfText, chatbotId);

    // 6. Limpiar archivo temporal
    fs.unlinkSync(tempPath);

    res.status(200).json({ message: '📚 Entrenamiento exitoso con el nuevo archivo.' });
  } catch (error) {
    console.error('❌ Error durante el entrenamiento:', error);
    res.status(500).json({ error: 'Error al entrenar el modelo con el archivo.' });
  }
};

export const getTrainedDocuments = async (req: Request, res: Response) => {
  const { chatbotId } = req.params;

  if (!chatbotId) {
    return res.status(400).json({ error: "chatbotId es requerido en la ruta." });
  }

  try {
    const documents = await listDocumentsByChatbot(chatbotId);

    res.status(200).json({
      chatbotId,
      documents,
    });
  } catch (error) {
    console.error("❌ Error obteniendo documentos entrenados:", error);
    res.status(500).json({ error: "Error al obtener los documentos entrenados." });
  }
};
