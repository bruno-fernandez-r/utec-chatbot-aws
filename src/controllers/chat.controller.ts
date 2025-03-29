import express, { Request, Response } from "express";
import { searchVectorData } from "../services/pineconeService";
import { generateResponse } from "../services/openaiService";

const router = express.Router();

// POST /api/chat
router.post("/", async (req: Request, res: Response) => {
  const { query, chatbotId, sessionId } = req.body;

  if (!query || !chatbotId || !sessionId) {
    return res.status(400).json({ error: "query, chatbotId y sessionId son requeridos." });
  }

  try {
    // Buscar contexto vectorial en Pinecone
    const context = await searchVectorData(query, chatbotId);

    // Generar respuesta usando OpenAI con historial de sesión
    const response = await generateResponse(query, context, sessionId);

    res.status(200).json({ response });
  } catch (error) {
    console.error("❌ Error al procesar la consulta:", error);
    res.status(500).json({ error: "Error al procesar la consulta" });
  }
});

export default router;
