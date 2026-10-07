// components/ProfileModal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./SettingsModal.module.css";
import { User, X, Calendar, Edit2, Check, AlertCircle, Camera, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

const validateDob = (dobString: string): string | null => {
  if (!dobString || !dobString.trim()) return null;
  const trimmed = dobString.trim();

  // Match YYYY-MM-DD format
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return "Invalid date of birth format. Must be YYYY-MM-DD.";
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  // Validate calendar date (e.g. leap days, 30-day months)
  const dateObj = new Date(year, month - 1, day);
  if (
    dateObj.getFullYear() !== year ||
    dateObj.getMonth() !== month - 1 ||
    dateObj.getDate() !== day
  ) {
    return "Invalid calendar date.";
  }

  // Realistic birth year check
  if (year < 1900) {
    return "Date of birth year must be 1900 or later.";
  }

  // Age check: must be born in 2016 or earlier (user must be at least ~10 years old)
  if (year > 2016) {
    return "Date of birth must be 2016 or earlier.";
  }

  // Future date check (cannot be later than today)
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  if (dateObj > todayEnd) {
    return "Date of birth cannot be in the future.";
  }

  return null;
};

const formatDateDisplay = (dobStr?: string | null): string => {
  if (!dobStr) return "Not set";
  const cleanStr = dobStr.split("T")[0];
  const parts = cleanStr.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month - 1, day);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    }
  }
  return dobStr;
};

