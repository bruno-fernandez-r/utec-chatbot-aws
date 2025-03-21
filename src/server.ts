import express, { Request, Response, Application } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { searchQuery, processAllPDFs } from "./services/chatbotService";

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.post("/chat", async (req: Request, res: Response) => {
  try {
    const { query, sessionId } = req.body;

    if (!query) {
      return res.status(400).json({ error: "La consulta no puede estar vacía." });
    }

    const response = await searchQuery(query, sessionId || "default");
    return res.status(200).json({ response });
  } catch (error) {
    console.error("❌ Error en /chat:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.listen(PORT, async () => {
  console.log(`🔥 Servidor en ejecución en http://localhost:${PORT}`);
  await processAllPDFs();
});