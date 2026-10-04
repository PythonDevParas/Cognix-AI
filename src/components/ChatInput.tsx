import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Sparkles,
  Paperclip,
  X,
  SlidersHorizontal,
  ChevronDown,
  Waves,
  Globe,
} from 'lucide-react';
import { ModelId, UserAttachment } from '../types';
import { COGNIX_MODELS, ASPECT_RATIOS, IMAGE_STYLES } from '../data/models';
import { getModelIcon } from './ModelSelector';

interface ChatInputProps {
  currentModelId: ModelId;
  onSendMessage: (
    text: string,
    options?: { aspectRatio?: string; style?: string; attachment?: UserAttachment; enableSearch?: boolean }
  ) => void;
  onStopGeneration?: () => void;
  isGenerating: boolean;
  onSelectModel: (modelId: ModelId) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  currentModelId,
  onSendMessage,
  onStopGeneration,
  isGenerating,
  onSelectModel,
}) => {
  const [text, setText] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageStyle, setImageStyle] = useState('photorealistic');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [attachment, setAttachment] = useState<UserAttachment | null>(null);
  const [enableSearch, setEnableSearch] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImageModel = currentModelId === 'cognix-imagen';
  const currentModel = COGNIX_MODELS.find((m) => m.id === currentModelId) || COGNIX_MODELS[0];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if ((!trimmed && !attachment) || isGenerating) return;

    onSendMessage(trimmed, {
      aspectRatio,
      style: imageStyle,
      attachment: attachment || undefined,
      enableSearch,
    });

    setText('');
    setAttachment(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPEG, WebP, etc.).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      setAttachment({
        mimeType: file.type,
        data: base64Data,
        previewUrl: result,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEnhancePrompt = async () => {
    if (!text.trim() || isEnhancing) return;
    setIsEnhancing(true);

    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await res.json();
      if (data.enhancedPrompt) {
        setText(data.enhancedPrompt);
      }
    } catch {
      // silent fallback
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      {/* Visual Controls for Cognix Imagen 3 */}
      {isImageModel && (
        <div className="mb-2 p-2.5 bg-neutral-50/90 border border-neutral-200/80 rounded-xl space-y-2 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-medium text-neutral-600">
              <span className="p-1 rounded bg-rose-50 text-rose-600">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <span>Cognix Imagen 3 Visual Engine</span>
            </div>

            <button
              type="button"
              onClick={handleEnhancePrompt}
              disabled={!text.trim() || isEnhancing}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 disabled:opacity-40 disabled:pointer-events-none rounded-lg border border-purple-200/80 transition cursor-pointer"
            >
              <Sparkles className={`w-3 h-3 ${isEnhancing ? 'animate-spin' : ''}`} />
              <span>{isEnhancing ? 'Enhancing...' : 'Enhance Prompt'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-neutral-200/60">
            <div className="flex items-center gap-1">
              <span className="text-neutral-400 text-[11px] font-medium mr-1">Aspect:</span>
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.value}
                  type="button"
                  onClick={() => setAspectRatio(ratio.value)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                    aspectRatio === ratio.value
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {ratio.label}
                </button>
              ))}
            </div>

            <div className="relative ml-auto">
              <button
                type="button"
                onClick={() => setShowStyleMenu(!showStyleMenu)}
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-white border border-neutral-200 text-[11px] font-medium text-neutral-700 hover:bg-neutral-100 cursor-pointer"
              >
                <SlidersHorizontal className="w-3 h-3 text-neutral-500" />
                <span>Style: {IMAGE_STYLES.find((s) => s.id === imageStyle)?.label || 'Photorealistic'}</span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>

              {showStyleMenu && (
                <div className="absolute right-0 bottom-full mb-1 w-44 bg-white border border-neutral-200 rounded-lg shadow-lg p-1 z-30 space-y-0.5">
                  {IMAGE_STYLES.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => {
                        setImageStyle(style.id);
                        setShowStyleMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition cursor-pointer ${
                        imageStyle === style.id
                          ? 'bg-neutral-100 font-semibold text-neutral-900'
                          : 'hover:bg-neutral-50 text-neutral-700'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attachment Preview */}
      {attachment && (
        <div className="mb-2 flex items-center gap-2 p-2 bg-neutral-50 border border-neutral-200 rounded-xl w-fit animate-in fade-in duration-100">
          <img
            src={attachment.previewUrl}
            alt="Upload preview"
            className="w-12 h-12 object-cover rounded-lg border border-neutral-200"
          />
          <div className="text-xs pr-2">
            <p className="font-medium text-neutral-800 truncate max-w-48">{attachment.fileName}</p>
            <p className="text-[10px] text-neutral-400">Attached for multimodal reasoning</p>
          </div>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Input Box */}
      <div className="relative flex flex-col bg-white border border-neutral-300 rounded-2xl shadow-sm focus-within:border-neutral-500 focus-within:shadow-md transition-all duration-150">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isImageModel
              ? 'Describe the image you want Cognix Imagen 3 to generate...'
              : `Message ${currentModel.name} (${currentModel.engineCode})...`
          }
          rows={1}
          className="w-full pt-3.5 px-4 pb-2 text-[15px] bg-transparent text-neutral-900 placeholder:text-neutral-400 resize-none focus:outline-none max-h-48 leading-relaxed font-normal"
        />

        {/* Input Footer toolbar */}
        <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-neutral-100">
          <div className="flex items-center gap-1.5">
            {/* Attachment Button */}
            {!isImageModel && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition cursor-pointer"
                  title="Attach image for visual analysis"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Real-time DDGS Search Toggle */}
                <button
                  type="button"
                  onClick={() => setEnableSearch(!enableSearch)}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg transition cursor-pointer ${
                    enableSearch
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 font-medium'
                      : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'
                  }`}
                  title="Toggle real-time web search (DDGS)"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Search {enableSearch ? 'ON' : 'OFF'}</span>
                </button>
              </>
            )}

            {/* Switch Mode */}
            {!isImageModel ? (
              <button
                type="button"
                onClick={() => onSelectModel('cognix-imagen')}
                className="flex items-center gap-1 px-2 py-1 text-xs text-neutral-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                title="Switch to Cognix Imagen 3"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden sm:inline">Image Mode</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onSelectModel('cognix-flow')}
                className="flex items-center gap-1 px-2 py-1 text-xs text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                title="Switch to Chat Mode"
              >
                <Waves className="w-3.5 h-3.5 text-blue-500" />
                <span className="hidden sm:inline">Text Mode</span>
              </button>
            )}

            <div className="hidden md:flex items-center gap-1 text-[11px] text-neutral-400 font-medium px-2 py-0.5 bg-neutral-100 rounded-md">
              {getModelIcon(currentModel.id, 'w-3 h-3')}
              <span className="text-neutral-600">{currentModel.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isGenerating ? (
              <button
                type="button"
                onClick={onStopGeneration}
                className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white transition shadow-xs cursor-pointer flex items-center justify-center"
                title="Stop generation"
              >
                <Square className="w-4 h-4 fill-white" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!text.trim() && !attachment}
                className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 text-white transition shadow-xs cursor-pointer disabled:cursor-not-allowed flex items-center justify-center"
                title="Send message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-neutral-400">
        <span>Enter to send • Shift + Enter for new line</span>
        <span>Cognix AI can make mistakes. Check important info.</span>
      </div>
    </div>
  );
};
