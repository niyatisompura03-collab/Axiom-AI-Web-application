"use client";

import React, { useRef, useEffect, useState } from "react";
import { Icon } from "@/components/FigmaIcons";
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
  sendMessage,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { activeDocument, setActiveDocument, messages } = useChat();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      let base64Content: string | undefined = undefined;
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = (ev) => {
            const result = ev.target?.result as string;
            resolve(result.includes(",") ? result.split(",")[1] : result);
          };
        });
        reader.readAsDataURL(file);
        base64Content = await base64Promise;
      }

      const result = await uploadDocumentApi(file);
      setActiveDocument({
        document_id: result.document_id,
        filename: result.filename,
        content: base64Content,
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
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !activeDocument) || isUploading) return;
    sendMessage();
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  return (
    <div className="composer-area">
      <div className="composer-width">
        <form className="composer" onSubmit={handleSubmit}>
          {activeDocument && (
            <div className="attachment-chip">
              <Icon name="attach" size={14} />
              <span>{activeDocument.filename}</span>
              <button
                type="button"
                aria-label="Remove attachment"
                onClick={() => setActiveDocument(null)}
              >
                <Icon name="close" size={13} />
              </button>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question. Explore an idea."
            rows={1}
            aria-label="Message Axiom"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />

          <div className="composer-toolbar">
            <div className="composer-tools">
              <input
                ref={fileInputRef}
                type="file"
                hidden
                onChange={handleFileUpload}
              />
              <button
                type="button"
                className="icon-button attach-button"
                title="Attach a file"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Icon name="attach" size={19} />
              </button>
              {isUploading && (
                <span style={{ fontSize: "12px", color: "var(--muted)", marginLeft: "4px" }}>
                  Uploading...
                </span>
              )}
            </div>

            <div className="send-tools">
              
              <button
                type="submit"
                className="send-button"
                aria-label="Send message"
                disabled={(!input.trim() && !activeDocument) || isUploading}
              >
                <Icon name="arrow" size={20} />
              </button>
            </div>
          </div>
        </form>

        <div className="composer-disclaimer">
          <span>Axiom can make mistakes. Check important information.</span>
        </div>
      </div>
    </div>
  );
}
