// components/SettingsModal.tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import AppearanceSection from "@/components/AppearanceSection";
import AISection from "@/components/AISection";
import MemorySection from "@/components/MemorySection";
import AboutSection from "@/components/AboutSection";
import styles from "./SettingsModal.module.css";
import { Palette, Sparkles, Database, Info, X } from "lucide-react";

type Tab = "appearance" | "ai" | "memory" | "about";

interface SettingsModalProps {
  username: string;
  open: boolean;
  onClose?: () => void; // optional close callback
}

export default function SettingsModal({ username, open, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("appearance");
  const [animating, setAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // handle fade‑in/out animation timing (200ms)
  useEffect(() => {
    if (open) {
      setAnimating(true);
    } else if (animating) {
      // start exit animation then hide after duration
      const timer = setTimeout(() => setAnimating(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open, animating]);

  if (!mounted) return null;
  if (!open && !animating) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case "appearance":
        return <AppearanceSection username={username} />;
      case "ai":
        return <AISection username={username} />;
      case "memory":
        return <MemorySection username={username} />;
      case "about":
        return <AboutSection />;
    }
  };

  const backdropClass = `${styles.backdrop} ${open ? styles.modalEnter : styles.modalExit}`;

  return createPortal(
    <div className={backdropClass} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        
        {/* Left Sidebar */}
        <div className={styles.sidebar}>
          <h3 className={styles.sidebarTitle}>Settings</h3>
          <div className={styles.tabList}>
            <button
              className={`${styles.tabButton} ${activeTab === "appearance" ? styles.active : ""}`}
              onClick={() => setActiveTab("appearance")}
            >
              <Palette size={18} />
              Appearance
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === "ai" ? styles.active : ""}`}
              onClick={() => setActiveTab("ai")}
            >
              <Sparkles size={18} />
              AI
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === "memory" ? styles.active : ""}`}
              onClick={() => setActiveTab("memory")}
            >
              <Database size={18} />
              Memory
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === "about" ? styles.active : ""}`}
              onClick={() => setActiveTab("about")}
            >
              <Info size={18} />
              About
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className={styles.mainContent}>
          <div className={styles.contentHeader}>
            <h2 className={styles.contentTitle}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            {onClose && (
              <button className={styles.closeBtn} onClick={onClose} aria-label="Close settings">
                <X size={20} />
              </button>
            )}
          </div>
          <div className={styles.contentBody}>
            {renderTabContent()}
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
