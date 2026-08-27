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
        animate={{ width: isOpen ? 280 : 80 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="h-full border-r border-white/10 bg-[#070A10]/95 backdrop-blur-2xl flex flex-col shrink-0 overflow-hidden relative z-10"
      >
      {/* Top Header */}
      {isOpen ? (
        <div className="p-4 flex items-center justify-between border-b border-white/5 h-[73px] md:h-[89px]">
          <img 
            src="/axiom-text.png" 
            alt="AXIOM" 
            className="h-6 md:h-7 object-contain object-left filter drop-shadow-[0_0_12px_rgba(139,92,246,0.3)]" 
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Collapse sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>
      ) : (
        <div className="p-4 flex flex-col items-center justify-center border-b border-white/5 h-[73px] md:h-[89px] shrink-0 relative">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-950/40 border border-violet-500/30 shadow-[0_0_10px_rgba(139,92,246,0.35)] overflow-hidden shrink-0">
            <img 
              src="/axiom-icon.png" 
              alt="AXIOM Icon" 
              className="w-full h-full object-contain p-1" 
            />
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="absolute bottom-1 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Expand sidebar"
          >
            <PanelLeftOpen size={16} />
          </button>
        </div>
      )}

      {/* New Chat Button */}
      <div className="p-3 flex justify-center">
        {isOpen ? (
          <button
            onClick={() => startNewChat()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-white font-medium text-sm transition-all duration-300 hover:border-violet-500/40 hover:shadow-[0_0_15px_rgba(139,92,246,0.15)] group"
          >
            <Plus size={16} className="text-white group-hover:scale-110 transition-transform" />
            New Chat
          </button>
        ) : (
          <button
            onClick={() => startNewChat()}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-white transition-all duration-300 hover:border-violet-500/40 hover:shadow-[0_0_15px_rgba(139,92,246,0.15)] group shrink-0"
            title="New Chat"
          >
            <Plus size={16} className="text-violet-400 group-hover:scale-110 transition-transform" />
          </button>
        )}
      </div>

      {/* Conversation History */}
      <div className={`flex-1 overflow-y-auto px-2 py-2 flex flex-col ${isOpen ? 'gap-1' : 'items-center gap-2'}`}>
        {isOpen && (
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-semibold">
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
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm transition-all duration-200 group cursor-pointer ${
                isActive 
                  ? "bg-violet-500/10 text-violet-300 border border-violet-500/20" 
                  : "text-gray-400 hover:text-white hover:bg-white/[0.03] border border-transparent"
              }`}
            >
              <MessageSquare size={16} className={isActive ? "text-violet-400 shrink-0" : "text-gray-500 group-hover:text-gray-300 shrink-0"} />

              {isEditing ? (
                <form 
                  onSubmit={(e) => handleSaveEdit(e, conv.conversation_id)}
                  className="flex items-center gap-1 flex-1"
                >
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 bg-white/10 border border-violet-500/50 rounded px-2 py-0.5 text-xs text-white outline-none focus:ring-1 focus:ring-violet-400"
                  />
                  <button 
                    type="button"
                    onClick={(e) => handleSaveEdit(e, conv.conversation_id)} 
                    className="p-1 hover:text-green-400 text-gray-300 transition-colors"
                  >
                    <Check size={14} />
                  </button>
                  <button 
                    type="button"
                    onClick={handleCancelEdit} 
                    className="p-1 hover:text-red-400 text-gray-300 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </form>
              ) : (
                <>
                  <span className="truncate flex-1" title={conv.title}>
                    {conv.title}
                  </span>
                  
                  {/* Action buttons on hover */}
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <button
                      onClick={(e) => handleStartEdit(e, conv.conversation_id, conv.title)}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                      title="Rename"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, conv.conversation_id)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              key={conv.conversation_id}
              onClick={() => loadConversation(conv.conversation_id)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 group shrink-0 ${
                isActive 
                  ? "bg-violet-500/10 text-violet-300 border border-violet-500/20" 
                  : "text-gray-400 hover:text-white hover:bg-white/[0.03] border border-transparent"
              }`}
              title={conv.title}
            >
              <MessageSquare size={16} className={isActive ? "text-violet-400" : "text-gray-500 group-hover:text-gray-300"} />
            </button>
          );
        })}
      </div>

      {/* Bottom Actions & User Profile */}
      <div className="p-3 border-t border-white/5 space-y-1 bg-[#05070B]/50 flex flex-col items-center">
        {isOpen ? (
          <>



            {/* User Profile */}
            {isAuthenticated ? (
              <div 
                className="w-full flex items-center gap-3 px-3 py-3 mt-2 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04] transition-colors relative"
                onClick={() => setIsProfileDropdownOpen(true)}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white shrink-0 shadow-[0_0_10px_rgba(139,92,246,0.3)] overflow-hidden">
                  {user?.avatar && !avatarError ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={() => setAvatarError(true)} /> : <User size={15} />}
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-xs font-semibold text-white truncate">{user?.username}</span>
                  <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold text-gray-300 uppercase tracking-wider self-start">Free</span>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col gap-2 mt-2">
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 shrink-0">
                    <User size={15} />
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-semibold text-white truncate">Guest</span>
                    <span className="text-[9px] text-gray-500 truncate">Not logged in</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href="/login" className="flex-1 py-1.5 px-2 bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-medium rounded text-center transition-colors">
                    Log in
                  </Link>
                  <Link href="/signup" className="flex-1 py-1.5 px-2 bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium rounded text-center transition-colors">
                    Sign up
                  </Link>
                </div>
              </div>
            )}
          </>
        ) : (
          <>

            {/* User Profile */}
            {isAuthenticated ? (
              <div 
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white shrink-0 shadow-[0_0_10px_rgba(139,92,246,0.3)] cursor-pointer overflow-hidden"
                title={`${user?.username}`}
                onClick={() => setIsProfileDropdownOpen(true)}
              >
                {user?.avatar && !avatarError ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={() => setAvatarError(true)} /> : <User size={15} />}
              </div>
            ) : (
              <Link href="/login" className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400 shrink-0 hover:text-white hover:bg-gray-700 transition-colors" title="Log in / Sign up">
                <User size={15} />
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
