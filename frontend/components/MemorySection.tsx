import React, { useState, useEffect } from 'react';
import { fetchSettings, updateSettings, fetchMemories } from '../lib/settingsApi';
import { useAuth } from '@/context/AuthContext';
import styles from './MemorySection.module.css';

interface MemorySettings {
  memory_enabled: boolean;
  allow_long_term_memory: boolean;
}

interface MemoryItem {
  memory_id: string;
  category: string;
  key: string;
  memory: string;
  created_at: string;
}

const MemorySection: React.FC<{ username: string }> = ({ username }) => {
  const [settings, setSettings] = useState<MemorySettings>({
    memory_enabled: true,
    allow_long_term_memory: true,
  });
  const [memories, setMemories] = useState<MemoryItem[]>([]);
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
        const [settingsData, memoriesData] = await Promise.all([
          fetchSettings(),
          fetchMemories()
        ]);
        
        if (settingsData?.memory) {
          setSettings({
            memory_enabled: settingsData.memory.memory_enabled ?? true,
            allow_long_term_memory: settingsData.memory.allow_long_term_memory ?? true,
          });
        }
        
        if (Array.isArray(memoriesData)) {
          setMemories(memoriesData);
        }
      } catch (e) {
        console.error('Failed to load Memory data', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading, isAuthenticated]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setSettings(prev => ({ ...prev, [name]: checked }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateSettings({ memory: settings });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Failed to save Memory settings', e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.field}>
        <label>Enable Memory</label>
        <input 
          type="checkbox" 
          name="memory_enabled" 
          checked={settings.memory_enabled} 
          onChange={handleChange}
          className={styles.checkbox}
        />
      </div>

      <div className={styles.field}>
        <label>Allow Long Term Memory</label>
        <input 
          type="checkbox" 
          name="allow_long_term_memory" 
          checked={settings.allow_long_term_memory} 
          onChange={handleChange}
          className={styles.checkbox}
        />
      </div>

      <button 
        onClick={handleSave} 
        disabled={saving || saved} 
        className={styles.saveButton}
      >
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
      </button>

      <div className={styles.memoriesContainer}>
        <h3 className={styles.memoriesTitle}>Your Memories</h3>
        {memories.length === 0 ? (
          <p className={styles.noMemories}>You have no stored memories yet.</p>
        ) : (
          <div className={styles.memoryList}>
            {memories.map((mem) => (
              <div key={mem.memory_id} className={styles.memoryCard}>
                <div className={styles.memoryHeader}>
                  <span className={styles.memoryCategory}>{mem.category}</span>
                  <span className={styles.memoryKey}>{mem.key}</span>
                </div>
                <p className={styles.memoryText}>{mem.memory}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemorySection;
