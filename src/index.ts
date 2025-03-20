// Este es el punto de entrada del proyecto. Aquí, conectamos todo y usamos las funciones de OpenAI y Pinecone.

import express, { Request, Response, Application } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { searchQuery, processAllPDFs } from "./services/chatbotService";

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// 🔍 Endpoint para consultas del usuario
app.post("/chat", async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "La consulta no puede estar vacía." });
    }

    const response = await searchQuery(query);
    return res.status(200).json({ response });
  } catch (error) {
    console.error("❌ Error en /chat:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// 🚀 Iniciar servidor
app.listen(PORT, async () => {
  console.log(`🔥 Servidor en ejecución en http://localhost:${PORT}`);
  await processAllPDFs();
});


