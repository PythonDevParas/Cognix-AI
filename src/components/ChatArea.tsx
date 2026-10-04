import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Plus,
  Share2,
  Trash2,
  Volume2,
  VolumeX,
  RotateCw,
  Copy,
  Check,
  Download,
  Maximize2,
  Sparkles,
  ArrowDown,
  Info,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Conversation, ModelId, ChatMessage, GeneratedImage } from '../types';
import { COGNIX_MODELS } from '../data/models';
import { ModelSelector, getModelIcon } from './ModelSelector';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ChatInput } from './ChatInput';

interface ChatAreaProps {
  conversation: Conversation | null;
  currentModelId: ModelId;
  onSelectModel: (modelId: ModelId) => void;
  onSendMessage: (text: string, options?: any) => void;
  onStopGeneration: () => void;
  onRegenerate: (messageIndex: number) => void;
  onClearMessages: () => void;
  onNewChat: () => void;
  onToggleSidebar: () => void;
  isGenerating: boolean;
  onViewImage: (image: GeneratedImage) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  currentModelId,
  onSelectModel,
  onSendMessage,
  onStopGeneration,
  onRegenerate,
  onClearMessages,
  onNewChat,
  onToggleSidebar,
  isGenerating,
  onViewImage,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const messages = conversation?.messages || [];
  const activeModel = COGNIX_MODELS.find((m) => m.id === currentModelId) || COGNIX_MODELS[0];

