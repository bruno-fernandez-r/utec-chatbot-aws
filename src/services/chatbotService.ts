import pdfParse from "pdf-parse";
import fs from "fs";
import path from "path";
import { generateEmbeddings, generateResponse } from "./openaiService";
import {
  searchVectorData
} from "./pineconeService";

// 🤖 Procesar una consulta con historial incluido
export async function searchQuery(query: string, sessionId: string, chatbotId: string): Promise<string> {
  try {
    console.log(`🗣️ Consulta recibida: ${query}`);

    // 🔍 Buscar contexto relevante en Pinecone solo para el chatbot dado
    const context = await searchVectorData(query, chatbotId);

    // 🤖 Generar respuesta usando contexto y sesión
    const response = await generateResponse(query, context, sessionId);

    console.log(`💬 Respuesta generada: ${response}`);
    return response;
  } catch (error) {
    console.error("❌ Error en searchQuery:", error);
    throw new Error("Error procesando la consulta.");
  }
}
