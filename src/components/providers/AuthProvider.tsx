import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loginBackend, AUTH_TOKEN_KEY, LAST_ACTIVITY_KEY } from "@/lib/api";

export type AuthUser = {
  id: string;
  phone: string;
  role: "admin" | "teacher" | "student";
  name?: string;
};

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  initializing: boolean;
  login: (phone: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Simple local user store key names (USERS_KEY only for local fallback seed)
const USERS_KEY = "users";
const CURRENT_USER_KEY = "currentUser";

function seedDefaultAdmin() {
  try {
    const existing = localStorage.getItem(USERS_KEY);
    if (!existing) {
      const defaultUsers = [
        {
          id: "u-admin",
          phone: "admin",
          password: "Admin@123",
          role: "admin" as const,
          name: "Administrator"
        }
      ];
      localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    }
  } catch {}
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Seed a default admin account for first-time use
    seedDefaultAdmin();
    // Restore session
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const userRaw = localStorage.getItem(CURRENT_USER_KEY);
      const now = Date.now();
      const last = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || '0');
      const INACTIVITY_LIMIT_MS = 5 * 60 * 1000; // 5 minutes
      if (token) {
        if (!last || now - last > INACTIVITY_LIMIT_MS) {
          // Session expired
          try {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(CURRENT_USER_KEY);
            localStorage.removeItem(LAST_ACTIVITY_KEY);
          } catch {}
          setUser(null);
        } else {
          // Restore user (or fallback minimal) and refresh activity timestamp
          let parsed: AuthUser | null = null;
          try { parsed = userRaw ? JSON.parse(userRaw) as AuthUser : null; } catch { parsed = null; }
          setUser(parsed || { id: "admin", phone: "admin", role: "admin", name: "Administrator" });
          try { localStorage.setItem(LAST_ACTIVITY_KEY, String(now)); } catch {}
        }
      } else {
        setUser(null);
      }
    } catch {}
    setInitializing(false);
  }, []);

  const login = async (phone: string, password: string) => {
    // Treat the existing "phone" field as the username for backend login
    try {
      const resp = await loginBackend(phone.trim(), password);
      const authUser: AuthUser = { id: resp.username || "admin", phone: phone.trim(), role: "admin", name: resp.username || "Administrator" };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(authUser));
      localStorage.setItem(AUTH_TOKEN_KEY, resp.access_token);
      try { localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now())); } catch {}
      setUser(authUser);
      return true;
    } catch (e) {
      // No local fallback — require real backend auth to avoid UI showing empty data
      return false;
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(LAST_ACTIVITY_KEY);
    } catch {}
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: !!user,
    initializing,
    login,
    logout,
  }), [user, initializing]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
