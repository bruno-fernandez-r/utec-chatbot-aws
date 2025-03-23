import express, { Request, Response, Application } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import path from "path";
import { handleUpload } from "./services/uploadService";
import { searchQuery } from "./services/chatbotService";

// Configuración de Express
const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Multer en memoria para subida de archivos
const upload = multer({ storage: multer.memoryStorage() });

// 🧠 Endpoint del chatbot
app.post("/chat", async (req: Request, res: Response) => {
  try {
    const { query, sessionId } = req.body;

    if (!query || !sessionId) {
      return res.status(400).json({ error: "Faltan campos requeridos: 'query' y 'sessionId'." });
    }

    const response = await searchQuery(query, sessionId);
    return res.status(200).json({ response });
  } catch (error) {
    console.error("❌ Error en /chat:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// 📤 Endpoint para subir y procesar un archivo
app.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No se subió ningún archivo." });
    }

    console.log("🟢 /upload alcanzado:", file.originalname);

    const result = await handleUpload(file, "documentos"); // carpeta lógica en S3
    res.status(200).json({ message: "Archivo procesado correctamente", url: result });
  } catch (error) {
    console.error("❌ Error en /upload:", error);
    res.status(500).json({ error: "Error al procesar el documento." });
  }
});

// 🚀 Levantar servidor
app.listen(PORT, () => {
  console.log(`🔥 Servidor en ejecución en http://localhost:${PORT}`);
});
