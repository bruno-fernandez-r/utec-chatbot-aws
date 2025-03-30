
import express from 'express';
import {
  train,
  getTrainedDocuments
} from '../controllers/trainingController';

const router = express.Router();

// 🧠 Entrenar un documento para un chatbot
router.post('/:filename', train);

// 📄 Listar archivos entrenados por chatbot
router.get('/:chatbotId/documents', getTrainedDocuments);

export default router;