  // Auto scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (isGenerating || messages.length > 0) {
      scrollToBottom('smooth');
    }
  }, [messages, isGenerating]);

  // Track scroll position to show scroll-to-bottom button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 150;
    setShowScrollBottom(isUp);
  };

  const handleCopyMessage = (msg: ChatMessage) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (msg: ChatMessage) => {
    if (!window.speechSynthesis) return;

    if (speakingId === msg.id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(msg.content);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(msg.id);
    window.speechSynthesis.speak(utterance);
  };

  const handleExportMarkdown = () => {
    if (!conversation) return;
    let md = `# ${conversation.title}\n*Exported from Cognix AI on ${new Date().toLocaleString()}*\n\n---\n\n`;
    conversation.messages.forEach((m) => {
      const author = m.role === 'user' ? '### User' : `### Cognix AI (${m.modelId || 'Assistant'})`;
      md += `${author}\n\n${m.content}\n\n`;
      if (m.image) {
        md += `![Generated Visual](${m.image.url})\n*Prompt: ${m.image.prompt}*\n\n`;
      }
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversation.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'cognix-chat'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-neutral-200/80 px-4 flex items-center justify-between bg-white z-20 shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <ModelSelector
            currentModelId={currentModelId}
            onSelectModel={onSelectModel}
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onNewChat}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition cursor-pointer"
            title="Start fresh conversation"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>

          {messages.length > 0 && (
            <>
              <button
                onClick={handleExportMarkdown}
                className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition cursor-pointer"
                title="Export conversation as Markdown"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClearMessages}
                className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                title="Clear current messages"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth"
      >
        {messages.length === 0 ? (
          /* Empty State / Welcome Screen */
          <div className="max-w-2xl mx-auto py-8 sm:py-16 text-center space-y-8 animate-in fade-in duration-300">
            <div className="space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-lg shadow-neutral-200">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                How can Cognix AI assist you today?
              </h1>
              <p className="text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
                Powered by state-of-the-art Flash, Flow, Pro, Ultra, and Imagen 3 architectures.
              </p>
            </div>

            {/* Model Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-left">
              {COGNIX_MODELS.map((model) => {
                const isSelected = model.id === currentModelId;
                return (
                  <button
                    key={model.id}
                    onClick={() => onSelectModel(model.id)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-neutral-900 bg-neutral-50/80 ring-1 ring-neutral-900 shadow-2xs'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        {getModelIcon(model.id, 'w-4 h-4')}
                        <span className="font-semibold text-xs text-neutral-900">{model.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400">{model.speed}</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 line-clamp-2">
                      {model.description}
                    </p>
                    <div className="mt-2 text-[10px] font-mono text-neutral-400">
                      {model.engine}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Suggested Prompts */}
            <div className="space-y-2 text-left">
              <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 px-1">
                Suggested for {activeModel.name}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeModel.suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(prompt)}
                    className="p-3 bg-neutral-50 hover:bg-neutral-100/90 border border-neutral-200/80 rounded-xl text-left text-xs text-neutral-700 transition cursor-pointer flex items-center justify-between group shadow-2xs"
                  >
                    <span className="font-medium group-hover:text-neutral-900 line-clamp-2">{prompt}</span>
                    <span className="text-neutral-400 group-hover:translate-x-0.5 transition-transform ml-2">
                      →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Message List */
          <div className="max-w-3xl mx-auto space-y-6 pb-4">
            {messages.map((message, idx) => {
              const isUser = message.role === 'user';
              const modelInfo = COGNIX_MODELS.find((m) => m.id === message.modelId) || activeModel;

              return (
                <div
                  key={message.id || idx}
                  className={`flex gap-3 sm:gap-4 animate-in fade-in duration-150 ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {/* Assistant Avatar */}
                  {!isUser && (
                    <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      {getModelIcon(message.modelId, 'w-4 h-4')}
                    </div>
                  )}

                  {/* Message Bubble & Content */}
                  <div
                    className={`flex flex-col space-y-1.5 max-w-[88%] sm:max-w-[82%] ${
                      isUser ? 'items-end' : 'items-start'
                    }`}
                  >
                    {/* Model metadata indicator for assistant */}
                    {!isUser && (
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-medium px-1">
                        <span className="text-neutral-800 font-semibold">{modelInfo.name}</span>
                        <span>•</span>
                        <span className="font-mono">{modelInfo.engine}</span>
                        {message.isStreaming && (
                          <span className="flex items-center gap-1 text-blue-600 font-normal">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            Generating...
                          </span>
                        )}
                      </div>
                    )}

                    {/* User Attachment Image if attached */}
                    {message.attachment && (
                      <div className="rounded-xl overflow-hidden border border-neutral-200 shadow-2xs max-w-xs mb-1">
                        <img
                          src={message.attachment.previewUrl}
                          alt="User attachment"
                          className="w-full h-auto object-cover max-h-48"
                        />
                      </div>
                    )}

                    {/* Text Container */}
                    <div
                      className={`p-4 rounded-2xl ${
                        isUser
                          ? 'bg-neutral-100 text-neutral-900 rounded-tr-xs'
                          : 'bg-white border border-neutral-200/80 rounded-tl-xs shadow-2xs w-full'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap text-[15px] leading-relaxed font-normal">
                          {message.content}
                        </p>
                      ) : (
                        <div>
                          {message.content ? (
                            <MarkdownRenderer content={message.content} />
                          ) : message.isStreaming ? (
                            <div className="flex items-center gap-2 text-neutral-400 text-sm py-2">
                              <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce"></span>
                              <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.2s]"></span>
                              <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.4s]"></span>
                            </div>
                          ) : null}

                          {/* Render Cognix Imagen 3 visual card */}
                          {message.image && (
                            <div className="mt-3 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 shadow-xs">
                              <div
                                className="relative group cursor-pointer overflow-hidden bg-neutral-950 flex items-center justify-center"
                                onClick={() => onViewImage(message.image!)}
                              >
                                <img
                                  src={message.image.url}
                                  alt={message.image.prompt}
                                  className="w-full max-h-96 object-contain group-hover:scale-101 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                  <button
                                    type="button"
                                    className="p-2.5 rounded-full bg-white/90 text-neutral-900 shadow-lg hover:scale-105 transition-transform"
                                    title="View full size"
                                  >
                                    <Maximize2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              <div className="p-3 bg-white border-t border-neutral-200/70 flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-semibold text-neutral-800">Cognix Imagen 3</span>
                                  <span className="text-neutral-400 text-[11px] ml-2 font-mono">
                                    Ratio: {message.image.aspectRatio}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = message.image!.url;
                                      link.download = `cognix-imagen-${Date.now()}.png`;
                                      link.click();
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-md transition cursor-pointer"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Download</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Error block */}
                          {message.error && (
                            <div className="mt-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                              <div className="flex-1">
                                <p className="font-semibold">Unable to complete request</p>
                                <p className="mt-0.5 text-red-600">{message.error}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    {!isUser && !message.isStreaming && message.content && (
                      <div className="flex items-center gap-1 text-neutral-400 px-1 pt-0.5">
                        <button
                          onClick={() => handleCopyMessage(message)}
                          className="p-1 rounded hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
                          title="Copy response"
                        >
                          {copiedId === message.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleSpeak(message)}
                          className={`p-1 rounded hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer ${
                            speakingId === message.id ? 'text-blue-600' : ''
                          }`}
                          title="Read aloud"
                        >
                          {speakingId === message.id ? (
                            <VolumeX className="w-3.5 h-3.5" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => onRegenerate(idx)}
                          className="p-1 rounded hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
                          title="Regenerate with current model"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Scroll to Bottom button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-28 right-8 z-30 p-2 rounded-full bg-white border border-neutral-300 text-neutral-700 shadow-md hover:bg-neutral-50 transition-all cursor-pointer animate-in fade-in"
          title="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Fixed Bottom Input Area */}
      <div className="bg-gradient-to-t from-white via-white to-transparent pt-3 z-20">
        <ChatInput
          currentModelId={currentModelId}
          onSendMessage={onSendMessage}
          onStopGeneration={onStopGeneration}
          isGenerating={isGenerating}
          onSelectModel={onSelectModel}
        />
      </div>
    </div>
  );
};
