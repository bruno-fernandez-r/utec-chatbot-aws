
import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { AzureBlobService } from "../services/azureBlobService";
import {
  deleteVectorsManualmente,
  findChatbotsByFilename
} from "../services/pineconeService";

const ALLOWED_EXTENSIONS = [".pdf"];

export const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Debe subir un archivo con el campo 'file'." });
    }

    const tempPath = req.file.path;
    const originalName = req.file.originalname;
    const fileExt = path.extname(originalName).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      fs.unlinkSync(tempPath); // eliminar archivo si es inválido
      return res.status(400).json({ error: "Solo se permiten archivos PDF (.pdf)" });
    }

    const fileBuffer = fs.readFileSync(tempPath);
    await AzureBlobService.uploadFile(fileBuffer, originalName);
    fs.unlinkSync(tempPath);

    console.log(`✅ Archivo '${originalName}' subido correctamente a Azure Blob`);
    res.status(200).json({ message: "Archivo subido correctamente a Azure.", filename: originalName });
  } catch (error) {
    console.error("❌ Error al subir archivo:", error);
    res.status(500).json({ error: "Error al subir el archivo a Azure." });
  }
};

export const listFiles = async (_req: Request, res: Response) => {
  try {
    const files = await AzureBlobService.listFiles();
    res.json({ files });
  } catch (error) {
    console.error("❌ Error al listar archivos:", error);
    res.status(500).json({ error: "Error al listar archivos." });
  }
};

export const deleteFile = async (req: Request, res: Response) => {
  const { filename } = req.params;

  try {
    console.log(`🗑️ Eliminando archivo '${filename}'...`);

    // 1. Buscar todos los chatbots que tengan vectores de este archivo
    const chatbotIds = await findChatbotsByFilename(filename);

    // 2. Eliminar los vectores para cada chatbot
    for (const chatbotId of chatbotIds) {
      console.log(`🧹 Eliminando vectores de '${filename}' para chatbot '${chatbotId}'`);
      await deleteVectorsManualmente(filename, chatbotId);
    }

    // 3. Eliminar archivo de Azure
    await AzureBlobService.deleteFile(filename);
    console.log(`✅ Archivo '${filename}' eliminado de Azure Blob`);

    res.status(200).json({
      message: `Archivo '${filename}' y sus vectores asociados fueron eliminados correctamente.`,
      affectedBots: chatbotIds,
    });
  } catch (error) {
    console.error("❌ Error al eliminar archivo:", error);
    res.status(500).json({ error: "Error al eliminar el archivo." });
  }
};

export const downloadFile = async (req: Request, res: Response) => {
  const { filename } = req.params;
  try {
    const fileBuffer = await AzureBlobService.downloadFile(filename);
    if (!fileBuffer) {
      return res.status(404).json({ error: `Archivo '${filename}' no encontrado.` });
    }

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(fileBuffer);
  } catch (error) {
    console.error("❌ Error al descargar archivo:", error);
    res.status(500).json({ error: "Error al descargar archivo." });
  }
};
