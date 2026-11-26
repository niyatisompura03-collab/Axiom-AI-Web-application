export interface AppearanceDomSettings {
  theme?: string;
  accent_color?: string;
  compact_mode?: boolean;
  animations?: boolean;
}

export function applyAppearanceToDom(settings: AppearanceDomSettings): void {
  if (typeof document === "undefined" || typeof window === "undefined") return;

  const root = document.documentElement;
  const theme = settings.theme || "dark";
  const isLight =
    theme === "light" ||
    (theme === "system" && window.matchMedia?.("(prefers-color-scheme: light)").matches);

  if (isLight) {
    root.dataset.theme = "light";
    root.classList.add("light");
    root.classList.remove("dark");
  } else {
    root.dataset.theme = "dark";
    root.classList.add("dark");
    root.classList.remove("light");
  }

  if (settings.accent_color) {
    root.style.setProperty("--accent", settings.accent_color);
    root.style.setProperty("--accent-color", settings.accent_color);
  } else {
    root.style.removeProperty("--accent");
    root.style.removeProperty("--accent-color");
  }

  const compact = Boolean(settings.compact_mode);
  root.dataset.compact = String(compact);
  if (compact) {
    root.classList.add("compact");
  } else {
    root.classList.remove("compact");
  }

  const animationsEnabled = settings.animations !== false;
  root.dataset.motion = String(animationsEnabled);
  if (animationsEnabled) {
    root.classList.remove("no-animations");
  } else {
    root.classList.add("no-animations");
  }
}
