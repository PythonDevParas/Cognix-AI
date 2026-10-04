import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'cognix-ai-engine',
    },
  },
});

export interface CognixModelMeta {
  id: string;
  name: string;
  engine: string;
  engineCode: string;
  tag: string;
  badgeColor: string;
  description: string;
  type: 'text' | 'image';
  speed: string;
  intelligence: string;
}

const COGNIX_MODELS: Record<string, CognixModelMeta> = {
  'cognix-flash': {
    id: 'cognix-flash',
    name: 'Cognix Flash',
    engine: 'Flash-8B Engine',
    engineCode: 'gemini-1.5-flash-8b',
    tag: 'Ultra Fast',
    badgeColor: 'amber',
    description: 'Sub-second speed, ideal for quick answers, translations, and everyday productivity.',
    type: 'text',
    speed: 'Ultra Fast (150+ t/s)',
    intelligence: 'Fast & Lightweight',
  },
  'cognix-flow': {
    id: 'cognix-flow',
    name: 'Cognix Flow',
    engine: 'Flash Engine',
    engineCode: 'gemini-1.5-flash',
    tag: 'Versatile',
    badgeColor: 'blue',
    description: 'Balanced everyday intelligence for coding, creative writing, and multi-step reasoning.',
    type: 'text',
    speed: 'Fast (100+ t/s)',
    intelligence: 'Advanced General',
  },
  'cognix-pro': {
    id: 'cognix-pro',
    name: 'Cognix Pro',
    engine: 'Pro Engine',
    engineCode: 'gemini-1.5-pro',
    tag: 'Deep Reasoning',
    badgeColor: 'purple',
    description: 'Deep analytical thinking, complex programming logic, mathematical modeling, and synthesis.',
    type: 'text',
    speed: 'High Throughput',
    intelligence: 'Expert Reasoning',
  },
  'cognix-ultra': {
    id: 'cognix-ultra',
    name: 'Cognix Ultra',
    engine: 'Pro 002 Engine',
    engineCode: 'gemini-1.5-pro-002',
    tag: 'Maximum Logic',
    badgeColor: 'emerald',
    description: 'Flagship tier for multi-stage research, scientific inquiry, and rigorous architectural design.',
    type: 'text',
    speed: 'Deep Thinker',
    intelligence: 'Maximum Benchmark',
  },
  'cognix-imagen': {
    id: 'cognix-imagen',
    name: 'Cognix Imagen 3',
    engine: 'Imagen 3 Engine',
    engineCode: 'imagen-3.0-generate-002',
    tag: 'Visual Studio',
    badgeColor: 'rose',
    description: 'State-of-the-art visual generation creating photorealistic scenes, concept art, and graphics.',
    type: 'image',
    speed: 'Render Engine',
    intelligence: 'Photorealistic Visuals',
  },
};

// DDGS (DuckDuckGo Search) Real-time web search scraper
async function searchDDGS(query: string): Promise<{ title: string; snippet: string; link: string }[]> {
  try {
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    const html = await res.text();
    const results: { title: string; snippet: string; link: string }[] = [];
    
    const snippetRegex = /class="result__snippet[^"]*">([\s\S]*?)<\/a>/g;
    let sMatch;
    while ((sMatch = snippetRegex.exec(html)) !== null && results.length < 5) {
      const clean = sMatch[1].replace(/<\/?[^>]+(>|$)/g, '').trim();
      if (clean) {
        results.push({ title: 'Web Search Result', snippet: clean, link: '' });
      }
    }

    return results;
  } catch (err) {
    console.warn('DDGS search warning:', err);
    return [];
  }
}

