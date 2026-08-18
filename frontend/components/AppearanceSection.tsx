import React, { useState, useEffect } from 'react';
import { useAuth } from "@/context/AuthContext";
import { updateSettings, fetchSettings } from '../lib/settingsApi';
import styles from './AppearanceSection.module.css';

interface AppearanceSettings {
  theme: string;
  accent_color: string;
  compact_mode: boolean;
  animations?: boolean;
}

const AppearanceSection: React.FC<{ username: string }> = ({ username }) => {
  const [settings, setSettings] = useState<AppearanceSettings>({
    theme: 'dark',
    accent_color: '#6366f1',
    compact_mode: false,
    animations: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { loading: authLoading, isAuthenticated } = useAuth();
  
  // Load settings from backend
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const data = await fetchSettings();
        if (data?.appearance) {
          setSettings({
            theme: data.appearance.theme ?? 'dark',
            accent_color: data.appearance.accent_color ?? '#6366f1',
            compact_mode: data.appearance.compact_mode ?? false,
            animations: data.appearance.animations ?? true,
          });
        }
      } catch (e) {
        console.error('Failed to load settings', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading, isAuthenticated]);

  // Apply theme and accent color to the document whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // toggle dark class on root element
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      // set accent color CSS variable
      document.documentElement.style.setProperty('--accent-color', settings.accent_color);
    }
  }, [settings.theme, settings.accent_color]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, type, value } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const newValue = type === 'checkbox' ? checked : value;
    setSettings(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateSettings({ appearance: settings });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Failed to save settings', e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.field}>
        <label htmlFor="compact_mode">Compact Mode</label>
        <input
          type="checkbox"
          name="compact_mode"
          id="compact_mode"
          checked={settings.compact_mode}
          onChange={handleChange}
          className={styles.checkbox}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="animations">Animations</label>
        <input
          type="checkbox"
          name="animations"
          id="animations"
          checked={settings.animations}
          onChange={handleChange}
          className={styles.checkbox}
        />
      </div>
      <p className={styles.note}>Future dark/light support will automatically adapt when the OS theme changes.</p>
      <button onClick={handleSave} disabled={saving || saved} className={styles.saveButton}>
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
};

export default AppearanceSection;
