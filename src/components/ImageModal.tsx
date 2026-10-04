import React from 'react';
import { X, Download, Copy, Sparkles, ExternalLink, ZoomIn } from 'lucide-react';
import { GeneratedImage } from '../types';

interface ImageModalProps {
  image: GeneratedImage | null;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ image, onClose }) => {
  if (!image) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `cognix-imagen-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(image.prompt);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 bg-white">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-rose-50 text-rose-600 border border-rose-200">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-semibold text-neutral-900 text-sm">Cognix Imagen 3 Preview</h3>
              <p className="text-xs text-neutral-400">Aspect Ratio: {image.aspectRatio} • Engine: {image.engine}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image content */}
        <div className="flex-1 overflow-auto bg-neutral-950 flex items-center justify-center p-4">
          <img
            src={image.url}
            alt={image.prompt}
            className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-md"
          />
        </div>

        {/* Footer info */}
        <div className="p-4 bg-white border-t border-neutral-200 text-xs space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <span className="font-medium text-neutral-500">Prompt:</span>
              <p className="text-neutral-800 mt-0.5 select-text font-normal">{image.prompt}</p>
            </div>
            <button
              onClick={handleCopyPrompt}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-md transition cursor-pointer shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
          </div>
          {image.enhancedPrompt && image.enhancedPrompt !== image.prompt && (
            <div className="pt-2 border-t border-neutral-100 text-[11px] text-neutral-400">
              <span className="font-medium text-neutral-500">Enhanced Prompt Details:</span> {image.enhancedPrompt}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
