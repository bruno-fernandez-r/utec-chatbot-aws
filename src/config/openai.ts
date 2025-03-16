//Este archivo contendrá la configuración para interactuar con la API de OpenAI.

import { OpenAI } from 'openai';  // Usa OpenAI en lugar de OpenAIApi
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuración de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,  // Asegúrate de tener esta variable en el .env
});

export { openai };
