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
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white">Settings</h1>
      <AppearanceSection username={username} />
      <AISection username={username} />
      <MemorySection username={username} />
      <AboutSection />
    </div>
  );
}
