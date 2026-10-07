import { Send, Paperclip, X, Loader2 } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { useChat } from "@/context/ChatContext";
import { uploadDocumentApi } from "@/lib/api";

interface ChatInputProps {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  sendMessage: () => void;
}

export default function ChatInput({
  input,
  setInput,
  sendMessage
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { activeDocument, setActiveDocument } = useChat();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      let base64Content: string | undefined = undefined;
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = (e) => {
            const result = e.target?.result as string;
            // Extract the base64 part
            resolve(result.includes(',') ? result.split(',')[1] : result);
          };
        });
        reader.readAsDataURL(file);
        base64Content = await base64Promise;
      }

      const result = await uploadDocumentApi(file);
      setActiveDocument({ 
        document_id: result.document_id, 
        filename: result.filename,
        content: base64Content
      });
    } catch (err: any) {
      alert(err.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  useEffect(() => {
    if (input === "" && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input]);

  return (
    <div className="px-6 md:px-10 pb-6 md:pb-8 pt-2 w-full shrink-0 relative">

      <div className="
      w-full
      flex
      flex-col
      rounded-2xl
      border
      border-border
      bg-surface-input
      px-6
      py-3.5
      md:px-7
      gap-2
      shadow-lg
      transition-all
      duration-300
      focus-within:border-accent
      focus-within:bg-surface
      focus-within:shadow-focus
      backdrop-blur-xl
      ">
        
        {/* Document Pill inside composer */}
        {activeDocument && (
          <div className="flex items-center gap-2 bg-accent-subtle text-accent px-3 py-1.5 rounded-xl w-max border border-accent/30 text-sm font-medium">
            <Paperclip size={14} className="shrink-0" />
            <span className="truncate max-w-[200px]">{activeDocument.filename}</span>
            <button 
              type="button"
              onClick={() => setActiveDocument(null)} 
              aria-label="Remove document"
              className="hover:text-text-primary transition-colors ml-1 p-0.5 rounded cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex items-end w-full gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            aria-label="Attach file"
            className="
              w-10
              h-10
              flex
              items-center
              justify-center
              rounded-xl
              text-text-secondary
              hover:text-text-primary
              hover:bg-surface-secondary
              transition-colors
              duration-200
              disabled:opacity-50
              shrink-0
              cursor-pointer
            "
          >
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            accept=".pdf,.docx,.txt,.md,.html,.csv,.json,.png,.jpg,.jpeg,.webp"
          />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 300) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (input.trim()) {
                  sendMessage();
                }
              }
            }}
            rows={1}
            className="
              flex-1
              bg-transparent
              outline-none
              text-text-primary
              placeholder:text-text-muted
              transition-all
              duration-200
              focus:placeholder:opacity-50
              px-2
              py-2.5
              resize-none
              overflow-y-auto
              max-h-[300px]
              min-h-[40px]
              text-sm
              leading-relaxed
              break-words
              [overflow-wrap:anywhere]
            "
            placeholder="Ask Axiom anything..."
          />

          <button
            type="button"
            onClick={() => {
              if (input.trim() && !isUploading) {
                sendMessage();
              }
            }}
            disabled={!input.trim() || isUploading}
            aria-label="Send message"
            className="
              w-10
              h-10
              flex
              items-center
              justify-center
              shrink-0
              rounded-xl
              bg-accent
              hover:bg-accent-hover
              text-white
              shadow-elevation
              transition-all
              duration-200
              active:scale-95
              disabled:opacity-40
              disabled:cursor-not-allowed
              disabled:active:scale-100
              cursor-pointer
            "
          >
            <Send size={16} className="ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
