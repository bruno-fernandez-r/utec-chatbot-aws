// Este archivo manejará la lógica para interactuar con Pinecone, como guardar y buscar vectores.

import { generateEmbeddings } from "./openaiService";
import { pinecone } from "../config/pinecone";
import { countTokens } from "../utils/tokenCounter";
import * as dotenv from "dotenv";

dotenv.config();

// Verificar que la variable de entorno PINECONE_INDEX está definida
if (!process.env.PINECONE_INDEX) {
  throw new Error("❌ ERROR: PINECONE_INDEX no está definido en .env");
}

// Definir el tipo correcto para los resultados de Pinecone
interface PineconeMatch {
  id: string;
  score?: number;
  metadata?: {
    content?: string;
  };
}

// ✅ Función para guardar datos en Pinecone
async function saveVectorData(id: string, content: string) {
  try {
    console.log(`📌 Generando embeddings para almacenamiento: ${id}`);
    
    const embedding = await generateEmbeddings(content); // Generamos el embedding

    const objectToSave = {
      id: id, // Pinecone requiere un string como ID
      values: embedding, // El embedding generado es un array de números
      metadata: { content }, // Se guarda el contenido como metadato
    };

    // ✅ Obtener el índice de Pinecone desde las variables de entorno
    const index = pinecone.index(process.env.PINECONE_INDEX!);

    await index.upsert([
      objectToSave, // Pinecone acepta un array de objetos
    ]);

    console.log("✅ Documento almacenado correctamente en Pinecone.");
  } catch (error) {
    console.error("❌ Error guardando datos en Pinecone:", error);
    throw new Error("Error guardando datos en Pinecone");
  }
}

// ✅ Función para buscar datos en Pinecone y filtrar los más relevantes
async function searchVectorData(query: string): Promise<string> {
  try {
    console.log(`🔍 Buscando información en Pinecone para: "${query}"`);

    const embedding = await generateEmbeddings(query); // Generamos embeddings de la consulta

    // ✅ Obtener el índice de Pinecone desde las variables de entorno
    const index = pinecone.index(process.env.PINECONE_INDEX!);

    const results = await index.query({
      vector: embedding,
      topK: 2, // 🔥 Se redujo topK para evitar texto innecesario
      includeMetadata: true,
    });

    if (!results.matches || results.matches.length === 0) {
      return "⚠️ No se encontraron datos relevantes.";
    }

    // ✅ Eliminar duplicados y seleccionar el fragmento más relevante
    const uniqueMatches = new Set<string>();
    const bestMatches = results.matches
      .map((match) => {
        const content = match.metadata?.content;
        return typeof content === "string" ? content.trim() : "";
      })
      .filter((content) => content.length > 10) // Se eliminan respuestas vacías o muy cortas
      .filter((content) => {
        if (uniqueMatches.has(content)) return false; // Evitar duplicados
        uniqueMatches.add(content);
        return true;
      });

    // 🔥 Extraer solo el fragmento más relevante basado en la consulta
    const relevantMatch = bestMatches.find((content) =>
      content.toLowerCase().includes(query.toLowerCase())
    );

    const finalContent = relevantMatch || bestMatches[0] || "⚠️ No se encontraron datos relevantes.";
    
    console.log("📚 Fragmento relevante encontrado:", finalContent);
    
    return finalContent;
  } catch (error) {
    console.error("❌ Error buscando datos en Pinecone:", error);
    throw new Error("Error buscando datos en Pinecone");
  }
}

export { saveVectorData, searchVectorData };
