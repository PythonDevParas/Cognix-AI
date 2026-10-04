import React, { useState, useEffect, useRef } from 'react';
import { Conversation, ModelId, ChatMessage, AppSettings, GeneratedImage, UserAttachment } from './types';
import { COGNIX_MODELS } from './data/models';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { ImageModal } from './components/ImageModal';
import { SettingsModal } from './components/SettingsModal';

const STORAGE_KEY_CONVERSATIONS = 'cognix_ai_conversations_v2';
const STORAGE_KEY_SETTINGS = 'cognix_ai_settings_v2';
const STORAGE_KEY_CURRENT_ID = 'cognix_ai_current_conv_id';

const DEFAULT_SETTINGS: AppSettings = {
  systemInstruction: 'You are Cognix AI, a helpful, precise, and articulate AI assistant. Provide clean, beautifully formatted markdown answers.',
  temperature: 0.7,
  defaultModelId: 'cognix-flow',
  defaultAspectRatio: '1:1',
};

const INITIAL_CONVERSATION: Conversation = {
  id: 'welcome-conv',
  title: 'Welcome to Cognix AI',
  createdAt: Date.now() - 3600000,
  updatedAt: Date.now() - 3600000,
  modelId: 'cognix-flow',
  pinned: true,
  messages: [
    {
      id: 'welcome-msg-1',
      role: 'assistant',
      modelId: 'cognix-flow',
      timestamp: Date.now() - 3600000,
      content: `### Welcome to Cognix AI ✨

Cognix AI is your minimalist, high-performance intelligence workspace with dedicated architectures for every task:

- ⚡ **Cognix Flash** (*Gemini-1.5-flash-8b*) — Ultra-fast, sub-second responses for quick questions and translations.
- 🌊 **Cognix Flow** (*Gemini-1.5-flash*) — Balanced, versatile daily driver for writing, summarizing, and reasoning.
- 🧠 **Cognix Pro** (*Gemini-1.5-Pro*) — Deep reasoning, code refactoring, and complex technical challenges.
- 🚀 **Cognix Ultra** (*Gemini-1.5-Pro-002*) — Flagship benchmark intelligence for scientific analysis and rigorous critique.
- 🎨 **Cognix Imagen 3** (*Imagen 3*) — High-fidelity visual generation directly inside your chat stream.

**Try asking a question, switching models in the top bar, or switching to Cognix Imagen 3 to generate artwork!**`,
    },
  ],
};

