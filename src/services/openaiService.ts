// Este archivo manejará la lógica para interactuar con la API de OpenAI, como la creación de embeddings y generación de respuestas.

import OpenAI from "openai";
import * as dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ✅ Función para generar embeddings con OpenAI
async function generateEmbeddings(text: string): Promise<number[]> {
  try {
    console.log("📌 Generando embeddings para:", text);
    const response = await openai.embeddings.create({
      model: process.env.OPENAI_EMBEDDING_MODEL!,
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("❌ Error generando embeddings:", error);
    throw new Error("Error generando embeddings");
  }
}

// ✅ Función para generar respuestas con OpenAI
async function generateResponse(userQuery: string, context: string = ""): Promise<string> {
  try {
    console.log("📌 Contexto proporcionado a OpenAI:", context);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: context
            ? `Eres un asistente que responde preguntas basadas en el siguiente contenido: ${context}.
               Si no encuentras información en el contenido, responde "No tengo información suficiente".`
            : "Eres un asistente de IA experto en responder preguntas.",
        },
        {
          role: "user",
          content: userQuery,
        },
      ],
      max_tokens: 200,
      temperature: 0.5,
    });

    return response.choices[0]?.message?.content || "No tengo información suficiente.";
  } catch (error) {
    console.error("❌ Error generando respuesta con OpenAI:", error);
    return "Hubo un error generando la respuesta.";
  }
}

export { generateEmbeddings, generateResponse };
