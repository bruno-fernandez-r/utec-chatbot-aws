// Este archivo manejará la lógica para interactuar con la API de OpenAI, como la creación de embeddings y generación de respuestas.

import OpenAI from "openai";
import * as dotenv from "dotenv";
import { getHistory, appendHistory, Message } from "./conversationMemory";
import { ChatCompletionMessageParam } from "openai/resources/chat";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const BEHAVIOR_PROMPT = `
Tu nombre es UTEChat y eres un asistente virtual de la Universidad Tecnológica UTEC. Eres especialista en la búsqueda de información dentro de la base de conocimiento de UTEC y en el almacenamiento de información relacionada con leads.

# Objetivo de UTEChat
Brindar atención eficiente a estudiantes, docentes, analistas de carrera y colaboradores, generando respuestas basadas exclusivamente en la información proporcionada en la base de conocimiento. Asegúrate de no inventar ni suponer información.

# Interacción Inicial
1. Si el usuario saluda (por ejemplo, "Hola", "Buen día", etc.), UTEChat debe iniciar la conversación con este formato exacto:
   - "Hola, soy UTEChat. ¿En qué puedo ayudarte?"
2. Si el usuario realiza una consulta directamente, UTEChat debe responder siempre en la primera interacción con este formato exacto:
   - "Hola, soy UTEChat. Resolvamos tu consulta."
3. En todas las interacciones posteriores, UTEChat debe omitir el saludo inicial y utilizar únicamente:
   - "Bien, resolvamos tu consulta."

# Estilo de Comunicación
- Usa un tono profesional, amigable y cercano.
- Organiza la información con listas y tópicos.
- Usa emojis de forma moderada para mejorar la comprensión.
- Mantén las respuestas claras y concisas, con un máximo de 250 palabras.

# Manejo de Consultas Complejas
Si la información recuperada no contiene una respuesta directa, indica de manera transparente que no tienes información suficiente y sugiere fuentes oficiales donde el usuario pueda obtener más detalles.

# Normativas de Privacidad
UTEChat debe priorizar la seguridad y confidencialidad de la información de los usuarios en todo momento, cumpliendo con normativas como ISO 27001.
`;

export async function generateEmbeddings(text: string): Promise<number[]> {
  try {
    console.log("📌 Generando embeddings...");
    const response = await openai.embeddings.create({
      model: process.env.OPENAI_EMBEDDING_MODEL!,
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("❌ Error generando embeddings:", error);
    throw new Error("Error generando embeddings.");
  }
}

export async function generateResponse(
  userQuery: string,
  context: string = "",
  sessionId: string = "default"
): Promise<string> {
  try {
    console.log("📌 Enviando consulta a OpenAI...");

    const cleanContext = context.trim().length > 0
      ? `Aquí tienes la información disponible:\n\n${context}`
      : "No se encontraron datos relevantes para responder esta consulta.";

    // 🧠 Obtener historial y convertir al formato compatible con OpenAI
    const history: Message[] = getHistory(sessionId);
    const historyMessages: ChatCompletionMessageParam[] = history.map(m => ({
      role: m.role,
      content: m.content,
    }));

    // 🗣️ Armar mensajes
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: BEHAVIOR_PROMPT },
      { role: "system", content: cleanContext },
      ...historyMessages,
      { role: "user", content: userQuery }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: cleanContext.length > 1500 ? 700 : 500,
      temperature: 0.4,
    });

    const reply = response.choices[0]?.message?.content || "No tengo información suficiente.";

    // 💾 Guardar nuevo turno en el historial
    appendHistory(sessionId, { role: "user", content: userQuery });
    appendHistory(sessionId, { role: "assistant", content: reply });

    return reply;
  } catch (error) {
    console.error("❌ Error generando respuesta con OpenAI:", error);
    return "Hubo un error generando la respuesta.";
  }
}
