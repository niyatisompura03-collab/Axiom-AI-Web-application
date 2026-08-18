// Next.js App Router API route for settings
// Provides in‑memory dummy settings for the demo UI.
// GET  /api/settings?userId=...  -> returns current settings
// POST /api/settings            -> merges payload into settings and returns updated

import { NextResponse } from 'next/server';

type AppearanceSettings = {
  theme: string;
  accent_color: string;
  compact_mode: boolean;
  animations?: boolean;
};

type AISettings = {
  response_length: 'short' | 'balanced' | 'detailed';
  markdown_enabled: boolean;
  personality: 'adaptive' | 'professional' | 'creative';
};

type MemorySettings = AISettings;

type Settings = {
  appearance?: AppearanceSettings;
  ai?: AISettings;
  memory?: MemorySettings;
};

// Simple in‑memory store – replace with DB in production.
let dummySettings: Settings = {
  appearance: {
    theme: 'dark',
    accent_color: '#6366f1',
    compact_mode: false,
    animations: true,
  },
  ai: {
    response_length: 'balanced',
    markdown_enabled: true,
    personality: 'adaptive',
  },
  memory: {
    response_length: 'balanced',
    markdown_enabled: true,
    personality: 'adaptive',
  },
};

export async function GET(request: Request) {
  // In a real app you would look up settings by userId.
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') ?? 'guest';
  // For demo purposes we ignore userId and always return the same dummy data.
  return NextResponse.json(dummySettings);
}

export async function POST(request: Request) {
  // Expect a JSON body with partial settings to merge.
  const payload = await request.json();
  // Deep merge simple top‑level keys.
  dummySettings = { ...dummySettings, ...payload } as Settings;
  return NextResponse.json({ success: true, settings: dummySettings });
}
