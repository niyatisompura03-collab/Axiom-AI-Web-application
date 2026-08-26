"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { loginUser, getCurrentUser, updateUser } from "../lib/authApi";
import { saveToken, getToken, removeToken } from "../utils/token";

export interface User {
  username: string;
  avatar?: string | null;
  dob?: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: { username: string; avatar?: string | null; dob?: string | null }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        if (urlToken) {
          saveToken(urlToken);
          // Remove token from URL to keep it clean and prevent leaking
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }

      const token = getToken();
      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }
      
      const userData = await getCurrentUser(token);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Failed to refresh user session:", error);
      removeToken();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (username: string, password: string) => {
    const data = await loginUser(username, password);
    saveToken(data.access_token);
    await refreshUser();
  };

  const logout = () => {
    removeToken();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (data: { username: string; avatar?: string | null; dob?: string | null }) => {
    const token = getToken();
    if (!token) throw new Error("Not authenticated");
    
    const response = await updateUser(token, data);
    
    if (response.access_token) {
      saveToken(response.access_token);
    }
    
    setUser(response.user);
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);
  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, loading, login, logout, refreshUser, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
