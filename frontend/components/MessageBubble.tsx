import { useState } from "react";
import TypingIndicator from "./TypingIndicator";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { Copy, RefreshCw, Check, Edit2, FileText } from "lucide-react";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

interface MessageProps {
  role: "user" | "assistant" | "system";
  content: string;
  isLast?: boolean;
  index: number;
  document?: {
    document_id: string;
    filename: string;
    mime_type?: string;
    type?: string;
    content?: string;
  };
}

export default function MessageBubble({
  role,
  content,
  isLast = false,
  index,
  document
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
            shadow-elevation
            shrink-0
            overflow-hidden
            bg-surface-secondary
            border
            border-border
          "
        >
          <img 
            src="/brand/axiom-mark-white.png" 
            alt="Axiom Avatar" 
            className="w-full h-full object-contain p-1 dark-logo"
          />
          <img 
            src="/brand/axiom-mark-black.png" 
            alt="Axiom Avatar" 
            className="w-full h-full object-contain p-1 light-logo"
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

            ${
              isUser
                ? `
                  bg-surface-secondary
                  border-border
                  text-text-primary
                  shadow-elevation
                  rounded-br-sm
                `
                : `
                  bg-transparent
                  border-transparent
                  text-text-primary
                `
            }
          `}
        >
          {!isUser && (
            <div className="mb-1.5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">
                AXIOM
              </p>
            </div>
          )}

          {document && (
            <div className="mb-3 max-w-full">
              {document.type === 'image' && document.content ? (
                <div className="relative rounded-xl overflow-hidden border border-border shadow-lg inline-block max-w-full">
                  <img 
                    src={`data:${document.mime_type || 'image/png'};base64,${document.content}`} 
                    alt={document.filename}
                    className="max-w-full h-auto max-h-[300px] object-contain bg-black/40"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-3 py-1.5 text-xs text-white truncate border-t border-border">
                    {document.filename}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-surface-input border border-border px-3 py-2 rounded-xl text-sm max-w-[250px] md:max-w-[350px]">
                  <FileText size={16} className="text-accent shrink-0" />
                  <span className="truncate opacity-90">{document.filename}</span>
                </div>
              )}
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
                          className="w-full max-w-full bg-surface-input border border-border rounded-xl p-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:shadow-focus resize-none min-h-[100px] break-words [overflow-wrap:anywhere]"
                          disabled={isSaving}
                      />
                      <div className="flex justify-end gap-2">
                          <button
                              type="button"
                              onClick={handleCancelEdit}
                              disabled={isSaving}
                              className="h-8 px-3 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary border border-transparent hover:border-border transition-colors disabled:opacity-50 cursor-pointer"
                          >
                              Cancel
                          </button>
                          <button
                              type="button"
                              onClick={handleSaveEdit}
                              disabled={isSaving || !editContent.trim()}
                              className="h-8 px-3.5 rounded-xl text-xs font-medium bg-accent hover:bg-accent-hover text-white shadow-elevation transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                              {isSaving ? "Saving..." : "Save"}
                          </button>
                      </div>
                  </div>
              ) : (
              <div className="prose max-w-full min-w-0 break-words [overflow-wrap:anywhere] leading-relaxed text-sm md:text-base hover:prose-a:underline">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      a: ({node, ...props}) => (
                        <a {...props} target="_blank" rel="noopener noreferrer" />
                      )
                    }}
                  >
                    {content}
                  </ReactMarkdown>
              </div>
              )
          }
        </div>

        {/* Action Buttons (Copy & Regenerate) */}
        {!isUser && content !== "Thinking..." && (
            <div className="flex items-center gap-1 mt-1 ml-1 opacity-70 hover:opacity-100 transition-opacity">
                <button 
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
                >
                    {copied ? <Check size={13} className="text-success" /> : <Copy size={13} className="text-text-muted" />}
                    <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
                
                {isLast && (
                    <button 
                        type="button"
                        onClick={regenerateResponse}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
                    >
                        <RefreshCw size={13} className="text-text-muted" />
                        <span>Regenerate</span>
                    </button>
                )}
            </div>
        )}
        
        {isUser && !isEditing && (
            <div className="flex justify-end gap-1 mt-1 mr-1 opacity-70 hover:opacity-100 transition-opacity">
                <button 
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium text-text-secondary hover:text-accent hover:bg-surface-secondary transition-colors cursor-pointer"
                >
                    <Edit2 size={12} className="text-text-muted" />
                    <span>Edit</span>
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
            shadow-elevation
            shrink-0
            overflow-hidden
            bg-surface-secondary
            border
            border-border
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