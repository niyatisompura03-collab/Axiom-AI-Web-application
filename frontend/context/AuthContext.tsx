"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { loginUser, getCurrentUser, updateUser } from "../lib/authApi";
import {
  saveToken,
  getToken,
  removeToken,
  getTokenExpirationMs,
  isTokenExpired,
} from "../utils/token";

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];

function isPublicAuthRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export interface User {
  username: string;
  email?: string | null;
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
  const router = useRouter();
  const pathname = usePathname();
  const redirectingRef = useRef(false);

  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const clearExpiredSession = useCallback(() => {
    removeToken();
    setUser(null);
    setIsAuthenticated(false);

    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      if (!isPublicAuthRoute(currentPath) && !redirectingRef.current) {
        redirectingRef.current = true;
        router.replace("/login");
      }
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
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

      if (isTokenExpired(token)) {
        clearExpiredSession();
        return;
      }
      
      const userData = await getCurrentUser(token);
      redirectingRef.current = false;
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Failed to refresh user session:", error);
      const token = getToken();
      const status = (error as { status?: number } | null)?.status;
      if (status === 401 || (token && isTokenExpired(token))) {
        clearExpiredSession();
      } else {
        removeToken();
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  }, [clearExpiredSession]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (isPublicAuthRoute(pathname)) {
      redirectingRef.current = false;
    }
  }, [pathname]);

  const login = async (username: string, password: string) => {
    redirectingRef.current = false;
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
      clearExpiredSession();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [clearExpiredSession]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const verifyActiveSession = async () => {
      const token = getToken();
      if (!token) {
        clearExpiredSession();
        return;
      }
      if (isTokenExpired(token)) {
        try {
          await getCurrentUser(token);
        } catch (err) {
          const status = (err as { status?: number } | null)?.status;
          if (status === 401 || isTokenExpired(token)) {
            clearExpiredSession();
          }
        }
      }
    };

    const token = getToken();
    const expMs = token ? getTokenExpirationMs(token) : null;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (expMs !== null) {
      const delayMs = expMs - Date.now();
      if (delayMs > 0) {
        timeoutId = setTimeout(() => {
          void verifyActiveSession();
        }, delayMs);
      } else {
        void verifyActiveSession();
      }
    }

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        void verifyActiveSession();
      }
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [isAuthenticated, user, clearExpiredSession]);
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
