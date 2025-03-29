import express, { Request, Response } from 'express';
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

const router = express.Router();

// POST /api/train/:filename?chatbotId=abc123
router.post('/:filename', async (req: Request, res: Response) => {
  const { filename } = req.params;
  const chatbotId = req.query.chatbotId as string;

  if (!chatbotId) {
    return res.status(400).json({ error: 'El parámetro "chatbotId" es requerido en la query string.' });
  }

  try {
    // 1. Descargar archivo actual desde Azure
    const fileBuffer = await AzureBlobService.downloadFile(filename);

    // 2. Sobrescribir el archivo en Azure (por si fue reemplazado localmente)
    await AzureBlobService.uploadFile(fileBuffer, filename);

    // 3. Guardar archivo temporal para procesamiento
    const tempPath = path.join(os.tmpdir(), filename);
    fs.writeFileSync(tempPath, fileBuffer);

    // 4. Eliminar vectores anteriores si existen
    const yaExiste = await documentExistsInPinecone(filename, chatbotId);
    if (yaExiste) {
      console.log(`🧹 Eliminando vectores anteriores de ${filename} para chatbot ${chatbotId}...`);
      await deleteVectorsManualmente(filename, chatbotId);
    }

    // 5. Extraer texto del PDF
    const pdfData = await pdfParse(fs.readFileSync(tempPath));
    const pdfText = pdfData.text;

    if (!pdfText.trim()) {
      return res.status(400).json({ error: 'El PDF no contiene texto procesable.' });
    }

    // 6. Guardar nuevos vectores en Pinecone
    await saveVectorData(filename, pdfText, chatbotId);

    // 7. Eliminar archivo temporal
    fs.unlinkSync(tempPath);

    res.status(200).json({ message: '📚 Entrenamiento exitoso con el nuevo archivo.' });
  } catch (error) {
    console.error('❌ Error durante el entrenamiento:', error);
    res.status(500).json({ error: 'Error al entrenar el modelo con el archivo.' });
  }
});

export default router;
