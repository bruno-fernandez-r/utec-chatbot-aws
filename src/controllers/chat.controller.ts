
import express, { Request, Response } from "express";
import { searchQuery } from "../services/chatbotService";

const router = express.Router();

// 💬 POST /chat
router.post("/", async (req: Request, res: Response) => {
  const { query, sessionId, chatbotId } = req.body;

  if (!query || !sessionId || !chatbotId) {
    return res.status(400).json({
      error: "Faltan datos: query, sessionId o chatbotId.",
    });
  }

  try {
    const respuesta = await searchQuery(query, sessionId, chatbotId);
    res.status(200).json({ response: respuesta });
  } catch (error) {
    console.error("❌ Error en /chat:", error);
    res.status(500).json({ error: "Error procesando la consulta." });
  }
});

export default router;

