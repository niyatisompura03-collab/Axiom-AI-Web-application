"use client";

import { useState } from "react";
import Header from "@/components/Header";
import ChatWindow from "@/components/ChatWindow";
import ChatInput from "@/components/ChatInput";
import Sidebar from "@/components/Sidebar";
import { useChat } from "@/context/ChatContext";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const {
    messages,
    input,
    setInput,
    sendMessage,
    isRestoring
  } = useChat();
  const { loading: authLoading } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  if (authLoading) {
    return (
      <main className="h-screen p-4 md:p-8 bg-transparent flex items-center justify-center">
        <div
          className="
            w-full
            max-w-5xl
            lg:max-w-6xl
            h-full
            max-h-[92vh]
            rounded-none

            border
            border-white/10
            bg-[#0B0F18]/90
            backdrop-blur-3xl
            shadow-[0_0_80px_rgba(80,100,255,.18)]
            overflow-hidden
            flex
            items-center
            justify-center
            mx-auto
          "
        >
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen p-4 md:p-8 bg-transparent flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="
          w-full
          max-w-5xl
          lg:max-w-6xl
          h-full
          max-h-[92vh]
          rounded-none
          md:rounded-none
          border
          border-white/10
          bg-[#0B0F18]/90
          backdrop-blur-3xl
          shadow-[0_0_80px_rgba(80,100,255,.18)]
          overflow-hidden
          flex
          flex-row
          mx-auto
          relative
        "
      >
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative bg-[#131826]/60">
          {isRestoring ? (
              <div className="flex-1 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
              </div>
          ) : (
              <ChatWindow messages={messages} />
          )}

          <ChatInput
            input={input}
            setInput={setInput}
            sendMessage={sendMessage}
          />
        </div>
      </motion.div>
    </main>
  );
}