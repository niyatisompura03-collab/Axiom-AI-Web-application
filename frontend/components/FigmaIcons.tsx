"use client";

import React from "react";

export type IconName =
  | "plus"
  | "panel"
  | "chat"
  | "sun"
  | "moon"
  | "chevron"
  | "arrow"
  | "attach"
  | "copy"
  | "refresh"
  | "edit"
  | "close"
  | "more"
  | "logout"
  | "eye"
  | "check"
  | "arrowLeft"
  | "file";

export function Icon({ name, size = 18, className = "" }: { name: IconName; size?: number; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    plus: <path d="M12 5v14M5 12h14" />,
    panel: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path d="M9 4v16M5.8 8h.4M5.8 11h.4" />
      </>
    ),
    chat: (
      <path d="M20 11.5a7.8 7.8 0 0 1-8 7.5 9 9 0 0 1-3.5-.7L4 20l1.4-4A7.2 7.2 0 0 1 4 11.5 7.8 7.8 0 0 1 12 4a7.8 7.8 0 0 1 8 7.5Z" />
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
    moon: <path d="M20.5 13A8.6 8.6 0 0 1 11 3.5 8.6 8.6 0 1 0 20.5 13Z" />,
    chevron: <path d="m9 5 7 7-7 7" />,
    arrow: <path d="M12 19V5m-6 6 6-6 6 6" />,
    attach: <path d="m8 13 6.5-6.5a2.5 2.5 0 0 1 3.5 3.5l-8.5 8.5a4 4 0 0 1-5.7-5.7L12 4.5" />,
    copy: (
      <>
        <rect x="8" y="8" width="12" height="13" rx="2" />
        <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M6 7a7 7 0 0 1 11-1l3 6M4 12l3 6a7 7 0 0 0 11-1" />
      </>
    ),
    edit: (
      <>
        <path d="m15 4 5 5M4 20l5-1L20 8a3.5 3.5 0 0 0-5-5L4 14Z" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    more: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
    logout: (
      <>
        <path d="M9 4H5v16h4m6-12 4 4-4 4M9 12h10" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    arrowLeft: <path d="M20 12H4m6-6-6 6 6 6" />,
    file: (
      <>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
        <path d="M14 3v5h5M9 13h6M9 17h4" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}

export function Mark({ className = "", size = 29 }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path d="m4 25 10.2-18a2 2 0 0 1 3.5 0L28 25h-5.2L16 12.8 9.2 25H4Z" fill="currentColor" />
      <path d="m12.8 25 3.2-5.7 3.2 5.7h-6.4Z" fill="var(--accent, #b2a0e8)" />
    </svg>
  );
}

export type SettingsTab = "Appearance" | "AI" | "Memory" | "About";

const tabPaths: Record<string, React.ReactNode> = {
  Profile: (
    <>
      <circle cx="12" cy="8" r="3" />
      <path d="M5 21v-3a7 7 0 0 1 14 0v3" />
    </>
  ),
  Appearance: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 0 0 18Z" />
    </>
  ),
  AI: <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" />,
  Memory: (
    <>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0" />
    </>
  ),
  About: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6m0-10v.1" />
    </>
  ),
};

export function SettingsIcon({ tab = "Appearance", size = 17, className = "" }: { tab?: string; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {tabPaths[tab]}
    </svg>
  );
}
