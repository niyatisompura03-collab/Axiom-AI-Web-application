import { useState, useEffect } from "react";
import SettingsModal from "@/components/SettingsModal";
import ProfileModal from "@/components/ProfileModal";
import HelpModal from "@/components/HelpModal";
import ProfileDropdown from "@/components/ProfileDropdown";
import { useAuth } from "@/context/AuthContext";
import { 
  Plus, 
  MessageSquare, 
  Settings, 
  Trash2, 
  User, 
  PanelLeftClose, 
  PanelLeftOpen,
  Edit2,
  Check,
  X
} from "lucide-react";
import { useChat } from "@/context/ChatContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { conversationId, recentConversations, loadConversation, startNewChat, deleteConversation, renameConversation } = useChat();

  const { user, loading, isAuthenticated } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatar]);
  if (loading) return null; // or a spinner

  const handleStartEdit = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(title);
  };

  const handleSaveEdit = async (e: React.MouseEvent | React.FormEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (editTitle.trim()) {
      await renameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteConversation(id);
  };

  return (
    <>
      <motion.div
        animate={{ width: isOpen ? 260 : 68 }}
        transition={{ type: "spring", stiffness: 350, damping: 35 }}
        className="h-full border-r border-border bg-surface-secondary flex flex-col shrink-0 overflow-hidden relative z-20"
      >
        {/* Top Header */}
        {isOpen ? (
          <div className="h-16 px-4 flex items-center justify-between border-b border-border shrink-0">
            <div className="flex items-center gap-2.5">
              <img 
                src="/brand/axiom-mark-white.png" 
                alt="Axiom" 
                className="h-6 w-auto object-contain shrink-0 dark-logo" 
              />
              <img 
                src="/brand/axiom-mark-black.png" 
                alt="Axiom" 
                className="h-6 w-auto object-contain shrink-0 light-logo" 
              />
              <img 
                src="/brand/axiom-wordmark-white.png" 
                alt="AXIOM" 
                className="h-4.5 w-auto object-contain dark-logo" 
              />
              <img 
                src="/brand/axiom-wordmark-black.png" 
                alt="AXIOM" 
                className="h-4.5 w-auto object-contain light-logo" 
              />
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Collapse sidebar"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-input transition-colors cursor-pointer"
              title="Collapse sidebar"
            >
              <PanelLeftClose size={17} />
            </button>
          </div>
        ) : (
          <div className="h-16 px-2 flex items-center justify-center border-b border-border shrink-0">
            <button
              onClick={() => setIsOpen(true)}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-input transition-colors group cursor-pointer relative"
            >
              <img 
                src="/brand/axiom-mark-white.png" 
                alt="Axiom" 
                className="h-5.5 w-auto object-contain group-hover:opacity-0 transition-opacity dark-logo" 
              />
              <img 
                src="/brand/axiom-mark-black.png" 
                alt="Axiom" 
                className="h-5.5 w-auto object-contain group-hover:opacity-0 transition-opacity light-logo" 
              />
              <PanelLeftOpen size={18} className="absolute opacity-0 group-hover:opacity-100 text-accent transition-opacity" />
            </button>
          </div>
        )}

        {/* New Chat Action */}
        <div className={`p-3 shrink-0 ${isOpen ? '' : 'flex justify-center'}`}>
          {isOpen ? (
            <button
              onClick={() => startNewChat()}
              className="w-full h-10 flex items-center gap-2.5 px-3.5 rounded-xl border border-border bg-surface-input hover:bg-surface hover:border-accent/40 text-text-primary font-medium text-xs transition-all duration-150 active:scale-[0.99] group cursor-pointer shadow-elevation"
            >
              <Plus size={15} className="text-accent group-hover:scale-110 transition-transform shrink-0" />
              <span>New Chat</span>
            </button>
          ) : (
            <button
              onClick={() => startNewChat()}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-border bg-surface-input hover:bg-surface hover:border-accent/40 text-text-primary transition-all duration-150 active:scale-[0.98] group shrink-0 cursor-pointer shadow-elevation"
              title="New Chat"
            >
              <Plus size={16} className="text-accent group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>

        {/* Conversation History */}
        <div className={`flex-1 overflow-y-auto px-2 py-1 flex flex-col ${isOpen ? 'gap-0.5' : 'items-center gap-1.5'}`}>
          {isOpen && (
            <div className="px-3 pt-2 pb-1.5 text-[10px] uppercase tracking-wider text-text-muted font-medium select-none">
              Recent Chats
            </div>
          )}
          
          {recentConversations.map((conv) => {
            const isActive = conversationId === conv.conversation_id;
            const isEditing = editingId === conv.conversation_id;

            return isOpen ? (
              <div
                key={conv.conversation_id}
                onClick={() => !isEditing && loadConversation(conv.conversation_id)}
                className={`w-full min-h-[36px] flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left transition-colors duration-150 group cursor-pointer border ${
                  isActive 
                    ? "bg-accent-subtle/80 text-text-primary font-medium border-accent/25" 
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-input/80 border-transparent"
                }`}
              >
                <MessageSquare 
                  size={15} 
                  className={isActive ? "text-accent shrink-0" : "text-text-muted group-hover:text-text-secondary transition-colors shrink-0"} 
                />

                {isEditing ? (
                  <form 
                    onSubmit={(e) => handleSaveEdit(e, conv.conversation_id)}
                    className="flex items-center gap-1 flex-1 min-w-0"
                  >
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 h-7 bg-surface-input border border-accent rounded-lg px-2 text-xs text-text-primary outline-none focus:shadow-focus min-w-0"
                    />
                    <button 
                      type="button"
                      onClick={(e) => handleSaveEdit(e, conv.conversation_id)} 
                      aria-label="Save title"
                      className="w-6 h-6 flex items-center justify-center rounded-md text-success hover:bg-success/10 transition-colors cursor-pointer shrink-0"
                    >
                      <Check size={13} />
                    </button>
                    <button 
                      type="button"
                      onClick={handleCancelEdit} 
                      aria-label="Cancel editing"
                      className="w-6 h-6 flex items-center justify-center rounded-md text-text-muted hover:text-error hover:bg-error/10 transition-colors cursor-pointer shrink-0"
                    >
                      <X size={13} />
                    </button>
                  </form>
                ) : (
                  <>
                    <span 
                      className={`truncate flex-1 min-w-0 text-xs ${isActive ? "text-text-primary font-medium" : "text-text-secondary group-hover:text-text-primary"}`} 
                      title={conv.title}
                    >
                      {conv.title}
                    </span>
                    
                    {/* Action buttons */}
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleStartEdit(e, conv.conversation_id, conv.title)}
                        className="w-6 h-6 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
                        title="Rename"
                        aria-label="Rename conversation"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, conv.conversation_id)}
                        className="w-6 h-6 flex items-center justify-center rounded-md text-text-muted hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                        title="Delete"
                        aria-label="Delete conversation"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                key={conv.conversation_id}
                onClick={() => loadConversation(conv.conversation_id)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors duration-150 group shrink-0 border cursor-pointer ${
                  isActive 
                    ? "bg-accent-subtle/80 text-accent border-accent/25" 
                    : "text-text-muted hover:text-text-primary hover:bg-surface-input border-transparent"
                }`}
                title={conv.title}
              >
                <MessageSquare size={16} className={isActive ? "text-accent" : "text-text-muted group-hover:text-text-primary transition-colors"} />
              </button>
            );
          })}
        </div>

        {/* Bottom Actions & User Profile */}
        <div className="p-3 border-t border-border bg-surface-secondary flex flex-col items-center shrink-0">
          {isOpen ? (
            <>
              {isAuthenticated ? (
                <div 
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-surface-input hover:bg-surface border border-border cursor-pointer transition-colors relative group"
                  onClick={() => setIsProfileDropdownOpen(true)}
                >
                  <div className="w-8 h-8 rounded-lg bg-accent/20 border border-border flex items-center justify-center text-accent shrink-0 overflow-hidden">
                    {user?.avatar && !avatarError ? (
                      <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={() => setAvatarError(true)} />
                    ) : (
                      <User size={15} />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-medium text-text-primary truncate">{user?.username}</span>
                    <span className="text-[10px] text-text-muted font-normal">Free Plan</span>
                  </div>
                  <Settings size={14} className="text-text-muted group-hover:text-text-primary transition-colors shrink-0 ml-auto" />
                </div>
              ) : (
                <div className="w-full flex flex-col gap-2">
                  <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-surface-input border border-border">
                    <div className="w-7 h-7 rounded-lg bg-surface flex items-center justify-center text-text-muted shrink-0">
                      <User size={14} />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-medium text-text-primary truncate">Guest</span>
                      <span className="text-[10px] text-text-muted truncate">Not signed in</span>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full">
                    <Link 
                      href="/login" 
                      className="flex-1 h-8.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-medium flex items-center justify-center transition-colors"
                    >
                      Log in
                    </Link>
                    <Link 
                      href="/signup" 
                      className="flex-1 h-8.5 rounded-xl bg-surface hover:bg-surface-input border border-border text-text-primary text-xs font-medium flex items-center justify-center transition-colors"
                    >
                      Sign up
                    </Link>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {isAuthenticated ? (
                <button 
                  type="button"
                  className="w-10 h-10 rounded-xl bg-surface-input hover:bg-surface border border-border flex items-center justify-center text-text-primary shrink-0 cursor-pointer overflow-hidden transition-colors"
                  title={`${user?.username}`}
                  onClick={() => setIsProfileDropdownOpen(true)}
                >
                  {user?.avatar && !avatarError ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={() => setAvatarError(true)} />
                  ) : (
                    <User size={16} className="text-text-secondary" />
                  )}
                </button>
              ) : (
                <Link 
                  href="/login" 
                  className="w-10 h-10 rounded-xl bg-surface-input hover:bg-surface border border-border flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors" 
                  title="Log in / Sign up"
                >
                  <User size={16} />
                </Link>
              )}
            </>
          )}
        </div>
{showSettings && (
  <SettingsModal
    username={user?.username ?? ""}
    open={showSettings}
    onClose={() => setShowSettings(false)}
  />
)}
{showProfile && (
  <ProfileModal
    open={showProfile}
    onClose={() => setShowProfile(false)}
  />
)}
{showHelp && (
  <HelpModal
    open={showHelp}
    onClose={() => setShowHelp(false)}
  />
)}
      </motion.div>
      <ProfileDropdown 
        isOpen={isProfileDropdownOpen} 
        onClose={() => setIsProfileDropdownOpen(false)} 
        onOpenProfile={() => { setShowProfile(true); setIsProfileDropdownOpen(false); }}
        onOpenSettings={() => { setShowSettings(true); setIsProfileDropdownOpen(false); }}
        onOpenHelp={() => { setShowHelp(true); setIsProfileDropdownOpen(false); }}
      />
    </>
  );
}
