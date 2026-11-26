"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchSettings } from "@/lib/settingsApi";
import { applyAppearanceToDom } from "@/utils/theme";

export default function ThemeInitializer() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings()
        .then((data) => {
          if (data?.appearance) {
            applyAppearanceToDom({
              theme: data.appearance.theme || "dark",
              accent_color: data.appearance.accent_color,
              compact_mode: data.appearance.compact_mode,
              animations: data.appearance.animations !== false,
            });
          }
        })
        .catch(console.error);
    } else {
      // Apply defaults for guests
      applyAppearanceToDom({
        theme: "dark",
        accent_color: "#6366f1",
        compact_mode: false,
        animations: true,
      });
    }
  }, [isAuthenticated]);

  return null;
}
