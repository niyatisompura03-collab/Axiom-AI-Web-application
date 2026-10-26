"use client";

import { useState, useRef } from "react";
import ChatWindow from "@/components/ChatWindow";
import ChatInput from "@/components/ChatInput";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
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

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Mobile swipe-to-open and swipe-to-close gestures
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;

    // Only handle horizontal swipes
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX > 0 && touchStartX.current < 120 && !isSidebarOpen) {
        // Swiped right from left side -> Open sidebar
        setIsSidebarOpen(true);
      } else if (diffX < 0 && isSidebarOpen) {
        // Swiped left while open -> Close sidebar
        setIsSidebarOpen(false);
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  if (authLoading) {
    return (
      <main className="h-[100dvh] h-screen w-full bg-bg-app flex items-center justify-center select-none">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <main 
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="h-[100dvh] h-screen w-full flex overflow-hidden bg-bg-app text-text-primary select-none relative"
    >
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Mobile edge pull tab (visible only when sidebar is closed on mobile) */}
      {!isSidebarOpen && (
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Slide to open sidebar"
          className="md:hidden fixed top-1/2 -translate-y-1/2 left-0 w-3 h-16 rounded-r-lg bg-surface-secondary/80 hover:bg-surface border-y border-r border-border/80 flex items-center justify-center text-text-muted hover:text-text-primary shadow-elevation z-30 transition-all active:scale-105 cursor-pointer group"
          title="Open sidebar"
        >
          <div className="w-1 h-6 rounded-full bg-border group-hover:bg-accent transition-colors" />
        </button>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative bg-bg-app">
        <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
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