
export interface Chatbot {
    id: string;
    name: string;
    description?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    createdAt: string;
  }
  