app.get('/api/models', (_req: Request, res: Response) => {
  res.json({
    models: Object.values(COGNIX_MODELS),
    hasApiKey: Boolean(apiKey),
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

function getCandidateModelNames(modelId: string): string[] {
  switch (modelId) {
    case 'cognix-flash':
      return ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    case 'cognix-flow':
      return ['gemini-3.8-flash', 'gemini-flash-latest'];
    case 'cognix-pro':
      return ['gemini-3.8-flash', 'gemini-3.1-pro-preview'];
    case 'cognix-ultra':
      return ['gemini-3.1-pro-preview', 'gemini-3.8-flash'];
    default:
      return ['gemini-3.8-flash'];
  }
}

interface ChatHistoryItem {
  role: 'user' | 'model' | 'assistant';
  content: string;
  image?: {
    mimeType: string;
    data: string;
  };
}

function buildGenAiContents(messages: ChatHistoryItem[]) {
  return messages.map((msg) => {
    const role = msg.role === 'assistant' ? 'model' : msg.role;
    const parts: any[] = [];

    if (msg.image?.data) {
      parts.push({
        inlineData: {
          mimeType: msg.image.mimeType || 'image/jpeg',
          data: msg.image.data,
        },
      });
    }

    if (msg.content) {
      parts.push({ text: msg.content });
    } else if (parts.length === 0) {
      parts.push({ text: ' ' });
    }

    return { role, parts };
  });
}

// API: Chat endpoint with SSE streaming & DDGS Realtime Search + Fallbacks
app.post('/api/chat', async (req: Request, res: Response): Promise<void> => {
  const { model = 'cognix-flow', messages = [], systemInstruction, stream = true, enableSearch = false } = req.body;

  if (!apiKey) {
    res.status(500).json({
      error: 'GEMINI_API_KEY is not configured on the server. Please check your AI Studio environment settings.',
    });
    return;
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Messages array is required.' });
    return;
  }

  let finalSystemInstruction =
    systemInstruction ||
    `You are Cognix AI (${COGNIX_MODELS[model]?.name || 'Cognix AI'}), a cutting-edge, friendly, and deeply capable AI assistant. 
Provide accurate, structured, beautifully styled markdown responses. 
Use clear headings, code blocks with explicit language identifiers, concise bullet points when appropriate, and polite conversational tone.`;

  const latestUserMessage = messages.filter((m: any) => m.role === 'user').pop()?.content || '';
  if (enableSearch && latestUserMessage) {
    try {
      const searchResults = await searchDDGS(latestUserMessage);
      if (searchResults.length > 0) {
        const searchContext = searchResults
          .map((r, idx) => `[${idx + 1}] ${r.snippet}`)
          .join('\n');
        finalSystemInstruction += `\n\nReal-time web search results via DuckDuckGo Search (DDGS) for query "${latestUserMessage}":\n${searchContext}\n\nUse these live facts to inform your answer.`;
      }
    } catch (searchErr) {
      console.warn('Real-time search execution failed:', searchErr);
    }
  }

  const candidateModels = getCandidateModelNames(model);
  const formattedContents = buildGenAiContents(messages);

  const baseConfig: any = {
    systemInstruction: finalSystemInstruction,
  };

  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let streamSucceeded = false;
    let lastError: any = null;

    for (const targetModel of candidateModels) {
      let attempts = 0;
      while (attempts < 2) {
        try {
          const responseStream = await ai.models.generateContentStream({
            model: targetModel,
            contents: formattedContents,
            config: baseConfig,
          });

          for await (const chunk of responseStream) {
            const textChunk = chunk.text || '';
            if (textChunk) {
              res.write(`data: ${JSON.stringify({ text: textChunk, model: targetModel })}\n\n`);
            }
          }

          res.write('data: [DONE]\n\n');
          res.end();
          streamSucceeded = true;
          break;
        } catch (err: any) {
          lastError = err;
          attempts++;
          console.warn(`Model ${targetModel} stream attempt ${attempts} failed (${err.message}). Retrying/fallback...`);
          await new Promise((r) => setTimeout(r, 800));
        }
      }
      if (streamSucceeded) break;
    }

    if (!streamSucceeded) {
      const errMsg = lastError?.message || 'Error generating streaming response due to high demand. Please try again.';
      res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  } else {
    let lastError: any = null;
    for (const targetModel of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: targetModel,
          contents: formattedContents,
          config: baseConfig,
        });

        res.json({
          text: response.text || '',
          model: targetModel,
        });
        return;
      } catch (err: any) {
        lastError = err;
      }
    }
    res.status(500).json({ error: lastError?.message || 'Failed to generate response' });
  }
});

// API: Generate Image (Cognix Imagen 3)
app.post('/api/generate-image', async (req: Request, res: Response): Promise<void> => {
  const { prompt, aspectRatio = '1:1', style = 'photorealistic' } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'A prompt string is required for image generation.' });
    return;
  }

  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    return;
  }

  const enhancedPrompt = style && style !== 'none' && style !== 'default'
    ? `${prompt}, style: ${style}, highly detailed, 8k resolution, cinematic lighting, masterpiece`
    : prompt;

  try {
    const imagenResponse = await (ai.models as any).generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: enhancedPrompt,
      config: {
        numberOfImages: 1,
        aspectRatio: aspectRatio || '1:1',
        outputMimeType: 'image/jpeg',
      },
    });

    const candidateImage = imagenResponse.generatedImages?.[0]?.image;
    if (candidateImage?.imageBytes) {
      const imageUrl = `data:image/jpeg;base64,${candidateImage.imageBytes}`;
      res.json({
        imageUrl,
        prompt,
        enhancedPrompt,
        aspectRatio,
        engine: 'imagen-3.0-generate-002',
      });
      return;
    }
  } catch (imagenErr: any) {
    console.warn(`generateImages failed: ${imagenErr.message}. Trying nano banana fallback...`);
  }

  try {
    const nanoResponse = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image',
      contents: { parts: [{ text: enhancedPrompt }] },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio || '1:1',
          imageSize: '1K',
        },
      },
    });

    const parts = nanoResponse.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        const imageUrl = `data:${mime};base64,${part.inlineData.data}`;
        res.json({
          imageUrl,
          prompt,
          enhancedPrompt,
          aspectRatio,
          engine: 'gemini-3.1-flash-image',
        });
        return;
      }
    }
  } catch (nanoErr: any) {
    console.warn(`flash-image failed: ${nanoErr.message}`);
  }

  try {
    const visualDraft = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Create a clean, beautiful, minimalist SVG illustration for this prompt: "${prompt}". 
Return ONLY valid raw SVG XML without markdown fences. Viewbox: "0 0 800 800". Width="100%" height="100%".`,
    });

    const rawSvg = (visualDraft.text || '').replace(/```xml|```svg|```/g, '').trim();
    if (rawSvg.startsWith('<svg') && rawSvg.endsWith('</svg>')) {
      const base64Svg = Buffer.from(rawSvg).toString('base64');
      res.json({
        imageUrl: `data:image/svg+xml;base64,${base64Svg}`,
        prompt,
        enhancedPrompt,
        aspectRatio,
        engine: 'Cognix Vector Synthesis',
        isVectorFallback: true,
      });
      return;
    }
  } catch {
    // fallback down
  }

  res.status(500).json({
    error: 'Image generation could not be completed with the current API quota or key.',
  });
});

app.post('/api/enhance-prompt', async (req: Request, res: Response): Promise<void> => {
  const { prompt } = req.body;
  if (!prompt) {
    res.status(400).json({ error: 'Prompt is required' });
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are an elite prompt engineer for Cognix Imagen 3. 
Given this short visual idea: "${prompt}", expand it into a vivid, descriptive, high-quality prompt (1-2 sentences) detailing lighting, atmosphere, textures, colors, and perspective. Do not include quotes or intro text.`,
    });

    res.json({ enhancedPrompt: response.text?.trim() || prompt });
  } catch {
    res.json({ enhancedPrompt: prompt });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cognix AI running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
