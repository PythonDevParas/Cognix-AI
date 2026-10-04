export type ModelId =
  | 'cognix-flash'
  | 'cognix-flow'
  | 'cognix-pro'
  | 'cognix-ultra'
  | 'cognix-imagen';

export interface CognixModel {
  id: ModelId;
  name: string;
  engine: string;
  engineCode: string;
  tag: string;
  badgeColor: string;
  description: string;
  type: 'text' | 'image';
  speed: string;
  intelligence: string;
  suggestedPrompts: string[];
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  enhancedPrompt?: string;
  aspectRatio: string;
  engine: string;
  isVectorFallback?: boolean;
}

export interface UserAttachment {
  mimeType: string;
  data: string; // base64
  previewUrl: string;
  fileName: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  modelId: ModelId;
  image?: GeneratedImage;
  attachment?: UserAttachment;
  isStreaming?: boolean;
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  modelId: ModelId;
  messages: ChatMessage[];
  pinned?: boolean;
  systemInstruction?: string;
}

export interface AppSettings {
  systemInstruction: string;
  temperature: number;
  defaultModelId: ModelId;
  defaultAspectRatio: string;
}
