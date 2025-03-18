// Este archivo manejará la lógica para interactuar con Pinecone, como guardar y buscar vectores.

import { generateEmbeddings } from "./openaiService";
import { pinecone } from "../config/pinecone";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.PINECONE_INDEX) {
  throw new Error("❌ ERROR: PINECONE_INDEX no está definido en .env");
}

// 📌 Configuración
const SCORE_THRESHOLD = 0.5; // 🔥 Umbral más flexible para incluir más coincidencias
const TOP_K = 10; // 🔥 Aumentamos el número de fragmentos recuperados
const MIN_FRAGMENT_SIZE = 500; // 🔥 Mínimo tamaño de fragmento antes de dividir
const MAX_FRAGMENT_SIZE = 1000; // 🔥 Máximo tamaño de fragmento antes de dividir

// ✅ Verificar si el documento ya existe en Pinecone
export async function documentExistsInPinecone(id: string): Promise<boolean> {
  try {
    const index = pinecone.index(process.env.PINECONE_INDEX!);
    const results = await index.query({
      vector: Array(1536).fill(0), // Vector vacío solo para verificar existencia
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

// ✅ Guardar datos en Pinecone (optimizado con fragmentación más eficiente)
export async function saveVectorData(id: string, content: string) {
  try {
    const index = pinecone.index(process.env.PINECONE_INDEX!);

    // 🔹 Segmentación inteligente por tamaño de caracteres
    const fragments: { title: string; text: string }[] = [];
    const paragraphs = content.split("\n").filter((p) => p.trim().length > 0);

    let currentTitle = "Información relevante";
    let currentText = "";

    paragraphs.forEach((paragraph) => {
      if (paragraph.trim().length < 80) {
        // 🔥 Detectamos títulos (menos de 80 caracteres)
        if (currentText.length > 0) {
          fragments.push({ title: currentTitle, text: currentText });
          currentText = "";
        }
        currentTitle = paragraph.trim();
      } else {
        if ((currentText + paragraph).length < MAX_FRAGMENT_SIZE) {
          currentText += paragraph + " ";
        } else {
          fragments.push({ title: currentTitle, text: currentText });
          currentText = paragraph;
        }
      }
    });

    if (currentText.length > 0) {
      fragments.push({ title: currentTitle, text: currentText });
    }

    console.log(`📌 Documento fragmentado en ${fragments.length} bloques.`);

    // 🔥 Guardamos cada fragmento en Pinecone
    for (let i = 0; i < fragments.length; i++) {
      const sectionId = `${id}_part${i}`;
      const embedding = await generateEmbeddings(fragments[i].text);

      await index.upsert([
        {
          id: sectionId,
          values: embedding,
          metadata: { content: fragments[i].text, title: fragments[i].title },
        },
      ]);

      console.log(`✅ Fragmento ${i + 1}/${fragments.length} guardado.`);
    }
  } catch (error) {
    console.error("❌ Error guardando en Pinecone:", error);
    throw new Error("Error guardando datos en Pinecone");
  }
}

// ✅ Buscar datos en Pinecone con optimización en recuperación de contexto
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

    // 🔹 Ajustamos el umbral dinámicamente si hay pocos resultados
    let relevantMatches = results.matches.filter((match) => match.score && match.score >= SCORE_THRESHOLD);
    if (relevantMatches.length < 5) {
      console.log("⚠️ Pocos resultados con score > 0.5, ampliando búsqueda...");
      relevantMatches = results.matches.filter((match) => match.score && match.score >= 0.4);
    }

    if (relevantMatches.length === 0) {
      console.log("⚠️ No se encontraron coincidencias con relevancia suficiente.");
      return "⚠️ No se encontraron resultados relevantes.";
    }

    // 📌 Fusionamos fragmentos relacionados (si comparten título)
    const groupedResults: Record<string, string> = {};

    relevantMatches.forEach((match) => {
      const title = typeof match.metadata?.title === "string" ? match.metadata.title : "Información relevante";
      const content = typeof match.metadata?.content === "string" ? match.metadata.content : "";

      if (!groupedResults[title]) {
        groupedResults[title] = "";
      }

      groupedResults[title] += content + "\n\n";
    });

    // 🔥 Devolvemos máximo 5 fragmentos fusionados
    const finalResponse = Object.entries(groupedResults)
      .slice(0, 5)
      .map(([title, content]) => `🔹 *${title}*\n${content}`)
      .join("\n\n");

    console.log(`📚 Se encontraron ${relevantMatches.length} fragmentos relevantes.`);
    return finalResponse;
  } catch (error) {
    console.error("❌ Error buscando en Pinecone:", error);
    throw new Error("Error buscando datos en Pinecone");
  }
}
