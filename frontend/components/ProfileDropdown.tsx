"use client";

import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Paintbrush, 
  UserCircle, 
  Settings, 
  HelpCircle, 
  LogOut,
  User
} from "lucide-react";

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

export default function ProfileDropdown({ isOpen, onClose, onOpenProfile, onOpenSettings, onOpenHelp }: ProfileDropdownProps) {
  const { user, loading, logout } = useAuth();
  if (loading) return null; // or a spinner
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Invisible backdrop to detect clicks outside */}
          <div 
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="
              fixed
              bottom-16
              left-3
              sm:left-4
              w-[calc(100vw-24px)]
              max-w-[250px]
              bg-surface-secondary/95
              backdrop-blur-xl
              border
              border-border
              rounded-xl
              shadow-elevation
              flex
              flex-col
              z-50
              overflow-hidden
            "
          >
            {/* Top Section */}
            <div className="p-3.5 flex items-center gap-3 bg-surface-input/80">
              <div className="w-9 h-9 rounded-lg bg-accent/20 border border-border flex items-center justify-center text-accent shrink-0 overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <img src="/user-avatar.png" alt="User Avatar" className="w-full h-full object-contain p-1" />
                )}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-semibold text-text-primary truncate">{user?.username || "Guest"}</span>
                <span className="text-xs text-text-muted truncate">{user?.email || "Free Plan"}</span>
              </div>
            </div>

            <div className="h-[1px] w-full bg-border" />

            {/* Menu Items */}
            <div className="p-2 flex flex-col gap-1">
              <button 
                type="button"
                onClick={onOpenProfile} 
                className="w-full h-10 flex items-center gap-3 px-3 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-input transition-colors text-sm font-medium cursor-pointer group"
              >
                <UserCircle size={17} className="text-text-muted group-hover:text-text-primary transition-colors shrink-0" />
                <span>Profile</span>
              </button>
              <button 
                type="button"
                onClick={onOpenSettings} 
                className="w-full h-10 flex items-center gap-3 px-3 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-input transition-colors text-sm font-medium cursor-pointer group"
              >
                <Settings size={17} className="text-text-muted group-hover:text-text-primary transition-colors shrink-0" />
                <span>Settings</span>
              </button>
            </div>

            <div className="h-[1px] w-full bg-border" />

            {/* Bottom Menu Items */}
            <div className="p-2 flex flex-col gap-1">
              <button 
                type="button"
                onClick={onOpenHelp} 
                className="w-full h-10 flex items-center gap-3 px-3 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-input transition-colors text-sm font-medium cursor-pointer group"
              >
                <HelpCircle size={17} className="text-text-muted group-hover:text-text-primary transition-colors shrink-0" />
                <span>Help</span>
              </button>
              <button 
                type="button"
                className="w-full h-10 flex items-center gap-3 px-3 rounded-lg text-text-secondary hover:text-error hover:bg-error/10 transition-colors text-sm font-medium group cursor-pointer" 
                onClick={() => { logout(); onClose(); }}
              >
                <LogOut size={17} className="text-text-muted group-hover:text-error transition-colors shrink-0" />
                <span>Log out</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
