import { useState } from "react";
import TypingIndicator from "./TypingIndicator";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { Copy, RefreshCw, Check, Edit2 } from "lucide-react";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

interface MessageProps {
  role: "user" | "assistant" | "system";
  content: string;
  isLast?: boolean;
  index: number;
}

export default function MessageBubble({
  role,
  content,
  isLast = false,
  index
}: MessageProps) {
  const isUser = role === "user";
  const { regenerateResponse, editMessage } = useChat();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = async () => {
    const trimmed = editContent.trim();
    if (!trimmed) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await editMessage(index, trimmed);
      setIsEditing(false);
    } catch (e) {
      console.error("Error saving edit:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`
        flex
        items-end
        gap-4
        w-full
        min-w-0
        ${isUser ? "justify-end" : "justify-start"}
      `}
    >
      {/* Assistant Avatar */}
      {!isUser && (
        <div
          className="
            w-8
            h-8
            md:w-9
            md:h-9
            rounded-xl
            flex
            items-center
            justify-center
            shadow-[0_0_12px_rgba(139,92,246,0.4)]
            shrink-0
            overflow-hidden
            bg-[#0d0d1a]
            border
            border-violet-500/30
          "
        >
          <img 
            src="/axiom-icon.png" 
            alt="Axiom Avatar" 
            className="w-full h-full object-contain p-1"
          />
        </div>
      )}

      {/* Bubble Container */}
      <div className={`flex flex-col min-w-0 ${isUser ? "items-end max-w-[85%] md:max-w-[75%]" : "items-start max-w-[90%] md:max-w-[85%]"}`}>
        <div
          className={`
            w-fit
            max-w-full
            min-w-0
            break-words
            [overflow-wrap:anywhere]
            rounded-2xl
            px-4
            py-3
            md:px-4.5
            md:py-3.5
            border
            backdrop-blur-xl
            transition-all
            duration-300
            hover:shadow-[0_0_30px_rgba(100,120,255,.15)]

            ${
              isUser
                ? `
                  bg-gradient-to-br
                  from-blue-500/20
                  to-cyan-600/20
                  border-cyan-400/20
                  text-white
                  shadow-[0_0_20px_rgba(6,182,212,.15)]
                  rounded-br-sm
                `
                : `
                  bg-white/[0.04]
                  border-white/10
                  text-gray-200
                  rounded-bl-sm
                `
            }
          `}
        >
          {!isUser && (
            <div className="mb-1.5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-violet-400 font-semibold">
                AXIOM
              </p>
            </div>
          )}

          {
              content === "Thinking..."? (
                  <TypingIndicator />
              ): isEditing ? (
                  <div className="w-full flex flex-col gap-3 min-w-[250px] max-w-full">
                      <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full max-w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm md:text-base text-white focus:outline-none focus:border-cyan-400/50 resize-none min-h-[100px] break-words [overflow-wrap:anywhere]"
                          disabled={isSaving}
                      />
                      <div className="flex justify-end gap-2">
                          <button
                              onClick={handleCancelEdit}
                              disabled={isSaving}
                              className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                          >
                              Cancel
                          </button>
                          <button
                              onClick={handleSaveEdit}
                              disabled={isSaving || !editContent.trim()}
                              className="px-3 py-1.5 text-xs font-medium bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 rounded-lg transition-colors disabled:opacity-50"
                          >
                              {isSaving ? "Saving..." : "Save"}
                          </button>
                      </div>
                  </div>
              ) : (
              <div className="prose prose-invert max-w-full min-w-0 break-words [overflow-wrap:anywhere] leading-relaxed text-sm md:text-base">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                  >
                    {content}
                  </ReactMarkdown>
              </div>
              )
          }
        </div>

        {/* Action Buttons (Copy & Regenerate) */}
        {!isUser && content !== "Thinking..." && (
            <div className="flex gap-2 mt-1 ml-2 opacity-60 hover:opacity-100 transition-opacity">
                <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                >
                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    {copied ? "Copied!" : "Copy"}
                </button>
                
                {isLast && (
                    <button 
                        onClick={regenerateResponse}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors ml-3"
                    >
                        <RefreshCw size={14} />
                        Regenerate
                    </button>
                )}
            </div>
        )}
        
        {isUser && !isEditing && (
            <div className="flex justify-end gap-2 mt-1 mr-2 opacity-60 hover:opacity-100 transition-opacity">
                <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 text-xs text-cyan-400/80 hover:text-cyan-300 transition-colors"
                >
                    <Edit2 size={12} />
                    Edit
                </button>
            </div>
        )}
      </div>

      {/* User Avatar (Star Logo) */}
      {isUser && (
        <div
          className="
            w-8
            h-8
            md:w-9
            md:h-9
            rounded-xl
            flex
            items-center
            justify-center
            shadow-[0_0_12px_rgba(6,182,212,0.4)]
            shrink-0
            overflow-hidden
            bg-[#0b1329]
            border
            border-cyan-400/30
          "
        >
          {user?.avatar ? (
            <img src={user.avatar} alt="User Avatar" className="w-full h-full object-cover" />
          ) : (
            <img 
              src="/user-avatar.png" 
              alt="User Avatar" 
              className="w-full h-full object-contain p-1"
            />
          )}
        </div>
      )}
    </motion.div>
  );
}