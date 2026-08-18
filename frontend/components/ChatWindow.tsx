import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import { ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
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
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-80 h-full min-h-[50vh]">
                <h3 className="text-3xl md:text-4xl text-violet-400 mb-6">
                  {isAuthenticated ? `Hi, ${user?.username}!` : "Hi there!"}
                </h3>
                <p className="text-gray-400 text-lg">What would you like to explore today?</p>
            </div>
        ) : (
            <div className="flex-1 flex flex-col gap-6 md:gap-8">
                {messages.map((message, index) => (
                    <MessageBubble
                        key={index}
                        role={message.role}
                        content={message.content}
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={scrollToBottom}
            className="fixed bottom-28 right-12 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full shadow-[0_0_15px_rgba(80,100,255,.2)] transition-all z-10 text-white"
          >
            <ArrowDown size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}