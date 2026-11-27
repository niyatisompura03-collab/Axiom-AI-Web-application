"use client";

import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@/components/FigmaIcons";
import { useChat } from "@/context/ChatContext";

interface HeaderProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  setSidebar: (open: boolean) => void;
  onRenameRequest: () => void;
}

export default function Header({
  setCollapsed,
  setSidebar,
  onRenameRequest,
}: HeaderProps) {
  const { conversationId, selectedConversation, deleteConversation, startNewChat } = useChat();
  const [moreMenu, setMoreMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMoreMenu(false);
      }
    }
    if (moreMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [moreMenu]);

  const activeTitle = selectedConversation?.title || "New conversation";

  return (
    <header className="chat-header">
      <div className="header-location">
        {/* Single sidebar toggle button */}
        <button
          type="button"
          className="icon-button show-sidebar"
          title="Open sidebar"
          onClick={() => {
            setCollapsed(false);
            setSidebar(true);
          }}
        >
          <Icon name="panel" />
        </button>

        <span className="header-title">{activeTitle}</span>
      </div>

      <div className="header-actions">
        {conversationId && (
          <div className="more-container" ref={menuRef}>
            <button
              type="button"
              className="icon-button"
              aria-label="Conversation options"
              aria-expanded={moreMenu}
              onClick={() => setMoreMenu(!moreMenu)}
            >
              <Icon name="more" size={20} />
            </button>

            {moreMenu && (
              <div className="popover conversation-menu">
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenu(false);
                    onRenameRequest();
                  }}
                >
                  <Icon name="edit" size={15} />
                  Rename conversation
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setMoreMenu(false);
                    if (conversationId) {
                      await deleteConversation(conversationId);
                      await startNewChat();
                    }
                  }}
                >
                  <Icon name="close" size={15} />
                  Delete conversation
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
