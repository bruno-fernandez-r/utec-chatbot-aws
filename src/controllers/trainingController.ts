import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { AzureBlobService } from '../services/azureBlobService';
import {
  documentExistsInPinecone,
  deleteVectorsManualmente,
  saveVectorData
} from '../services/pineconeService';

export const train = async (req: Request, res: Response) => {
  const { filename } = req.params;
  const chatbotId = req.query.chatbotId as string;

  if (!chatbotId) {
    return res.status(400).json({ error: 'El parámetro "chatbotId" es requerido en la query string.' });
  }

  try {
    const fileBuffer = await AzureBlobService.downloadFile(filename);
    await AzureBlobService.uploadFile(fileBuffer, filename);

    const tempPath = path.join(os.tmpdir(), filename);
    fs.writeFileSync(tempPath, fileBuffer);

    const yaExiste = await documentExistsInPinecone(filename, chatbotId);
    if (yaExiste) {
      console.log(`🧹 Eliminando vectores anteriores de ${filename} para chatbot ${chatbotId}...`);
      await deleteVectorsManualmente(filename, chatbotId);
    }

    const pdfData = await pdfParse(fs.readFileSync(tempPath));
    const pdfText = pdfData.text;

    if (!pdfText.trim()) {
      return res.status(400).json({ error: 'El PDF no contiene texto procesable.' });
    }

    await saveVectorData(filename, pdfText, chatbotId);

    fs.unlinkSync(tempPath);

    res.status(200).json({ message: '📚 Entrenamiento exitoso con el nuevo archivo.' });
  } catch (error) {
    console.error('❌ Error durante el entrenamiento:', error);
    res.status(500).json({ error: 'Error al entrenar el modelo con el archivo.' });
  }
};
