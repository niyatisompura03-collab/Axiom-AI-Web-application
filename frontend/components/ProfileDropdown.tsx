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
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="
              absolute
              bottom-16
              left-4
              w-64
              bg-[#161b22]/95
              backdrop-blur-xl
              border
              border-white/10
              rounded-none
              shadow-[0_10px_40px_rgba(0,0,0,0.5),0_0_20px_rgba(139,92,246,0.1)]
              flex
              flex-col
              z-50
              overflow-hidden
              text-sm
            "
          >
            {/* Top Section */}
            <div className="p-4 flex items-center gap-3 bg-white/[0.02]">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white shrink-0 shadow-[0_0_10px_rgba(139,92,246,0.3)] overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={20} />
                )}
              </div>
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className="font-semibold text-white truncate">{user?.username || "Guest"}</span>
              </div>
            </div>

            <div className="h-[1px] w-full bg-white/10" />

            {/* Menu Items */}
            <div className="p-2 flex flex-col">

              <button onClick={onOpenProfile} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                <UserCircle size={16} className="text-gray-400" />
                <span>Profile</span>
              </button>
              <button onClick={onOpenSettings} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                <Settings size={16} className="text-gray-400" />
                <span>Settings</span>
              </button>
            </div>

            <div className="h-[1px] w-full bg-white/10" />

            {/* Bottom Menu Items */}
            <div className="p-2 flex flex-col">
              <button onClick={onOpenHelp} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                <HelpCircle size={16} className="text-gray-400" />
                <span>Help</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-colors group" onClick={() => { logout(); onClose(); }}>
                <LogOut size={16} className="text-gray-400 group-hover:text-red-400" />
                <span>Log out</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
