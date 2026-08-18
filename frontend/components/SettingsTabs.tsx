// components/SettingsTabs.tsx
"use client";

import React from "react";
import styles from "./SettingsTabs.module.css";

type Tab = "appearance" | "ai" | "memory" | "about";

interface SettingsTabsProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export default function SettingsTabs({ activeTab, setActiveTab }: SettingsTabsProps) {
  return (
    <div className={styles.tabBar}>
      <button
        className={`${styles.tabButton} ${activeTab === "appearance" ? styles.active : ""}`}
        onClick={() => setActiveTab("appearance")}
      >
        Appearance
      </button>
      <button
        className={`${styles.tabButton} ${activeTab === "ai" ? styles.active : ""}`}
        onClick={() => setActiveTab("ai")}
      >
        AI
      </button>
      <button
        className={`${styles.tabButton} ${activeTab === "memory" ? styles.active : ""}`}
        onClick={() => setActiveTab("memory")}
      >
        Memory
      </button>
      <button
        className={`${styles.tabButton} ${activeTab === "about" ? styles.active : ""}`}
        onClick={() => setActiveTab("about")}
      >
        About
      </button>
    </div>
  );
}
