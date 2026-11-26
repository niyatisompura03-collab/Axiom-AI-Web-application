"use client";

import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import { Mark, Icon } from "@/components/FigmaIcons";
import { useChat, Message } from "@/context/ChatContext";

interface ChatWindowProps {
  messages: Message[];
  onSelectSuggestion?: (text: string) => void;
}

export default function ChatWindow({
  messages,
  onSelectSuggestion,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, messages[messages.length - 1]?.content]);

  const suggestions = [
    "Help me find my focus",
    "Explain something simply",
    "Give an idea a fresh perspective",
  ];

  return (
    <div className="chat-scroll" ref={scrollRef}>
      {messages.length ? (
        <div className="thread">
          <div className="conversation-start">
            <span />
            Today
            <span />
          </div>

          {messages.map((message, index) => (
            <MessageBubble
              key={`${index}-${message.document?.document_id || "plain"}`}
              role={message.role}
              content={message.content}
              document={message.document}
              index={index}
              isLast={index === messages.length - 1}
            />
          ))}

          <div ref={bottomRef} style={{ height: "16px" }} />
        </div>
      ) : (
        <div className="empty-state">
          <div className="welcome-symbol">
            <Mark size={40} />
          </div>
          
          <h1>What’s on your mind?</h1>
         
          <div className="suggestions">
            {suggestions.map((text) => (
              <button
                type="button"
                key={text}
                onClick={() => onSelectSuggestion?.(text)}
              >
                <span>{text}</span>
                <Icon name="chevron" size={15} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
