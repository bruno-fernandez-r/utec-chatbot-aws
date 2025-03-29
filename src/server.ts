
import express from "express";
import cors from "cors";

import filesRoutes from './routes/filesRoutes';
import trainingRoutes from './routes/trainingRoutes';
import chatRoutes from './routes/chatRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Primero los middlewares adecuados para multipart
app.use(express.urlencoded({ extended: true })); // permite recibir formularios
app.use(express.json({ type: ['application/json', 'text/plain'] })); // evita conflictos con form-data
app.use(cors());

// 📁 Rutas
app.use('/files', filesRoutes);
app.use('/train', trainingRoutes);
app.use('/chat', chatRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
