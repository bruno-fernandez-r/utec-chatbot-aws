import { Request, Response } from "express";
import { searchVectorData } from "../services/pineconeService";
import { generateResponse } from "../services/openaiService";

export const chat = async (req: Request, res: Response) => {
  const { query, chatbotId, sessionId } = req.body;

  if (!query || !chatbotId || !sessionId) {
    return res.status(400).json({ error: "query, chatbotId y sessionId son requeridos." });
  }

  try {
    const context = await searchVectorData(query, chatbotId);
    const response = await generateResponse(query, context, sessionId, chatbotId);
    res.status(200).json({ response });
  } catch (error) {
    console.error("❌ Error al procesar la consulta:", error);
    res.status(500).json({ error: "Error al procesar la consulta" });
  }
};
