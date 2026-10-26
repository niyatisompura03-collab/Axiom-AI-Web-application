"use client";

import AppearanceSection from '@/components/AppearanceSection';
import AISection from '@/components/AISection';
import MemorySection from '@/components/MemorySection';
import AboutSection from '@/components/AboutSection';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  if (loading) return null;
  const username = user?.username ?? "";
  return (
    <div className="px-4 py-6 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-4xl mx-auto w-full min-h-[100dvh]">
      <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Settings</h1>
      <AppearanceSection username={username} />
      <AISection username={username} />
      <MemorySection username={username} />
      <AboutSection />
    </div>
  );
}
