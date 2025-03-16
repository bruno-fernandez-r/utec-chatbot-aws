//Este archivo tendrá la configuración para interactuar con Pinecone.

import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Crear una instancia de Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,  // Clave de la API de Pinecone desde .env
});

export { pinecone };
