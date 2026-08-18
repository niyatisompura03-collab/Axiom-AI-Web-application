import React, { useState, useEffect } from 'react';
import { fetchSettings, updateSettings } from '../lib/settingsApi';
import { useAuth } from '@/context/AuthContext';
import styles from './AISection.module.css';

interface AISettings {
  response_length: 'short' | 'balanced' | 'detailed';
  markdown_enabled: boolean;
  personality: 'adaptive' | 'professional' | 'creative';
}

const AISection: React.FC<{ username: string }> = ({ username }) => {
  const [settings, setSettings] = useState<AISettings>({
    response_length: 'balanced',
    markdown_enabled: true,
    personality: 'adaptive',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { loading: authLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (authLoading) return; // wait for auth to finish
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const data = await fetchSettings();
        if (data?.ai) {
          setSettings({
            response_length: data.ai.response_length ?? 'balanced',
            markdown_enabled: data.ai.markdown_enabled ?? true,
            personality: data.ai.personality ?? 'adaptive',
          });
        }
      } catch (e) {
        console.error('Failed to load AI settings', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading, isAuthenticated]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const newValue = type === 'checkbox' ? checked : value;
    setSettings(prev => ({ ...prev, [name]: newValue } as any));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateSettings({ ai: settings });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Failed to save AI settings', e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.field}>
        <label>Response Length</label>
        <div className={styles.radioGroup}>
          <label>
            <input
              type="radio"
              name="response_length"
              value="short"
              checked={settings.response_length === 'short'}
              onChange={handleChange}
            />
            Short
          </label>
          <label>
            <input
              type="radio"
              name="response_length"
              value="balanced"
              checked={settings.response_length === 'balanced'}
              onChange={handleChange}
            />
            Balanced
          </label>
          <label>
            <input
              type="radio"
              name="response_length"
              value="detailed"
              checked={settings.response_length === 'detailed'}
              onChange={handleChange}
            />
            Detailed
          </label>
        </div>
      </div>
      <div className={styles.field}>
        <label htmlFor="markdown_enabled">Markdown</label>
        <input
          type="checkbox"
          id="markdown_enabled"
          name="markdown_enabled"
          checked={settings.markdown_enabled}
          onChange={handleChange}
          className={styles.checkbox}
        />
      </div>
      <div className={styles.field}>
        <label>Personality</label>
        <div className={styles.radioGroup}>
          <label>
            <input
              type="radio"
              name="personality"
              value="adaptive"
              checked={settings.personality === 'adaptive'}
              onChange={handleChange}
            />
            Adaptive
          </label>
          <label>
            <input
              type="radio"
              name="personality"
              value="professional"
              checked={settings.personality === 'professional'}
              onChange={handleChange}
            />
            Professional
          </label>
          <label>
            <input
              type="radio"
              name="personality"
              value="creative"
              checked={settings.personality === 'creative'}
              onChange={handleChange}
            />
            Creative
          </label>
        </div>
      </div>
      <button onClick={handleSave} disabled={saving || saved} className={styles.saveButton}>
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
};

export default AISection;
