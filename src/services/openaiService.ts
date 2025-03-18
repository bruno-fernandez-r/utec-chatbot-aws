// Este archivo manejará la lógica para interactuar con la API de OpenAI, como la creación de embeddings y generación de respuestas.

import OpenAI from "openai";
import * as dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function generateEmbeddings(text: string): Promise<number[]> {
  console.log("📌 Generando embeddings para:", text);
  const response = await openai.embeddings.create({
    model: process.env.OPENAI_EMBEDDING_MODEL!,
    input: text,
  });

  return response.data[0].embedding;
}

// ✅ Generar respuesta con GPT
export async function generateResponse(userQuery: string, context: string = ""): Promise<string> {
  console.log("📌 Enviando consulta a OpenAI...");

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "system", content: `Responde usando: ${context}` }, { role: "user", content: userQuery }],
    max_tokens: 100,
  });

  return response.choices[0]?.message?.content || "No tengo información suficiente.";
}
