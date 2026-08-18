import { Send } from "lucide-react";
import { useRef, useEffect } from "react";

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

  useEffect(() => {
    if (input === "" && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input]);

  return (
    <div className="px-6 md:px-10 pb-6 md:pb-8 pt-2 w-full shrink-0">
      <div className="
      w-full
      flex
      items-end
      rounded-2xl
      border
      border-white/10
      bg-white/[0.02]
      px-6
      py-3.5
      md:px-7
      shadow-lg
      transition-all
      duration-300
      focus-within:border-purple-500/50
      focus-within:bg-white/[0.04]
      focus-within:shadow-[0_0_30px_rgba(139,92,246,.25)]
      backdrop-blur-xl
      ">
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
            sendMessage();
          }}
          disabled={!input.trim()}
          className="
          ml-4
          mb-0.5
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
  );
}