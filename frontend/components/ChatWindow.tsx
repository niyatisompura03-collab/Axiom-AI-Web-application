import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import { ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  document?: {
    document_id: string;
    filename: string;
    mime_type?: string;
    type?: string;
    content?: string; // base64
  };
}

interface ChatWindowProps {
  messages: Message[];
}

export default function ChatWindow({
  messages,
}: ChatWindowProps) {
  const { user, isAuthenticated } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScroll, setShowScroll] = useState(false);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScroll(!isNearBottom);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="
          flex-1
          overflow-y-auto
          px-6
          py-6
          md:px-10
          md:py-8
          relative
      "
    >
      <div
        className="
          w-full
          min-h-full
          flex
          flex-col
        "
      >
        {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center h-full min-h-[50vh]">
                <div className="w-16 h-16 md:w-20 md:h-20 mb-6 rounded-2xl flex items-center justify-center bg-surface-secondary border border-border shadow-elevation">
                  <img src="/brand/axiom-mark-white.png" alt="Axiom" className="w-10 h-10 md:w-12 md:h-12 object-contain dark-logo" />
                  <img src="/brand/axiom-mark-black.png" alt="Axiom" className="w-10 h-10 md:w-12 md:h-12 object-contain light-logo" />
                </div>
                <h3 className="text-2xl md:text-3xl text-text-primary mb-3 font-semibold tracking-wide">
                  {isAuthenticated ? `Welcome back, ${user?.username}` : "Welcome to Axiom"}
                </h3>
                <p className="text-text-secondary text-base md:text-lg max-w-md">How can I help you today?</p>
            </div>
        ) : (
            <div className="flex-1 flex flex-col gap-6 md:gap-8">
                {messages.map((message, index) => (
                    <MessageBubble
                        key={index}
                        role={message.role}
                        content={message.content}
                        document={message.document}
                        isLast={index === messages.length - 1}
                        index={index}
                    />
                ))}
            </div>
        )}

        <div ref={bottomRef} className="h-4" />
      </div>

      <AnimatePresence>
        {showScroll && messages.length > 0 && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={scrollToBottom}
            aria-label="Scroll to bottom"
            className="fixed bottom-28 right-12 w-10 h-10 flex items-center justify-center bg-surface-secondary/90 hover:bg-surface backdrop-blur-md border border-border text-text-secondary hover:text-text-primary rounded-xl shadow-elevation transition-all duration-200 z-10 active:scale-95 cursor-pointer"
          >
            <ArrowDown size={18} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}