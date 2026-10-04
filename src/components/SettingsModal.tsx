import React, { useState } from 'react';
import { X, Settings, Trash2, Download, Check, Sparkles, Sliders } from 'lucide-react';
import { AppSettings, Conversation } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onClearAllChats: () => void;
  conversations: Conversation[];
}

const PRESET_PERSONAS = [
  {
    name: 'General Assistant',
    instruction: 'You are Cognix AI, a helpful, polite, and articulate AI assistant. Provide clear, structured, and beautifully formatted answers.',
  },
  {
    name: 'Senior Software Engineer',
    instruction: 'You are a staff-level software engineer. Prioritize concise, idiomatic, and robust code. Point out edge cases, time/space complexity, and architecture patterns.',
  },
  {
    name: 'Creative Writer',
    instruction: 'You are an expressive, evocative author and storyteller. Focus on rich imagery, vibrant prose, emotional resonance, and varied sentence rhythms.',
  },
  {
    name: 'Concise Analyst',
    instruction: 'You are an executive analyst. Deliver structured bullet points, key takeaways, zero fluff, and actionable insights.',
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onClearAllChats,
  conversations,
}) => {
  const [systemInstruction, setSystemInstruction] = useState(settings.systemInstruction);
  const [temperature, setTemperature] = useState(settings.temperature);
  const [savedFeedback, setSavedFeedback] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateSettings({
      ...settings,
      systemInstruction,
      temperature,
    });
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 600);
  };

  const handleExportAll = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(conversations, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `cognix-ai-export-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative max-w-xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-800">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 text-base">Cognix AI Settings</h3>
              <p className="text-xs text-neutral-400">Configure AI personality, defaults, and data management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Persona Presets */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
              AI Persona Presets
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_PERSONAS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setSystemInstruction(preset.instruction)}
                  className={`text-left p-2.5 rounded-lg border text-xs transition cursor-pointer ${
                    systemInstruction === preset.instruction
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50 text-neutral-800'
                  }`}
                >
                  <span className="font-semibold block">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* System Instruction */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
              Custom System Instruction
            </label>
            <textarea
              value={systemInstruction}
              onChange={(e) => setSystemInstruction(e.target.value)}
              rows={3}
              placeholder="Provide custom behavior or constraints for Cognix AI..."
              className="w-full text-xs p-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 leading-relaxed font-mono"
            />
          </div>

          {/* Temperature Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                Temperature (Creativity)
              </label>
              <span className="text-xs font-mono font-medium text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">
                {temperature.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
            />
            <div className="flex justify-between text-[11px] text-neutral-400 mt-1">
              <span>0.0 (Precise & Deterministic)</span>
              <span>1.0 (Highly Creative)</span>
            </div>
          </div>

          {/* Data & History Management */}
          <div className="pt-4 border-t border-neutral-200 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Data & Privacy
            </h4>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleExportAll}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-700 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export Chat History ({conversations.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete all chat history? This cannot be undone.')) {
                    onClearAllChats();
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-red-200 hover:bg-red-50 text-red-600 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All Conversations
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-neutral-50 border-t border-neutral-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium transition shadow-xs cursor-pointer"
          >
            {savedFeedback ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Saved</span>
              </>
            ) : (
              <span>Save Preferences</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
