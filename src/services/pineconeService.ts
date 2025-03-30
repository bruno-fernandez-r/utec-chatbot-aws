import { generateEmbeddings } from "./openaiService";
import { pinecone } from "../config/pinecone";
import { encode } from "gpt-3-encoder";
import * as dotenv from "dotenv";
import { Message } from "./conversationMemory";

dotenv.config();

const SCORE_THRESHOLD = 0.3;
const SCORE_FALLBACK = 0.4;
const TOP_K = 15;
const MAX_TOKENS_PER_FRAGMENT = 250;

export async function saveVectorData(filename: string, content: string, chatbotId: string) {
  try {
    const index = pinecone.index(process.env.PINECONE_INDEX!);

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

    const vectors = await Promise.all(
      fragments.map(async (frag, i) => {
        const sectionId = `${sanitizeId(chatbotId)}_${sanitizeId(filename)}_part${i}`;
        const embedding = await generateEmbeddings(frag.text);
        return {
          id: sectionId,
          values: embedding,
          metadata: {
            content: frag.text,
            title: frag.title,
            filename,
            chatbotId,
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

export async function documentExistsInPinecone(filename: string, chatbotId: string): Promise<boolean> {
  try {
    const index = pinecone.index(process.env.PINECONE_INDEX!);
    const results = await index.query({
      vector: Array(1536).fill(0),
      topK: 1,
      includeMetadata: true,
      filter: {
        filename: { $eq: filename },
        chatbotId: { $eq: chatbotId },
      },
    });
    return results.matches?.some(match => match.id.startsWith(`${sanitizeId(chatbotId)}_${sanitizeId(filename)}_part`)) ?? false;
  } catch (error) {
    console.error("❌ Error verificando en Pinecone:", error);
    return false;
  }
}

export async function deleteVectorsManualmente(filename: string, chatbotId: string) {
  try {
    const index = pinecone.index(process.env.PINECONE_INDEX!);

    // 1️⃣ Buscar vectores por query + filtro
    const results = await index.query({
      vector: Array(1536).fill(0),
      topK: 1000,
      includeMetadata: true,
      filter: {
        chatbotId: { $eq: chatbotId },
        filename: { $eq: filename }
      }
    });

    const idsToDelete = results.matches?.map(match => match.id) || [];

    console.log("🆔 IDs a eliminar:", idsToDelete);

    if (idsToDelete.length === 0) {
      console.log("⚠️ No se encontraron vectores para eliminar.");
      return;
    }

    // ✅ Eliminar por ID (permitido en Serverless)
    for (const id of idsToDelete) {
      await index.deleteOne(id);
      console.log(`🧽 Vector eliminado: ${id}`);
    }
    

    console.log(`🧹 Eliminados ${idsToDelete.length} vectores del archivo '${filename}' para chatbot '${chatbotId}'`);
  } catch (error) {
    console.error("❌ Error eliminando vectores:", error);
  }
}

export async function findChatbotsByFilename(filename: string): Promise<string[]> {
  try {
    const index = pinecone.index(process.env.PINECONE_INDEX!);

    const results = await index.query({
      vector: Array(1536).fill(0),
      topK: 1000,
      includeMetadata: true,
      filter: { filename: { $eq: filename } },
    });

    const bots = results.matches
      ?.map(m => m.metadata?.chatbotId)
      .filter(Boolean) as string[];

    return Array.from(new Set(bots));
  } catch (error) {
    console.error("❌ Error buscando bots por archivo:", error);
    return [];
  }
}



export async function searchVectorData(query: string, chatbotId: string, _history: Message[] = []): Promise<string> {
  try {
    const index = pinecone.index(process.env.PINECONE_INDEX!);
    const embedding = await generateEmbeddings(query);

    const results = await index.query({
      vector: embedding,
      topK: TOP_K,
      includeMetadata: true,
      filter: {
        chatbotId: { $eq: chatbotId },
      },
    });

    if (!results.matches || results.matches.length === 0) {
      return "⚠️ No se encontraron resultados.";
    }

    let relevantMatches = results.matches.filter((m) => m.score && m.score >= SCORE_THRESHOLD);
    if (relevantMatches.length < 5) {
      relevantMatches = results.matches.filter((m) => m.score && m.score >= SCORE_FALLBACK);
    }

    if (relevantMatches.length === 0) {
      return "⚠️ No se encontraron resultados relevantes.";
    }

    const groupedResults: Record<string, string[]> = {};
    relevantMatches.forEach((match) => {
      const title = typeof match.metadata?.title === "string" ? match.metadata.title : "Información relevante";
      const content = typeof match.metadata?.content === "string" ? match.metadata.content : "";
      const source = match.metadata?.filename || "desconocido";

      if (!groupedResults[title]) {
        groupedResults[title] = [];
      }

      groupedResults[title].push(`${content}\n(Fuente: ${source})`);
    });

    const finalResponse = Object.entries(groupedResults)
      .map(([title, contents]) => `🔹 *${title}*\n${contents.join("\n\n")}`)
      .join("\n\n");

    return finalResponse;
  } catch (error) {
    console.error("❌ Error buscando en Pinecone:", error);
    throw new Error("Error buscando datos en Pinecone");
  }
}

export async function listDocumentsByChatbot(chatbotId: string): Promise<string[]> {
  try {
    const index = pinecone.index(process.env.PINECONE_INDEX!);

    const results = await index.query({
      vector: Array(1536).fill(0),
      topK: 1000,
      includeMetadata: true,
      filter: {
        chatbotId: { $eq: chatbotId },
      },
    });

    const filenames = results.matches?.map(m => m.metadata?.filename).filter(Boolean) as string[];
    return Array.from(new Set(filenames));
  } catch (error) {
    console.error("❌ Error listando documentos por chatbot:", error);
    return [];
  }
}



function sanitizeId(id: string): string {
  return id.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x00-\x7F]/g, "");
}
