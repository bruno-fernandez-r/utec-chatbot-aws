// Este archivo manejará la lógica para interactuar con Pinecone, como guardar y buscar vectores.

// ✅ Versión mejorada de pineconeService.ts con segmentación configurable, fragmentación por tokens y upsert en batch

import { generateEmbeddings } from "./openaiService";
import { pinecone } from "../config/pinecone";
import { encode } from "gpt-3-encoder";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.PINECONE_INDEX) {
  throw new Error("❌ ERROR: PINECONE_INDEX no está definido en .env");
}

// 📌 Configuración de segmentación y búsqueda
const SCORE_THRESHOLD = 0.3;
const SCORE_FALLBACK = 0.4;
const TOP_K = 15;
const MAX_TOKENS_PER_FRAGMENT = 250;

// ✅ Verificar si un documento ya existe en Pinecone
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

// ✅ Fragmentar y guardar datos en Pinecone
export async function saveVectorData(id: string, content: string) {
  try {
    const index = pinecone.index(process.env.PINECONE_INDEX!);

    // 1. Dividir en párrafos
    const paragraphs = content.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

    const fragments: { title: string; text: string }[] = [];
    let currentFragment = "";

    for (const paragraph of paragraphs) {
      const currentTokens = encode(currentFragment).length;
      const paraTokens = encode(paragraph).length;

      if (currentTokens + paraTokens <= MAX_TOKENS_PER_FRAGMENT) {
        currentFragment += paragraph + "\n\n";
      } else {
        if (currentFragment) fragments.push({ title: "Fragmento", text: currentFragment.trim() });
        currentFragment = paragraph + "\n\n";
      }
    }

    if (currentFragment) {
      fragments.push({ title: "Fragmento", text: currentFragment.trim() });
    }

    console.log(`📌 Documento segmentado en ${fragments.length} bloques.`);

    // 2. Generar todos los embeddings y guardar en batch
    const vectors = await Promise.all(
      fragments.map(async (frag, i) => {
        const sectionId = `${sanitizeId(id)}_part${i}`;
        const embedding = await generateEmbeddings(frag.text);
        return {
          id: sectionId,
          values: embedding,
          metadata: {
            content: frag.text,
            title: frag.title
          },
        };
      })
    );

    await index.upsert(vectors);
    console.log("🚀 Datos guardados en Pinecone exitosamente.");
  } catch (error) {
    console.error("❌ Error guardando en Pinecone:", error);
    throw new Error("Error guardando datos en Pinecone");
  }
}

// ✅ Buscar datos en Pinecone optimizando agrupación y contexto
export async function searchVectorData(query: string): Promise<string> {
  try {
    const index = pinecone.index(process.env.PINECONE_INDEX!);
    const embedding = await generateEmbeddings(query);

    let results = await index.query({
      vector: embedding,
      topK: TOP_K,
      includeMetadata: true,
    });

    if (!results.matches || results.matches.length === 0) {
      console.log("⚠️ No se encontraron resultados relevantes.");
      return "⚠️ No se encontraron resultados.";
    }

    let relevantMatches = results.matches.filter((match) => match.score && match.score >= SCORE_THRESHOLD);
    if (relevantMatches.length < 5) {
      console.log("⚠️ Pocos resultados con score > umbral, ampliando búsqueda...");
      relevantMatches = results.matches.filter((match) => match.score && match.score >= SCORE_FALLBACK);
    }

    if (relevantMatches.length === 0) {
      console.log("⚠️ No se encontraron coincidencias relevantes.");
      return "⚠️ No se encontraron resultados relevantes.";
    }

    const groupedResults: Record<string, string[]> = {};
    relevantMatches.forEach((match) => {
      const title = typeof match.metadata?.title === "string" ? match.metadata.title : "Información relevante";
      const content = typeof match.metadata?.content === "string" ? match.metadata.content : "";

      if (!groupedResults[title]) {
        groupedResults[title] = [];
      }

      groupedResults[title].push(content);
    });

    const finalResponse = Object.entries(groupedResults)
      .map(([title, contents]) => `🔹 *${title}*\n${contents.join("\n\n")}`)
      .join("\n\n");

    console.log(`📚 Se encontraron ${relevantMatches.length} fragmentos relevantes.`);
    return finalResponse;
  } catch (error) {
    console.error("❌ Error buscando en Pinecone:", error);
    throw new Error("Error buscando datos en Pinecone");
  }
}

// 🧽 Sanitiza ID para cumplimiento de ASCII
function sanitizeId(id: string): string {
  return id.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x00-\x7F]/g, "");
}
