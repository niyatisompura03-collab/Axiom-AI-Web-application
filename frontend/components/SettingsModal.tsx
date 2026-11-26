"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { SettingsIcon, SettingsTab } from "@/components/FigmaIcons";
import { useAuth } from "@/context/AuthContext";
import { fetchSettings, updateSettings, fetchMemories } from "@/lib/settingsApi";
import { applyAppearanceToDom } from "@/utils/theme";

interface SettingsModalProps {
  initialTab?: SettingsTab;
  open: boolean;
  onClose: () => void;
}

interface MemoryItem {
  memory_id: string;
  category: string;
  key: string;
  memory: string;
  created_at: string;
}

function Toggle({
  value,
  onChange,
  label,
  disabled = false,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={value}
      disabled={disabled}
      className={`setting-toggle ${value ? "on" : ""}`}
      onClick={() => onChange(!value)}
    >
      <span />
    </button>
  );
}

function Choices({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div className="setting-choices" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          type="button"
          aria-pressed={option.toLowerCase() === value.toLowerCase()}
          className={option.toLowerCase() === value.toLowerCase() ? "chosen" : ""}
          key={option}
          onClick={() => onChange(option.toLowerCase())}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

interface SettingsDraft {
  theme: "dark" | "light";
  accent: string;
  compact: boolean;
  animations: boolean;
  responseLength: "short" | "balanced" | "detailed";
  markdown: boolean;
  personality: "adaptive" | "professional" | "creative";
  memoryEnabled: boolean;
  longTermMemory: boolean;
}

const DEFAULT_SETTINGS_DRAFT: SettingsDraft = {
  theme: "dark",
  accent: "#b2a0e8",
  compact: false,
  animations: true,
  responseLength: "balanced",
  markdown: true,
  personality: "adaptive",
  memoryEnabled: true,
  longTermMemory: true,
};

function parseSettingsDraft(
  settingsData: any,
  fallback: SettingsDraft = DEFAULT_SETTINGS_DRAFT
): SettingsDraft {
  if (!settingsData) return fallback;

  const rawLength = settingsData.ai?.response_length;
  const responseLength: SettingsDraft["responseLength"] =
    rawLength === "short" || rawLength === "balanced" || rawLength === "detailed"
      ? rawLength
      : fallback.responseLength;

  const rawPersonality = settingsData.ai?.personality;
  const personality: SettingsDraft["personality"] =
    rawPersonality === "adaptive" ||
    rawPersonality === "professional" ||
    rawPersonality === "creative"
      ? rawPersonality
      : fallback.personality;

  return {
    theme: settingsData.appearance?.theme === "light" ? "light" : "dark",
    accent: settingsData.appearance?.accent_color || fallback.accent,
    compact:
      settingsData.appearance?.compact_mode !== undefined
        ? Boolean(settingsData.appearance.compact_mode)
        : fallback.compact,
    animations:
      settingsData.appearance?.animations !== undefined
        ? settingsData.appearance.animations !== false
        : fallback.animations,
    responseLength,
    markdown:
      settingsData.ai?.markdown_enabled !== undefined
        ? settingsData.ai.markdown_enabled !== false
        : fallback.markdown,
    personality,
    memoryEnabled:
      settingsData.memory?.memory_enabled !== undefined
        ? settingsData.memory.memory_enabled !== false
        : fallback.memoryEnabled,
    longTermMemory:
      settingsData.memory?.allow_long_term_memory !== undefined
        ? settingsData.memory.allow_long_term_memory !== false
        : fallback.longTermMemory,
  };
}

function readDomSettingsDraft(): SettingsDraft {
  if (typeof document === "undefined") return DEFAULT_SETTINGS_DRAFT;
  const root = document.documentElement;
  return {
    ...DEFAULT_SETTINGS_DRAFT,
    theme: root.dataset.theme === "light" ? "light" : "dark",
    accent: root.style.getPropertyValue("--accent").trim() || DEFAULT_SETTINGS_DRAFT.accent,
    compact: root.dataset.compact === "true",
    animations: root.dataset.motion !== "false",
  };
}

function areSettingsEqual(a: SettingsDraft, b: SettingsDraft): boolean {
  return (
    a.theme === b.theme &&
    a.accent === b.accent &&
    a.compact === b.compact &&
    a.animations === b.animations &&
    a.responseLength === b.responseLength &&
    a.markdown === b.markdown &&
    a.personality === b.personality &&
    a.memoryEnabled === b.memoryEnabled &&
    a.longTermMemory === b.longTermMemory
  );
}

export default function SettingsModal({
  initialTab = "Appearance",
  open,
  onClose,
}: SettingsModalProps) {
  const { user, isAuthenticated } = useAuth();

  const [tab, setTab] = useState<SettingsTab>(initialTab);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [savedSnapshot, setSavedSnapshot] = useState<SettingsDraft>(DEFAULT_SETTINGS_DRAFT);
  const [draft, setDraft] = useState<SettingsDraft>(DEFAULT_SETTINGS_DRAFT);
  const [memories, setMemories] = useState<MemoryItem[]>([]);

  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasUnsavedChanges = !areSettingsEqual(draft, savedSnapshot);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setSaved(false);
      setSaveError(null);
      setLoadError(null);
    }
  }, [open, initialTab]);

  // Load existing settings and memories
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setLoadError(null);
      try {
        if (isAuthenticated) {
          const [settingsResult, memoriesResult] = await Promise.allSettled([
            fetchSettings(),
            fetchMemories(),
          ]);

          if (cancelled) return;

          if (settingsResult.status === "fulfilled" && settingsResult.value) {
            const loadedDraft = parseSettingsDraft(settingsResult.value);
            setSavedSnapshot(loadedDraft);
            setDraft(loadedDraft);
          } else {
            const reason =
              settingsResult.status === "rejected" && settingsResult.reason instanceof Error
                ? settingsResult.reason.message
                : "Failed to load settings";
            setLoadError(reason);
          }

          if (memoriesResult.status === "fulfilled" && Array.isArray(memoriesResult.value)) {
            setMemories(memoriesResult.value);
          }
        } else {
          const guestDraft = readDomSettingsDraft();
          setSavedSnapshot(guestDraft);
          setDraft(guestDraft);
          setMemories([]);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load settings:", err);
          setLoadError("Failed to load settings");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [open, isAuthenticated, user?.username]);

  // Keep edits as unsaved local state until Save Settings is clicked
  const updateDraft = (patch: Partial<SettingsDraft>) => {
    if (savedTimerRef.current) {
      clearTimeout(savedTimerRef.current);
      savedTimerRef.current = null;
    }
    setSaved(false);
    setSaveError(null);
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  // Discard unsaved local edits and revert to last saved state
  const handleDiscard = () => {
    if (saving) return;
    if (savedTimerRef.current) {
      clearTimeout(savedTimerRef.current);
      savedTimerRef.current = null;
    }
    setDraft(savedSnapshot);
    setSaved(false);
    setSaveError(null);
  };

  // Keyboard navigation & escape key
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Save full settings to backend
  const handleSave = async () => {
    if (saving) return;
    if (savedTimerRef.current) {
      clearTimeout(savedTimerRef.current);
      savedTimerRef.current = null;
    }

    setSaved(false);
    setSaveError(null);

    if (!isAuthenticated) {
      setSaveError("Please sign in to save settings.");
      return;
    }

    if (!hasUnsavedChanges) return;

    setSaving(true);
    try {
      const updated = await updateSettings({
        appearance: {
          theme: draft.theme,
          accent_color: draft.accent,
          compact_mode: draft.compact,
          animations: draft.animations,
        },
        ai: {
          response_length: draft.responseLength,
          markdown_enabled: draft.markdown,
          personality: draft.personality,
        },
        memory: {
          memory_enabled: draft.memoryEnabled,
          allow_long_term_memory: draft.longTermMemory,
        },
      });

      const persistedDraft = parseSettingsDraft(updated, draft);
      setSavedSnapshot(persistedDraft);
      setDraft(persistedDraft);

      applyAppearanceToDom({
        theme: persistedDraft.theme,
        accent_color: persistedDraft.accent,
        compact_mode: persistedDraft.compact,
        animations: persistedDraft.animations,
      });

      setSaved(true);
      savedTimerRef.current = setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (e) {
      console.error("Failed to save settings:", e);
      setSaved(false);
      setSaveError(
        e instanceof Error && e.message
          ? e.message
          : "Failed to save settings. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || !open) return null;

  const tabs: SettingsTab[] = ["Appearance", "AI", "Memory", "About"];

  return createPortal(
    <div className="settings-backdrop" onClick={onClose}>
      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="settings-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Settings Navigation Sidebar */}
        <nav className="settings-nav" aria-label="Settings sections">
          <div className="settings-nav-title">Settings</div>

          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              aria-current={tab === item ? "page" : undefined}
              className={tab === item ? "active" : ""}
              onClick={() => {
                setTab(item);
                if (contentRef.current) contentRef.current.scrollTop = 0;
              }}
            >
              <SettingsIcon tab={item} />
              <span>{item === "AI" ? "AI preferences" : item}</span>
            </button>
          ))}
        </nav>

        {/* Settings Main Content Area */}
        <section className="settings-main">
          <header className="settings-header">
            <div>
              <h2 id="settings-title">{tab === "AI" ? "AI preferences" : tab}</h2>
            </div>
            <button
              type="button"
              className="icon-button settings-close"
              aria-label="Close settings"
              onClick={onClose}
            >
              ×
            </button>
          </header>

          <div className="settings-body" ref={contentRef}>
            {loading ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "var(--muted)" }}>
                Loading settings...
              </div>
            ) : (
              <>
                {/* Appearance Tab */}
                {tab === "Appearance" && (
                  <>
                    <p className="settings-intro">A quieter workspace. Your kind of atmosphere.</p>
                    <div className="theme-previews" role="group" aria-label="Theme">
                      {(["light", "dark"] as const).map((t) => (
                        <button
                          type="button"
                          className={`theme-preview ${t} ${draft.theme === t ? "chosen" : ""}`}
                          key={t}
                          aria-pressed={draft.theme === t}
                          onClick={() => updateDraft({ theme: t })}
                        >
                          <span className="mini-window">
                            <i className="mini-sidebar" />
                            <i className="mini-message" />
                            <i className="mini-answer" />
                            <i className="mini-composer" />
                          </span>
                          <span className="theme-preview-label">
                            {t === "dark" ? "Graphite" : "Pearl"}
                            <span className="selection-circle">{draft.theme === t ? "✓" : ""}</span>
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="setting-row">
                      <div>
                        <h3>Accent color</h3>
                        <p>A subtle signature, never a distraction.</p>
                      </div>
                      <div className="accent-swatches">
                        {[
                          ["#b2a0e8", "Axiom purple"],
                          ["#91ada5", "Sage"],
                          ["#8fa9ce", "Slate blue"],
                          ["#c7a88c", "Sand"],
                        ].map(([color, label]) => (
                          <button
                            type="button"
                            key={label}
                            aria-label={label}
                            aria-pressed={draft.accent === color}
                            style={{ background: color }}
                            onClick={() => updateDraft({ accent: color })}
                          >
                            {draft.accent === color ? "✓" : ""}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="setting-row">
                      <div>
                        <h3>Compact mode</h3>
                        <p>A little less spacing. More room for the conversation.</p>
                      </div>
                      <Toggle
                        label="Compact mode"
                        value={draft.compact}
                        onChange={(val) => updateDraft({ compact: val })}
                      />
                    </div>

                    <div className="setting-row">
                      <div>
                        <h3>Animations & depth</h3>
                        <p>Gentle movement and dimensional details.</p>
                      </div>
                      <Toggle
                        label="Animations and depth"
                        value={draft.animations}
                        onChange={(val) => updateDraft({ animations: val })}
                      />
                    </div>
                  </>
                )}

                {/* AI Tab */}
                {tab === "AI" && (
                  <>
                    <p className="settings-intro">Shape the way Axiom responds to you.</p>

                    <div className="setting-row stacked">
                      <div>
                        <h3>Response length</h3>
                        <p>Just enough detail, or room to go deeper.</p>
                      </div>
                      <Choices
                        label="Response length"
                        value={draft.responseLength}
                        options={["Short", "Balanced", "Detailed"]}
                        onChange={(v) =>
                          updateDraft({ responseLength: v as SettingsDraft["responseLength"] })
                        }
                      />
                    </div>

                    <div className="setting-row">
                      <div>
                        <h3>Markdown</h3>
                        <p>Use formatted headings, lists, and emphasis.</p>
                      </div>
                      <Toggle
                        label="Markdown"
                        value={draft.markdown}
                        onChange={(val) => updateDraft({ markdown: val })}
                      />
                    </div>

                    <div className="setting-row stacked">
                      <div>
                        <h3>Personality</h3>
                        <p>A tone that fits the way you think.</p>
                      </div>
                      <Choices
                        label="Personality"
                        value={draft.personality}
                        options={["Adaptive", "Professional", "Creative"]}
                        onChange={(v) =>
                          updateDraft({ personality: v as SettingsDraft["personality"] })
                        }
                      />
                    </div>
                  </>
                )}

                {/* Memory Tab */}
                {tab === "Memory" && (
                  <>
                    <p className="settings-intro">Continuity when you want it. Control, always.</p>

                    <div className="setting-row">
                      <div>
                        <h3>Enable memory</h3>
                        <p>Let Axiom build context across conversations.</p>
                      </div>
                      <Toggle
                        label="Enable memory"
                        value={draft.memoryEnabled}
                        onChange={(val) => updateDraft({ memoryEnabled: val })}
                      />
                    </div>

                    <div className={`setting-row ${!draft.memoryEnabled ? "setting-disabled" : ""}`}>
                      <div>
                        <h3>Long-term memory</h3>
                        <p>Keep useful details beyond a single session.</p>
                      </div>
                      <Toggle
                        label="Long-term memory"
                        disabled={!draft.memoryEnabled}
                        value={draft.memoryEnabled && draft.longTermMemory}
                        onChange={(val) => updateDraft({ longTermMemory: val })}
                      />
                    </div>

                    {memories.length === 0 ? (
                      <div className="memory-empty">
                        <span className="memory-symbol">
                          <SettingsIcon tab="Memory" />
                        </span>
                        <h3>A clean slate.</h3>
                        <p>
                          No stored memories yet.
                          <br />
                          Your thoughts have room to grow.
                        </p>
                      </div>
                    ) : (
                      <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>
                          Stored Memories ({memories.length})
                        </h4>
                        {memories.map((m) => (
                          <div
                            key={m.memory_id}
                            style={{
                              padding: "12px",
                              borderRadius: "8px",
                              background: "var(--surface)",
                              border: "1px solid var(--border)",
                              fontSize: "13px",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                              <span style={{ fontWeight: 600, color: "var(--accent)" }}>{m.category}</span>
                              <span style={{ fontSize: "11px", color: "var(--muted)" }}>{m.key}</span>
                            </div>
                            <p style={{ margin: 0, color: "var(--text)" }}>{m.memory}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* About Tab */}
                {tab === "About" && (
                  <>
                    <div className="about-brand">
                      <h3>Axiom V2</h3>
                      <p>An intelligent AI assistant for exploration, reasoning, and productivity.</p>
                    </div>

                    <div className="setting-row">
                      <h3>Version</h3>
                      <span className="version-badge">2.0</span>
                    </div>

                    <div className="setting-row">
                      <h3>Built by</h3>
                      <span>Niyati Sompura</span>
                    </div>

                    <div className="setting-row stacked">
                      <div>
                        <h3>Original product stack</h3>
                        <p>The foundation of the Axiom product.</p>
                      </div>
                      <div className="stack-tags">
                        {["FastAPI", "GPT", "MongoDB", "Next.js"].map((t) => (
                          <span key={t}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <footer className="settings-footer">
            {saveError ? (
              <span className="settings-status error" role="alert">
                {saveError}
              </span>
            ) : loadError ? (
              <span className="settings-status error" role="alert">
                {loadError}
              </span>
            ) : saved ? (
              <span className="settings-status success" role="status">
                Settings saved successfully ✓
              </span>
            ) : !isAuthenticated ? (
              <span className="settings-status">Sign in to save settings</span>
            ) : hasUnsavedChanges ? (
              <span className="settings-status unsaved">Unsaved changes</span>
            ) : (
              <span className="settings-status">Save to apply changes</span>
            )}

            {(tab !== "About" || hasUnsavedChanges) && (
              <div className="settings-footer-actions">
                {hasUnsavedChanges && (
                  <button
                    type="button"
                    className="settings-discard"
                    disabled={saving}
                    onClick={handleDiscard}
                  >
                    Discard
                  </button>
                )}
                <button
                  type="button"
                  className="settings-save"
                  disabled={saving || !hasUnsavedChanges || !isAuthenticated}
                  onClick={handleSave}
                >
                  {saving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            )}
          </footer>
        </section>
      </div>
    </div>,
    document.body
  );
}
