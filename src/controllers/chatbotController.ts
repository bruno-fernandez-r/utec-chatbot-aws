
import { Request, Response } from "express";
import * as chatbotService from "../services/chatbotService";
import * as promptService from "../services/promptService";

export const getAllChatbots = async (_req: Request, res: Response) => {
  const chatbots = await chatbotService.getAllChatbots();
  res.json(chatbots);
};

export const getChatbotById = async (req: Request, res: Response) => {
  const chatbot = await chatbotService.getChatbotById(req.params.id);
  if (!chatbot) return res.status(404).json({ message: "Chatbot no encontrado" });
  res.json(chatbot);
};

export const createChatbot = async (req: Request, res: Response) => {
  const newBot = await chatbotService.createChatbot(req.body);
  res.status(201).json(newBot);
};

export const deleteChatbot = async (req: Request, res: Response) => {
  const success = await chatbotService.deleteChatbot(req.params.id);
  if (!success) return res.status(404).json({ message: "Chatbot no encontrado" });

  await promptService.deletePrompt(req.params.id).catch(() => {});
  res.json({ message: "Chatbot y prompt eliminados." });
};

export const getPrompt = async (req: Request, res: Response) => {
  const prompt = await promptService.getPrompt(req.params.id);
  if (!prompt) return res.status(404).json({ message: "Prompt no encontrado" });
  res.send(prompt);
};

export const updatePrompt = async (req: Request, res: Response) => {
  const chatbotId = req.params.id;
  const prompt = req.body.prompt;

  console.log("📥 PUT /chatbots/:id/prompt llamado");
  console.log("🔍 chatbotId recibido:", chatbotId);

  if (!prompt || typeof prompt !== "string") {
    console.warn("⚠️ Prompt vacío o inválido recibido.");
    return res.status(400).json({ error: "El campo 'prompt' es requerido y debe ser texto." });
  }

  try {
    console.log("📦 Enviando prompt a Azure Blob...");
    await promptService.setPrompt(chatbotId, prompt);
    console.log(`✅ Prompt guardado exitosamente en Blob para chatbot ${chatbotId}`);
    res.json({ message: "Prompt actualizado correctamente" });
  } catch (error) {
    console.error(`❌ Error al guardar prompt para chatbot ${chatbotId}:`, error);
    res.status(500).json({ error: "Error al guardar el prompt en Azure Blob." });
  }
};

export const deletePrompt = async (req: Request, res: Response) => {
  await promptService.deletePrompt(req.params.id);
  res.json({ message: "Prompt eliminado" });
};
