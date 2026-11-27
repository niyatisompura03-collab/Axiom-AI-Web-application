"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useChat, ConversationSummary } from "@/context/ChatContext";
import { Icon, Mark, SettingsIcon, SettingsTab } from "@/components/FigmaIcons";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  openSettings: (tab: SettingsTab) => void;
  openProfile: () => void;
}

function groupConversations(conversations: ConversationSummary[]) {
  const groups: { [key: string]: ConversationSummary[] } = {
    Today: [],
    Yesterday: [],
    "Previous 7 days": [],
    Older: [],
  };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOf7DaysAgo = startOfToday - 6 * 24 * 60 * 60 * 1000;

  for (const c of conversations) {
    const time = new Date(c.updated_at || Date.now()).getTime();
    if (time >= startOfToday) {
      groups["Today"].push(c);
    } else if (time >= startOfYesterday) {
      groups["Yesterday"].push(c);
    } else if (time >= startOf7DaysAgo) {
      groups["Previous 7 days"].push(c);
    } else {
      groups["Older"].push(c);
    }
  }

  return Object.entries(groups).filter(([, items]) => items.length > 0);
}

export default function Sidebar({
  isOpen,
  setIsOpen,
  setCollapsed,
  openSettings,
  openProfile,
}: SidebarProps) {
  const { conversationId, recentConversations, loadConversation, startNewChat } = useChat();
  const { user, isAuthenticated, logout } = useAuth();
  const [profileMenu, setProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.username || "Guest";
  const avatarLetter = (displayName || "A").charAt(0).toUpperCase();

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenu(false);
      }
    }
    if (profileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [profileMenu]);

  const conversationGroups = groupConversations(recentConversations);

  return (
    <aside className={`sidebar ${isOpen ? "is-open" : ""}`}>
      {/* Brand & Collapse Header */}
      <div className="sidebar-brand">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            startNewChat();
            setIsOpen(false);
          }}
        >
          <Mark />
          <span>
            axiom<span className="brand-period">.</span>
          </span>
          
        </a>
        <button
          type="button"
          className="icon-button collapse-button"
          title="Collapse sidebar"
          onClick={() => {
            setCollapsed(true);
            setIsOpen(false);
          }}
        >
          <Icon name="panel" size={17} />
        </button>
        <button
          type="button"
          className="icon-button mobile-close"
          aria-label="Close sidebar"
          onClick={() => setIsOpen(false)}
        >
          <Icon name="close" />
        </button>
      </div>

      {/* New Conversation Button */}
      <button
        type="button"
        className="new-chat"
        onClick={() => {
          startNewChat();
          setIsOpen(false);
        }}
      >
        <Icon name="plus" size={17} />
        <span>New conversation</span>
        <span className="new-chat-hint">↗</span>
      </button>

      {/* Conversation History List */}
      <div className="conversation-list">
        <div className="list-heading">YOUR CONVERSATIONS</div>
        {conversationGroups.length === 0 ? (
          <div style={{ padding: "16px 8px", fontSize: "13px", color: "var(--muted)" }}>
            No conversations yet
          </div>
        ) : (
          conversationGroups.map(([groupName, items]) => (
            <div className="conversation-group" key={groupName}>
              <h3>{groupName}</h3>
              {items.map((c) => {
                const isActive = c.conversation_id === conversationId;
                return (
                  <button
                    type="button"
                    key={c.conversation_id}
                    className={`conversation-link ${isActive ? "active" : ""}`}
                    onClick={() => {
                      loadConversation(c.conversation_id);
                      setIsOpen(false);
                    }}
                  >
                    <Icon name="chat" size={16} />
                    <span>{c.title || "Untitled Chat"}</span>
                    {isActive && <i />}
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-bottom">
        <div className="profile-container" ref={profileMenuRef}>
          {profileMenu && (
            <div className="profile-menu popover">
              <div className="menu-caption">
                {isAuthenticated ? "YOUR ACCOUNT" : "GUEST SESSION"}
              </div>

              {isAuthenticated ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      openProfile();
                      setProfileMenu(false);
                    }}
                  >
                    <Icon name="eye" size={16} />
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      openSettings("Appearance");
                      setProfileMenu(false);
                    }}
                  >
                    <SettingsIcon tab="Appearance" />
                    Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setProfileMenu(false);
                    }}
                  >
                    <Icon name="logout" size={16} /> Log out
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      openSettings("Appearance");
                      setProfileMenu(false);
                    }}
                  >
                    <SettingsIcon tab="Appearance" />
                    Settings
                  </button>
                  <Link
                    href="/login"
                    onClick={() => setProfileMenu(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      color: "var(--text)",
                      fontSize: "13px",
                    }}
                  >
                    <Icon name="logout" size={16} /> Log in to Axiom
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setProfileMenu(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      color: "var(--text)",
                      fontSize: "13px",
                    }}
                  >
                    <Icon name="plus" size={16} /> Create an account
                  </Link>
                </>
              )}
            </div>
          )}

          <button
            type="button"
            className="profile-button"
            aria-expanded={profileMenu}
            onClick={() => setProfileMenu(!profileMenu)}
          >
            <span className="avatar">{avatarLetter}</span>
            <span className="profile-info">
              <strong>{displayName}</strong>
              <span>
                {isAuthenticated ? (user?.email || "Personal account") : "Sign in to save"}
              </span>
            </span>
            <Icon name="more" size={19} />
          </button>
        </div>
      </div>
    </aside>
  );
}
