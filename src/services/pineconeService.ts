// Este archivo manejará la lógica para interactuar con Pinecone, como guardar y buscar vectores.

import { generateEmbeddings } from "./openaiService";
import { pinecone } from "../config/pinecone";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.PINECONE_INDEX) {
  throw new Error("❌ ERROR: PINECONE_INDEX no está definido en .env");
}

// 📌 Configuración de segmentación y búsqueda
const SCORE_THRESHOLD = 0.5; // 🔥 Umbral para considerar resultados relevantes
const TOP_K = 8; // 🔍 Máximo de fragmentos a recuperar
const MIN_FRAGMENT_SIZE = 400; // 🔹 Mínimo tamaño de fragmento
const MAX_FRAGMENT_SIZE = 1200; // 🔹 Máximo tamaño antes de dividir

// ✅ Verificar si el documento ya existe en Pinecone
export async function documentExistsInPinecone(id: string): Promise<boolean> {
  try {
    const index = pinecone.index(process.env.PINECONE_INDEX!);
    const results = await index.query({
      vector: Array(1536).fill(0), // Vector vacío para verificar existencia
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

    // 🔍 Segmentación optimizada
    const fragments: { title: string; text: string }[] = [];
    const sections = content.split(/\n(?=\S)/g); // 📌 Divide en bloques de contenido manteniendo títulos

    let currentTitle = "Información General";
    let currentText = "";

    sections.forEach((section) => {
      const lines = section.trim().split("\n");
      if (lines.length === 1 && lines[0].length < 100) {
        // 📌 Identificamos títulos cortos como encabezados
        if (currentText.length > 0) {
          fragments.push({ title: currentTitle, text: currentText });
          currentText = "";
        }
        currentTitle = lines[0].trim();
      } else {
        if ((currentText + section).length < MAX_FRAGMENT_SIZE) {
          currentText += section + " ";
        } else {
          fragments.push({ title: currentTitle, text: currentText });
          currentText = section;
        }
      }
    });

    if (currentText.length > 0) {
      fragments.push({ title: currentTitle, text: currentText });
    }

    console.log(`📌 Documento segmentado en ${fragments.length} bloques.`);

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

// ✅ Buscar datos en Pinecone con mejor agrupación y contexto
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

    // 🔍 Aplicar filtro dinámico si hay pocos resultados relevantes
    let relevantMatches = results.matches.filter((match) => match.score && match.score >= SCORE_THRESHOLD);
    if (relevantMatches.length < 5) {
      console.log("⚠️ Pocos resultados con score > 0.5, ampliando búsqueda...");
      relevantMatches = results.matches.filter((match) => match.score && match.score >= 0.4);
    }

    if (relevantMatches.length === 0) {
      console.log("⚠️ No se encontraron coincidencias con relevancia suficiente.");
      return "⚠️ No se encontraron resultados relevantes.";
    }

    // 📌 Agrupar resultados por título
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
