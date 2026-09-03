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
      border-white/10
      bg-white/[0.02]
      px-6
      py-3.5
      md:px-7
      gap-2
      shadow-lg
      transition-all
      duration-300
      focus-within:border-purple-500/50
      focus-within:bg-white/[0.04]
      focus-within:shadow-[0_0_30px_rgba(139,92,246,.25)]
      backdrop-blur-xl
      ">
        
        {/* Document Pill inside composer */}
        {activeDocument && (
          <div className="flex items-center gap-2 bg-purple-500/20 text-purple-200 px-3 py-1.5 rounded-lg w-max border border-purple-500/30">
            <Paperclip size={14} />
            <span className="text-sm font-medium truncate max-w-[200px]">{activeDocument.filename}</span>
            <button onClick={() => setActiveDocument(null)} className="hover:text-white transition-colors ml-1">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex items-end w-full">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="
            mr-3
            mb-3
            text-gray-400
            hover:text-purple-400
            transition-colors
            disabled:opacity-50
            flex-shrink-0
          "
        >
          {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileUpload}
          accept=".pdf,.doc,.docx,.txt,.md,.html,.csv,.json,.png,.jpg,.jpeg,.webp"
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
          text-white
          placeholder:text-gray-500
          transition-all
          duration-300
          focus:placeholder:opacity-50
          px-3
          resize-none
          overflow-y-auto
          max-h-[300px]
          py-2.5
          min-h-[44px]
          break-words
          [overflow-wrap:anywhere]
          "
          placeholder="Ask Axiom anything..."
        />

        <button
          onClick={() => {
            if (input.trim() && !isUploading) {
              sendMessage();
            }
          }}
          disabled={!input.trim() || isUploading}
          className="
          ml-4
          mb-0
          flex
          items-center
          justify-center
          h-11
          w-11
          rounded-xl
          bg-gradient-to-br
          from-violet-500
          to-blue-600
          text-white
          transition-all
          duration-300
          hover:scale-[1.03]
          hover:brightness-110
          hover:shadow-[0_0_20px_rgba(139,92,246,.5)]
          disabled:opacity-50
          disabled:cursor-not-allowed
          disabled:hover:scale-100
          disabled:hover:shadow-none
          disabled:hover:brightness-100
          "
        >
          <Send size={18} className="mr-0.5 mt-0.5" />
        </button>
        </div>
      </div>
    </div>
  );
}