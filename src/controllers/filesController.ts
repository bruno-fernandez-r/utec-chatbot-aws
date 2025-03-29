
import { Request, Response } from "express";
import fs from "fs";
import { AzureBlobService } from "../services/azureBlobService";

export const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Debe subir un archivo con el campo 'file'." });
    }

    const tempPath = req.file.path;
    const originalName = req.file.originalname;
    const fileBuffer = fs.readFileSync(tempPath);

    await AzureBlobService.uploadFile(fileBuffer, originalName);
    fs.unlinkSync(tempPath); // limpiar archivo temporal

    res.status(200).json({ message: "✅ Archivo subido correctamente a Azure.", filename: originalName });
  } catch (error) {
    console.error("❌ Error al subir archivo:", error);
    res.status(500).json({ error: "Error al subir el archivo." });
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
    await AzureBlobService.deleteFile(filename);
    res.status(200).json({ message: `🗑️ Archivo '${filename}' eliminado correctamente.` });
  } catch (error) {
    console.error("❌ Error al eliminar archivo:", error);
    res.status(500).json({ error: "Error al eliminar archivo." });
  }
};

export const downloadFile = async (req: Request, res: Response) => {
  const { filename } = req.params;
  try {
    const fileBuffer = await AzureBlobService.downloadFile(filename);
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.send(fileBuffer);
  } catch (error) {
    console.error("❌ Error al descargar archivo:", error);
    res.status(500).json({ error: "Error al descargar archivo." });
  }
};
