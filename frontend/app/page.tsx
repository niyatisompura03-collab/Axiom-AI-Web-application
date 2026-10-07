"use client";

import { useState } from "react";
import ChatWindow from "@/components/ChatWindow";
import ChatInput from "@/components/ChatInput";
import Sidebar from "@/components/Sidebar";
import { useChat } from "@/context/ChatContext";
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
      <main className="h-screen w-full bg-bg-app flex items-center justify-center select-none">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <main className="h-screen w-full flex overflow-hidden bg-bg-app text-text-primary select-none relative">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative bg-bg-app">
        {isRestoring ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-7 h-7 rounded-full border-2 border-accent border-t-transparent animate-spin" />
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
    </main>
  );
}