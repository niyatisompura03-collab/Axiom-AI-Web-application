// components/HelpModal.tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./SettingsModal.module.css";
import { Info, MessageSquare, Database, Settings, User, X } from "lucide-react";

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

export default function HelpModal({ open, onClose }: HelpModalProps) {
  const [animating, setAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setAnimating(true);
    } else if (animating) {
      const timer = setTimeout(() => setAnimating(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open, animating]);

  if (!mounted) return null;
  if (!open && !animating) return null;

  const backdropClass = `${styles.backdrop} ${open ? styles.modalEnter : styles.modalExit}`;

  return createPortal(
    <div className={backdropClass} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: "600px", minHeight: "auto" }}>
        
        <div className={styles.mainContent}>
          <div className={styles.contentHeader}>
            <h2 className={styles.contentTitle}>Help & Guide</h2>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close help">
              <X size={20} />
            </button>
          </div>
          <div className={styles.contentBody} style={{ padding: "1.5rem 2rem 2rem" }}>
            <div className="space-y-6 text-gray-300 text-sm">
              <section>
                <h3 className="text-white text-base font-semibold mb-2 flex items-center gap-2">
                  <Info size={16} className="text-violet-400" /> What is Axiom?
                </h3>
                <p>Axiom is an advanced AI chat interface designed for seamless conversations, persistent memory, and a customizable dark-themed experience.</p>
              </section>

              <section>
                <h3 className="text-white text-base font-semibold mb-2 flex items-center gap-2">
                  <MessageSquare size={16} className="text-violet-400" /> Chat Features
                </h3>
                <p>Use the sidebar to create new chats, switch between recent conversations, rename them, or delete them. Axiom streams responses in real time.</p>
              </section>

              <section>
                <h3 className="text-white text-base font-semibold mb-2 flex items-center gap-2">
                  <Database size={16} className="text-violet-400" /> Memory
                </h3>
                <p>Axiom can remember details about you across sessions. You can manage or clear this saved context in Settings &gt; Memory.</p>
              </section>

              <section>
                <h3 className="text-white text-base font-semibold mb-2 flex items-center gap-2">
                  <Settings size={16} className="text-violet-400" /> Settings
                </h3>
                <p>Access Settings via the Profile menu to customize appearance (themes), AI behavior (system prompts), and Memory preferences.</p>
              </section>

              <section>
                <h3 className="text-white text-base font-semibold mb-2 flex items-center gap-2">
                  <User size={16} className="text-violet-400" /> Profile & Account
                </h3>
                <p>Your profile displays your current account details. Use the Log Out button in the Profile menu to end your session securely.</p>
              </section>
            </div>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
