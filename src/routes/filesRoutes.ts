
import express from "express";
import multer from "multer";
import os from "os";
import {
  uploadFile,
  listFiles,
  deleteFile,
  downloadFile
} from "../controllers/filesController";

const router = express.Router();

// 📁 Configuración multer para archivos temporales en OS
const upload = multer({ dest: os.tmpdir() });

// 🔼 Subir archivo PDF
router.post("/upload", upload.single("file"), uploadFile);

// 📄 Listar archivos disponibles en Azure
router.get("/", listFiles);

// 🗑️ Eliminar archivo por nombre
router.delete("/:filename", deleteFile);

// ⬇️ Descargar archivo por nombre
router.get("/:filename/download", downloadFile);

export default router;