export default function App() {
  // Load settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Load conversations
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return [INITIAL_CONVERSATION];
    } catch {
      return [INITIAL_CONVERSATION];
    }
  });

  const [activeConversationId, setActiveConversationId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CURRENT_ID);
    return saved || 'welcome-conv';
  });

  const [currentModelId, setCurrentModelId] = useState<ModelId>('cognix-flow');
  const [isGenerating, setIsGenerating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(conversations));
    } catch (e) {
      console.error('Failed to save conversations to localStorage', e);
    }
  }, [conversations]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }, [settings]);

  useEffect(() => {
    if (activeConversationId) {
      localStorage.setItem(STORAGE_KEY_CURRENT_ID, activeConversationId);
    }
  }, [activeConversationId]);

  // Find active conversation
  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  // Sync current model when switching conversation
  useEffect(() => {
    if (activeConversation?.modelId) {
      setCurrentModelId(activeConversation.modelId);
    }
  }, [activeConversationId]);

  // Keyboard shortcut listener (Cmd/Ctrl + K for new chat)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [conversations]);

  // Create New Chat
  const handleNewChat = (modelIdToUse?: ModelId) => {
    const model = modelIdToUse || currentModelId;
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      modelId: model,
      messages: [],
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    setCurrentModelId(model);
  };

  // Switch Model
  const handleSelectModel = (modelId: ModelId) => {
    setCurrentModelId(modelId);
    if (activeConversation) {
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConversation.id ? { ...c, modelId } : c))
      );
    }
  };

  // Delete Conversation
  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      if (id === activeConversationId) {
        if (updated.length > 0) {
          setActiveConversationId(updated[0].id);
        } else {
          // create a fresh conversation
          const fresh: Conversation = {
            id: `conv-${Date.now()}`,
            title: 'New Chat',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            modelId: currentModelId,
            messages: [],
          };
          setActiveConversationId(fresh.id);
          return [fresh];
        }
      }
      return updated;
    });
  };

  // Rename Conversation
  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  // Toggle Pin
  const handleTogglePin = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    );
  };

  // Clear Messages in current conversation
  const handleClearMessages = () => {
    if (!activeConversation) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversation.id ? { ...c, messages: [], updatedAt: Date.now() } : c))
    );
  };

  // Clear All Conversations
  const handleClearAllChats = () => {
    const fresh: Conversation = {
      id: `conv-${Date.now()}`,
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      modelId: currentModelId,
      messages: [],
    };
    setConversations([fresh]);
    setActiveConversationId(fresh.id);
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);

    // mark streaming message as complete
    if (activeConversationId) {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeConversationId) return c;
          const msgs = c.messages.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m));
          return { ...c, messages: msgs };
        })
      );
    }
  };

  // Send message flow
  const handleSendMessage = async (
    text: string,
    options?: { aspectRatio?: string; style?: string; attachment?: UserAttachment; enableSearch?: boolean }
  ) => {
    if (isGenerating) return;

    let targetConvId = activeConversationId;
    let currentConv = activeConversation;

    // If no active conversation, create one
    if (!currentConv) {
      const freshConv: Conversation = {
        id: `conv-${Date.now()}`,
        title: text.slice(0, 30) || 'New Chat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        modelId: currentModelId,
        messages: [],
      };
      setConversations((prev) => [freshConv, ...prev]);
      setActiveConversationId(freshConv.id);
      targetConvId = freshConv.id;
      currentConv = freshConv;
    }

    const userMessageId = `user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      modelId: currentModelId,
      attachment: options?.attachment,
    };

    // Auto title if first message
    const isFirstMessage = (currentConv.messages || []).length === 0;
    const newTitle = isFirstMessage ? text.slice(0, 34) || 'New Chat' : currentConv.title;

    // Append user message
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== targetConvId) return c;
        return {
          ...c,
          title: newTitle,
          updatedAt: Date.now(),
          messages: [...c.messages, userMessage],
        };
      })
    );

    // ----------------------------------------------------
    // BRANCH 1: Cognix Imagen 3 (Visual Generation)
    // ----------------------------------------------------
    if (currentModelId === 'cognix-imagen') {
      const assistantMessageId = `assist-${Date.now()}`;
      const placeholderMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: `Generating visual rendering with **Cognix Imagen 3** for: *"${text}"*...`,
        timestamp: Date.now(),
        modelId: 'cognix-imagen',
        isStreaming: true,
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConvId ? { ...c, messages: [...c.messages, placeholderMessage] } : c
        )
      );

      setIsGenerating(true);

      try {
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: text,
            aspectRatio: options?.aspectRatio || settings.defaultAspectRatio || '1:1',
            style: options?.style || 'photorealistic',
          }),
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || 'Failed to generate visual');
        }

        const generatedImage: GeneratedImage = {
          url: data.imageUrl,
          prompt: data.prompt,
          enhancedPrompt: data.enhancedPrompt,
          aspectRatio: data.aspectRatio,
          engine: data.engine || 'imagen-3.0-generate-002',
          isVectorFallback: data.isVectorFallback,
        };

        const successText = `Here is your visual generated by **Cognix Imagen 3** (${data.engine}):\n\n> *${data.enhancedPrompt || data.prompt}*`;

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== targetConvId) return c;
            const updated = c.messages.map((m) =>
              m.id === assistantMessageId
                ? {
                    ...m,
                    content: successText,
                    image: generatedImage,
                    isStreaming: false,
                  }
                : m
            );
            return { ...c, messages: updated, updatedAt: Date.now() };
          })
        );
      } catch (err: any) {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== targetConvId) return c;
            const updated = c.messages.map((m) =>
              m.id === assistantMessageId
                ? {
                    ...m,
                    content: 'Sorry, Cognix Imagen 3 encountered an issue generating this image.',
                    error: err.message || 'Image generation error',
                    isStreaming: false,
                  }
                : m
            );
            return { ...c, messages: updated };
          })
        );
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // ----------------------------------------------------
    // BRANCH 2: Text Chat Models (Flash, Flow, Pro, Ultra)
    // ----------------------------------------------------
    const assistantMessageId = `assist-${Date.now()}`;
    const initialAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      modelId: currentModelId,
      isStreaming: true,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetConvId ? { ...c, messages: [...c.messages, initialAssistantMessage] } : c
      )
    );

    setIsGenerating(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Prepare message payload
    const existingMessages = currentConv.messages || [];
    const historyPayload = [...existingMessages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
      image: m.attachment
        ? {
            mimeType: m.attachment.mimeType,
            data: m.attachment.data,
          }
        : undefined,
    }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          model: currentModelId,
          messages: historyPayload,
          systemInstruction: settings.systemInstruction,
          temperature: settings.temperature,
          stream: true,
          enableSearch: options?.enableSearch || false,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported in response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const rawData = line.replace('data: ', '').trim();
            if (rawData === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(rawData);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.text) {
                accumulatedText += parsed.text;
                // Update message stream content
                setConversations((prev) =>
                  prev.map((c) => {
                    if (c.id !== targetConvId) return c;
                    const msgs = c.messages.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, content: accumulatedText, isStreaming: true }
                        : m
                    );
                    return { ...c, messages: msgs };
                  })
                );
              }
            } catch {
              // ignore parse errors on partial chunks
            }
          }
        }
      }

      // Finalize message
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== targetConvId) return c;
          const msgs = c.messages.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content: accumulatedText, isStreaming: false }
              : m
          );
          return { ...c, messages: msgs, updatedAt: Date.now() };
        })
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // user clicked stop
        return;
      }

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== targetConvId) return c;
          const msgs = c.messages.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  error: err.message || 'Error occurred while contacting Cognix AI',
                  isStreaming: false,
                }
              : m
          );
          return { ...c, messages: msgs };
        })
      );
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Regenerate Response
  const handleRegenerate = (messageIndex: number) => {
    if (!activeConversation) return;
    const msgs = activeConversation.messages;
    if (messageIndex <= 0) return;

    // Find preceding user message
    const userMsg = msgs[messageIndex - 1];
    if (userMsg?.role === 'user') {
      // Remove assistant message
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeConversation.id) return c;
          return { ...c, messages: msgs.slice(0, messageIndex) };
        })
      );
      // Re-trigger send
      handleSendMessage(userMsg.content, { attachment: userMsg.attachment });
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-neutral-900 font-sans">
      {/* Sidebar navigation */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onNewChat={() => handleNewChat()}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePin={handleTogglePin}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenSettings={() => setSettingsModalOpen(true)}
      />

      {/* Main chat surface */}
      <ChatArea
        conversation={activeConversation}
        currentModelId={currentModelId}
        onSelectModel={handleSelectModel}
        onSendMessage={handleSendMessage}
        onStopGeneration={handleStopGeneration}
        onRegenerate={handleRegenerate}
        onClearMessages={handleClearMessages}
        onNewChat={() => handleNewChat()}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isGenerating={isGenerating}
        onViewImage={(img) => setPreviewImage(img)}
      />

      {/* Image Lightbox modal */}
      <ImageModal image={previewImage} onClose={() => setPreviewImage(null)} />

      {/* Settings modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        onClearAllChats={handleClearAllChats}
        conversations={conversations}
      />
    </div>
  );
}