export default function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { user, updateProfile } = useAuth();
  const [animating, setAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: "", avatar: "", dob: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setAvatarError(false);
  }, [isEditing ? editForm.avatar : user?.avatar]);

  useEffect(() => {
    if (open) {
      setAnimating(true);
      if (user) {
        setEditForm({ 
          username: user.username, 
          avatar: user.avatar || "", 
          dob: user.dob ? user.dob.split("T")[0] : "" 
        });
      }
      setIsEditing(false);
      setError("");
    } else if (animating) {
      const timer = setTimeout(() => setAnimating(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open, animating, user]);

  if (!mounted) return null;
  if (!open && !animating) return null;

  const backdropClass = `${styles.backdrop} ${open ? styles.modalEnter : styles.modalExit}`;

  const handleSave = async () => {
    setError("");

    const trimmedUsername = editForm.username.trim();
    if (!trimmedUsername) {
      setError("Username cannot be empty");
      return;
    }

    if (editForm.dob && editForm.dob.trim()) {
      const dobError = validateDob(editForm.dob.trim());
      if (dobError) {
        setError(dobError);
        return;
      }
    }

    setSaving(true);
    try {
      await updateProfile({
        username: trimmedUsername,
        avatar: editForm.avatar ? editForm.avatar : null,
        dob: editForm.dob && editForm.dob.trim() ? editForm.dob.trim() : null,
      });
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setEditForm({ 
        username: user.username, 
        avatar: user.avatar || "", 
        dob: user.dob ? user.dob.split("T")[0] : "" 
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsEditing(false);
    setError("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Image size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setEditForm(prev => ({ ...prev, avatar: event.target!.result as string }));
        setError("");
      }
    };
    reader.onerror = () => {
      setError("Failed to read the file");
    };
    reader.readAsDataURL(file);
  };

  return createPortal(
    <div className={backdropClass} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: "450px", minHeight: "auto" }}>
        
        <div className={styles.mainContent}>
          <div className={styles.contentHeader}>
            <h2 className={styles.contentTitle}>Profile</h2>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close profile">
              <X size={20} />
            </button>
          </div>
          <div className={styles.contentBody} style={{ padding: "2rem" }}>
            
            <div className="flex flex-col items-center justify-center mb-6 relative">
              <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center text-white shadow-elevation mb-4 overflow-hidden border-2 border-border">
                {(isEditing ? editForm.avatar : user?.avatar) && !avatarError ? (
                  <img src={isEditing ? editForm.avatar : user?.avatar || ""} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={() => setAvatarError(true)} />
                ) : (
                  <User size={48} />
                )}
              </div>
              <h3 className="text-xl font-bold text-text-primary">{isEditing ? editForm.username : user?.username}</h3>
              <span className="text-sm text-text-muted mt-1 px-3 py-1 rounded-full bg-surface-input border border-border">Free Plan</span>

              {!isEditing && (
                <button 
                  type="button"
                  onClick={() => setIsEditing(true)}
                  aria-label="Edit Profile"
                  className="absolute top-0 right-0 w-8 h-8 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary bg-surface-secondary hover:bg-surface border border-border transition-colors cursor-pointer"
                  title="Edit Profile"
                >
                  <Edit2 size={15} />
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="bg-surface-input border border-border rounded-xl p-4">
                <label className="text-xs text-text-secondary uppercase font-semibold tracking-wider mb-2 block">Username</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editForm.username}
                    onChange={e => {
                      setEditForm(prev => ({ ...prev, username: e.target.value }));
                      setError("");
                    }}
                    className="w-full h-10 bg-surface-secondary border border-border focus:border-accent rounded-xl px-3.5 text-text-primary placeholder:text-text-muted outline-none focus:shadow-focus transition-all text-sm"
                  />
                ) : (
                  <div className="flex items-center gap-3 text-text-primary text-sm">
                    <User size={16} className="text-text-muted shrink-0" />
                    <span>{user?.username}</span>
                  </div>
                )}
              </div>
              
              {/* Email Section */}
              <div className="bg-surface-input border border-border rounded-xl p-4">
                <label className="text-xs text-text-secondary uppercase font-semibold tracking-wider mb-2 block">Email</label>
                <div className="flex items-center gap-3 text-text-primary text-sm">
                  <Mail size={16} className="text-text-muted shrink-0" />
                  <span className={!user?.email ? "text-text-muted italic" : ""}>{user?.email || "No email associated"}</span>
                </div>
              </div>
              
              {isEditing && (
                <div className="bg-surface-input border border-border rounded-xl p-4">
                  <label className="text-xs text-text-secondary uppercase font-semibold tracking-wider mb-3 block">Avatar</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-white overflow-hidden border-2 border-border shrink-0">
                      {editForm.avatar && !avatarError ? (
                        <img src={editForm.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={() => setAvatarError(true)} />
                      ) : (
                        <User size={32} />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/*" 
                        className="hidden" 
                      />
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-8 flex items-center gap-2 text-xs font-medium text-accent bg-accent-subtle hover:bg-accent-subtle/80 px-3.5 rounded-xl border border-accent/20 transition-colors w-fit cursor-pointer"
                      >
                        <Camera size={14} />
                        Choose Photo
                      </button>
                      {editForm.avatar && (
                        <button 
                          type="button"
                          onClick={() => {
                            setEditForm(prev => ({ ...prev, avatar: "" }));
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="text-xs text-text-muted hover:text-error transition-colors text-left pl-1 cursor-pointer"
                        >
                          Remove photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-surface-input border border-border rounded-xl p-4">
                <label className="text-xs text-text-secondary uppercase font-semibold tracking-wider mb-2 block">Date of Birth <span className="text-text-muted normal-case font-normal ml-1">(Optional)</span></label>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="date" 
                      value={editForm.dob}
                      max="2016-12-31"
                      min="1900-01-01"
                      onChange={e => {
                        setEditForm(prev => ({ ...prev, dob: e.target.value }));
                        setError("");
                      }}
                      className="flex-1 h-10 bg-surface-secondary border border-border focus:border-accent rounded-xl px-3.5 text-text-primary outline-none focus:shadow-focus transition-all text-sm [color-scheme:dark]"
                    />
                    {editForm.dob && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditForm(prev => ({ ...prev, dob: "" }));
                          setError("");
                        }}
                        className="h-10 px-3 text-xs font-medium text-text-muted hover:text-error bg-surface-secondary hover:bg-surface rounded-xl border border-border transition-colors whitespace-nowrap cursor-pointer"
                        title="Clear date of birth"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-text-primary text-sm">
                    <Calendar size={16} className="text-text-muted shrink-0" />
                    <span>{formatDateDisplay(user?.dob)}</span>
                  </div>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="h-10 px-4 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary border border-transparent hover:border-border transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !editForm.username.trim()}
                  className="h-10 flex items-center gap-2 px-5 rounded-xl text-sm font-medium text-white bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-elevation active:scale-[0.98] cursor-pointer"
                >
                  {saving ? "Saving..." : (
                    <>
                      <Check size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
