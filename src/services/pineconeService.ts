// Este archivo manejará la lógica para interactuar con Pinecone, como guardar y buscar vectores.

import { generateEmbeddings } from "./openaiService";
import { pinecone } from "../config/pinecone";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.PINECONE_INDEX) {
  throw new Error("❌ ERROR: PINECONE_INDEX no está definido en .env");
}

// ✅ Verificar si el documento ya existe en Pinecone
export async function documentExistsInPinecone(id: string): Promise<boolean> {
  try {
    const index = pinecone.index(process.env.PINECONE_INDEX!);
    const results = await index.query({
      vector: Array(1536).fill(0),
      topK: 1,
      includeMetadata: true,
      filter: { id },
    });

    return results.matches.length > 0;
  } catch (error) {
    console.error("❌ Error verificando en Pinecone:", error);
    return false;
  }
}

// ✅ Guardar datos en Pinecone
export async function saveVectorData(id: string, content: string) {
  try {
    const embedding = await generateEmbeddings(content);

    const index = pinecone.index(process.env.PINECONE_INDEX!);
    await index.upsert([{ id, values: embedding, metadata: { content } }]);

    console.log("✅ Datos guardados en Pinecone.");
  } catch (error) {
    console.error("❌ Error guardando en Pinecone:", error);
    throw new Error("Error guardando datos en Pinecone");
  }
}

// ✅ Buscar datos en Pinecone
export async function searchVectorData(query: string): Promise<string> {
  try {
    const embedding = await generateEmbeddings(query);

    const index = pinecone.index(process.env.PINECONE_INDEX!);
    const results = await index.query({ vector: embedding, topK: 4, includeMetadata: true });

    if (!results.matches || results.matches.length === 0) {
      return "⚠️ No se encontraron resultados.";
    }

    return results.matches.map(match => match.metadata?.content).join("\n\n");
  } catch (error) {
    console.error("❌ Error buscando en Pinecone:", error);
    throw new Error("Error buscando datos en Pinecone");
  }
}
