import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  Settings,
  Pin,
  ChevronLeft,
  Sparkles,
  Bot,
  Image as ImageIcon,
} from 'lucide-react';
import { Conversation, ModelId } from '../types';
import { getModelIcon } from './ModelSelector';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePin: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onTogglePin,
  isOpen,
  onClose,
  onOpenSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'text' | 'image'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (filterType === 'image') return c.modelId === 'cognix-imagen';
      if (filterType === 'text') return c.modelId !== 'cognix-imagen';
      return true;
    });
  }, [conversations, searchQuery, filterType]);

  // Group by timeframe
  const groupedConversations = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    const pinned: Conversation[] = [];
    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const last7Days: Conversation[] = [];
    const older: Conversation[] = [];

    filteredConversations.forEach((conv) => {
      if (conv.pinned) {
        pinned.push(conv);
        return;
      }

      const diff = now - conv.updatedAt;
      if (diff < oneDay) {
        today.push(conv);
      } else if (diff < 2 * oneDay) {
        yesterday.push(conv);
      } else if (diff < 7 * oneDay) {
        last7Days.push(conv);
      } else {
        older.push(conv);
      }
    });

    return { pinned, today, yesterday, last7Days, older };
  }, [filteredConversations]);

  const startEditing = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditingTitle(conv.title);
  };

  const saveEditing = (id: string, e?: React.FormEvent) => {
    e?.preventDefault();
    if (editingTitle.trim()) {
      onRenameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-neutral-900/30 backdrop-blur-2xs z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 bg-neutral-50 border-r border-neutral-200 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <header className="p-3.5 flex items-center justify-between border-b border-neutral-200/80 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-neutral-900">Cognix AI</span>
              </div>
              <p className="text-[11px] text-neutral-400">Minimalist Intelligence</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 lg:hidden transition cursor-pointer"
            title="Close sidebar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </header>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white hover:bg-neutral-100 border border-neutral-200/90 rounded-xl shadow-2xs text-sm font-semibold text-neutral-800 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-neutral-900 text-white group-hover:scale-105 transition-transform">
                <Plus className="w-3.5 h-3.5" />
              </div>
              <span>New chat</span>
            </div>
            <span className="text-[11px] font-mono text-neutral-400 border border-neutral-200 px-1.5 py-0.5 rounded">
              ⌘K
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg placeholder:text-neutral-400 text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 mt-2 text-[11px] font-medium text-neutral-500">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                filterType === 'all'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('text')}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
                filterType === 'text'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              <Bot className="w-3 h-3" />
              Chat
            </button>
            <button
              onClick={() => setFilterType('image')}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
                filterType === 'image'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              <ImageIcon className="w-3 h-3 text-rose-500" />
              Imagen
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-4 text-xs">
          {conversations.length === 0 ? (
            <div className="text-center py-8 px-4 text-neutral-400">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p className="font-medium text-neutral-500">No chats yet</p>
              <p className="text-[11px] mt-1">Start a conversation to see it saved here.</p>
            </div>
          ) : (
            <>
              {groupedConversations.pinned.length > 0 && (
                <ConversationSection
                  title="Pinned"
                  conversations={groupedConversations.pinned}
                  activeId={activeConversationId}
                  editingId={editingId}
                  editingTitle={editingTitle}
                  setEditingTitle={setEditingTitle}
                  onSelect={(id) => {
                    onSelectConversation(id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  onDelete={onDeleteConversation}
                  onRename={saveEditing}
                  onStartRename={startEditing}
                  onCancelRename={() => setEditingId(null)}
                  onTogglePin={onTogglePin}
                />
              )}

              {groupedConversations.today.length > 0 && (
                <ConversationSection
                  title="Today"
                  conversations={groupedConversations.today}
                  activeId={activeConversationId}
                  editingId={editingId}
                  editingTitle={editingTitle}
                  setEditingTitle={setEditingTitle}
                  onSelect={(id) => {
                    onSelectConversation(id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  onDelete={onDeleteConversation}
                  onRename={saveEditing}
                  onStartRename={startEditing}
                  onCancelRename={() => setEditingId(null)}
                  onTogglePin={onTogglePin}
                />
              )}

              {groupedConversations.yesterday.length > 0 && (
                <ConversationSection
                  title="Yesterday"
                  conversations={groupedConversations.yesterday}
                  activeId={activeConversationId}
                  editingId={editingId}
                  editingTitle={editingTitle}
                  setEditingTitle={setEditingTitle}
                  onSelect={(id) => {
                    onSelectConversation(id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  onDelete={onDeleteConversation}
                  onRename={saveEditing}
                  onStartRename={startEditing}
                  onCancelRename={() => setEditingId(null)}
                  onTogglePin={onTogglePin}
                />
              )}

              {groupedConversations.last7Days.length > 0 && (
                <ConversationSection
                  title="Previous 7 Days"
                  conversations={groupedConversations.last7Days}
                  activeId={activeConversationId}
                  editingId={editingId}
                  editingTitle={editingTitle}
                  setEditingTitle={setEditingTitle}
                  onSelect={(id) => {
                    onSelectConversation(id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  onDelete={onDeleteConversation}
                  onRename={saveEditing}
                  onStartRename={startEditing}
                  onCancelRename={() => setEditingId(null)}
                  onTogglePin={onTogglePin}
                />
              )}

              {groupedConversations.older.length > 0 && (
                <ConversationSection
                  title="Older"
                  conversations={groupedConversations.older}
                  activeId={activeConversationId}
                  editingId={editingId}
                  editingTitle={editingTitle}
                  setEditingTitle={setEditingTitle}
                  onSelect={(id) => {
                    onSelectConversation(id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  onDelete={onDeleteConversation}
                  onRename={saveEditing}
                  onStartRename={startEditing}
                  onCancelRename={() => setEditingId(null)}
                  onTogglePin={onTogglePin}
                />
              )}
            </>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-neutral-200/80 bg-white space-y-1">
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition text-xs font-medium cursor-pointer"
          >
            <Settings className="w-4 h-4 text-neutral-500" />
            <span>Settings & Preferences</span>
          </button>

          <div className="px-3 py-1.5 flex items-center justify-between text-[11px] text-neutral-400">
            <span>Cognix AI Engine</span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Online
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

interface ConversationSectionProps {
  title: string;
  conversations: Conversation[];
  activeId: string | null;
  editingId: string | null;
  editingTitle: string;
  setEditingTitle: (t: string) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, e?: React.FormEvent) => void;
  onStartRename: (conv: Conversation, e: React.MouseEvent) => void;
  onCancelRename: () => void;
  onTogglePin: (id: string) => void;
}

const ConversationSection: React.FC<ConversationSectionProps> = ({
  title,
  conversations,
  activeId,
  editingId,
  editingTitle,
  setEditingTitle,
  onSelect,
  onDelete,
  onRename,
  onStartRename,
  onCancelRename,
  onTogglePin,
}) => {
  return (
    <div>
      <div className="px-2 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
        {title}
      </div>
      <div className="space-y-0.5 mt-0.5">
        {conversations.map((conv) => {
          const isActive = conv.id === activeId;
          const isEditing = conv.id === editingId;

          return (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg transition cursor-pointer text-xs ${
                isActive
                  ? 'bg-neutral-200/70 font-semibold text-neutral-900'
                  : 'hover:bg-neutral-100 text-neutral-700'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="shrink-0">{getModelIcon(conv.modelId, 'w-3.5 h-3.5')}</span>
                {isEditing ? (
                  <form
                    onSubmit={(e) => onRename(conv.id, e)}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 flex-1"
                  >
                    <input
                      type="text"
                      autoFocus
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded px-1.5 py-0.5 text-xs text-neutral-900 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="p-1 hover:text-emerald-600 text-neutral-600 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={onCancelRename}
                      className="p-1 hover:text-neutral-600 text-neutral-400 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <span className="truncate flex-1">{conv.title || 'New Conversation'}</span>
                )}
              </div>

              {/* Action Buttons on Hover */}
              {!isEditing && (
                <div
                  className={`flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                    isActive ? 'opacity-100' : ''
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onTogglePin(conv.id)}
                    className={`p-1 rounded hover:bg-neutral-200 transition cursor-pointer ${
                      conv.pinned ? 'text-amber-500' : 'text-neutral-400 hover:text-neutral-700'
                    }`}
                    title={conv.pinned ? 'Unpin' : 'Pin to top'}
                  >
                    <Pin className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => onStartRename(conv, e)}
                    className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition cursor-pointer"
                    title="Rename"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onDelete(conv.id)}
                    className="p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
