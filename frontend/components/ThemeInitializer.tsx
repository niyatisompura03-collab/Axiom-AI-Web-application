"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchSettings } from "@/lib/settingsApi";

export default function ThemeInitializer() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const applyTheme = (theme: string, accent_color?: string, compact_mode?: boolean, animations?: boolean) => {
      const root = document.documentElement;
      
      // Handle theme
      if (theme === 'light') {
        root.classList.add('light');
        root.classList.remove('dark');
      } else if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else if (theme === 'system') {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
          root.classList.add('light');
          root.classList.remove('dark');
        } else {
          root.classList.add('dark');
          root.classList.remove('light');
        }
      }

      // Handle accent color
      if (accent_color) {
        root.style.setProperty('--accent-color', accent_color);
      } else {
        root.style.removeProperty('--accent-color');
      }

      // Handle compact mode
      if (compact_mode) {
        root.classList.add('compact');
      } else {
        root.classList.remove('compact');
      }

      // Handle animations
      if (animations === false) {
        root.classList.add('no-animations');
      } else {
        root.classList.remove('no-animations');
      }
    };

    if (isAuthenticated) {
      fetchSettings().then((data) => {
        if (data?.appearance) {
          applyTheme(
            data.appearance.theme || 'dark',
            data.appearance.accent_color,
            data.appearance.compact_mode,
            data.appearance.animations !== false
          );
        }
      }).catch(console.error);
    } else {
      // Apply defaults for guests
      applyTheme('dark', '#6366f1', false, true);
    }
  }, [isAuthenticated]);

  return null;
}
