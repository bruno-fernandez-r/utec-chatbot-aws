
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
const upload = multer({ dest: os.tmpdir() });

router.post("/upload", upload.single("file"), uploadFile);
router.get("/", listFiles);
router.delete("/:filename", deleteFile);
router.get("/:filename/download", downloadFile);

export default router;
