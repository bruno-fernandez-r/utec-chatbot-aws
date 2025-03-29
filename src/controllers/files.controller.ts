
import express, { Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import os from "os";
import { AzureBlobService } from "../services/azureBlobService";

const router = express.Router();

// 🧩 Configuración de multer: guarda archivos temporales en /tmp o sistema operativo
const upload = multer({ dest: os.tmpdir() });

// 📁 POST /api/files/upload
router.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Debe subir un archivo con el campo 'file'." });
    }

    const tempPath = req.file.path;
    const originalName = req.file.originalname;

    const fileBuffer = fs.readFileSync(tempPath);

    await AzureBlobService.uploadFile(fileBuffer, originalName);

    fs.unlinkSync(tempPath); // Limpieza del archivo temporal

    res.status(200).json({ message: "✅ Archivo subido correctamente a Azure.", filename: originalName });
  } catch (error) {
    console.error("❌ Error al subir archivo:", error);
    res.status(500).json({ error: "Error al subir el archivo." });
  }
});

// 📁 GET /api/files → listar archivos
router.get("/", async (_req: Request, res: Response) => {
  try {
    const files = await AzureBlobService.listFiles();
    res.json({ files });
  } catch (error) {
    console.error("❌ Error al listar archivos:", error);
    res.status(500).json({ error: "Error al listar archivos." });
  }
});

// 📁 DELETE /api/files/:filename → eliminar archivo
router.delete("/:filename", async (req: Request, res: Response) => {
  const { filename } = req.params;

  try {
    await AzureBlobService.deleteFile(filename);
    res.status(200).json({ message: `🗑️ Archivo '${filename}' eliminado correctamente.` });
  } catch (error) {
    console.error("❌ Error al eliminar archivo:", error);
    res.status(500).json({ error: "Error al eliminar archivo." });
  }
});

// 📁 GET /api/files/:filename/download → descargar archivo
router.get("/:filename/download", async (req: Request, res: Response) => {
  const { filename } = req.params;

  try {
    const fileBuffer = await AzureBlobService.downloadFile(filename);
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.send(fileBuffer);
  } catch (error) {
    console.error("❌ Error al descargar archivo:", error);
    res.status(500).json({ error: "Error al descargar archivo." });
  }
});

export default router;
