
// src/services/conversationMemory.ts

type Message = { role: "user" | "assistant"; content: string };
const sessionMemory = new Map<string, Message[]>();

export function getHistory(sessionId: string): Message[] {
  return sessionMemory.get(sessionId) || [];
}

export function appendHistory(sessionId: string, message: Message) {
  const history = getHistory(sessionId);
  const updated = [...history, message].slice(-10); // 5 pares usuario/asistente
  sessionMemory.set(sessionId, updated);
}
