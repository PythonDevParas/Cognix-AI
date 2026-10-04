import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Zap, Waves, Cpu, Sparkles, Image as ImageIcon, Check } from 'lucide-react';
import { ModelId, CognixModel } from '../types';
import { COGNIX_MODELS } from '../data/models';

interface ModelSelectorProps {
  currentModelId: ModelId;
  onSelectModel: (modelId: ModelId) => void;
  compact?: boolean;
}

export const getModelIcon = (id: ModelId, className: string = 'w-4 h-4') => {
  switch (id) {
    case 'cognix-flash':
      return <Zap className={`${className} text-amber-500`} />;
    case 'cognix-flow':
      return <Waves className={`${className} text-blue-500`} />;
    case 'cognix-pro':
      return <Cpu className={`${className} text-purple-500`} />;
    case 'cognix-ultra':
      return <Sparkles className={`${className} text-emerald-500`} />;
    case 'cognix-imagen':
      return <ImageIcon className={`${className} text-rose-500`} />;
  }
};

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  currentModelId,
  onSelectModel,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentModel = COGNIX_MODELS.find((m) => m.id === currentModelId) || COGNIX_MODELS[1];

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50 transition shadow-xs text-sm font-medium text-neutral-800 cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className="flex items-center justify-center p-1 rounded-md bg-neutral-100">
          {getModelIcon(currentModel.id, 'w-4 h-4')}
        </span>
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-neutral-900">{currentModel.name}</span>
            <span className="text-[11px] text-neutral-400 font-normal hidden sm:inline">
              ({currentModel.engine})
            </span>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ml-1 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 rounded-xl bg-white shadow-xl border border-neutral-200/80 p-2 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-neutral-100">
          <div className="px-3 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Select Cognix Model
          </div>
          <div className="py-1 space-y-1">
            {COGNIX_MODELS.map((model) => {
              const isSelected = model.id === currentModelId;
              return (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-100/90 text-neutral-900'
                      : 'hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <div className="mt-0.5 p-1.5 rounded-md bg-white border border-neutral-200/80 shadow-2xs">
                    {getModelIcon(model.id, 'w-4 h-4')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-neutral-900">{model.name}</span>
                        {model.type === 'image' && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200">
                            Visual
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {model.engineCode}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
                      {model.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-neutral-400">
                      <span className="px-1.5 py-0.2 bg-neutral-100 rounded text-neutral-600 font-medium">
                        {model.tag}
                      </span>
                      <span>•</span>
                      <span>{model.speed}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="mt-1 text-neutral-900">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="px-3 py-2 text-[11px] text-neutral-400 bg-neutral-50/50 rounded-b-lg">
            Tip: Use <span className="font-semibold text-neutral-600">Cognix Imagen 3</span> for visuals and <span className="font-semibold text-neutral-600">Cognix Pro / Ultra</span> for deep reasoning.
          </div>
        </div>
      )}
    </div>
  );
};
