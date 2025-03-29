
import express from "express";
import cors from "cors";

import chatbotRouter from "./controllers/files.controller";
import trainingRouter from "./controllers/training.controller";
import chatRouter from "./controllers/chat.controller";

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Primero los middlewares adecuados para multipart
app.use(express.urlencoded({ extended: true })); // permite recibir formularios
app.use(express.json({ type: ['application/json', 'text/plain'] })); // evita conflictos con form-data
app.use(cors());

// 📁 Rutas
app.use("/api/files", chatbotRouter);
app.use("/api/train", trainingRouter);
app.use("/chat", chatRouter);

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
