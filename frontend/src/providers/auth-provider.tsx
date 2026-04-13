"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AUTH_EXPIRED_EVENT } from "../lib/api-client";
import type { User, LoginDto, RegisterDto } from "../types/api";
import { authService } from "../services/auth.service";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  loginWithGoogle: (data: {
    token: string;
    role?: "BUYER" | "SUPPLIER";
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize from LocalStorage
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to parse auth state from storage", e);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for generic 401 Unauthorized events from the API Client
  useEffect(() => {
    const handleAuthExpired = () => {
      logout();
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () =>
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, []);

  const login = async (data: LoginDto) => {
    const res = await authService.login(data);
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem("token", res.access_token);
    localStorage.setItem("user", JSON.stringify(res.user));

    // Auto-redirect based on role
    router.push(res.user.role === "BUYER" ? "/buyer" : "/supplier");
  };

  const register = async (data: RegisterDto) => {
    const res = await authService.register(data);
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem("token", res.access_token);
    localStorage.setItem("user", JSON.stringify(res.user));

    // Auto-redirect based on role
    router.push(res.user.role === "BUYER" ? "/buyer" : "/supplier");
  };

  const loginWithGoogle = async (data: {
    token: string;
    role?: "BUYER" | "SUPPLIER";
  }) => {
    const res = await authService.googleLogin(data);
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem("token", res.access_token);
    localStorage.setItem("user", JSON.stringify(res.user));

    // Auto-redirect based on role
    router.push(res.user.role === "BUYER" ? "/buyer" : "/supplier");
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
      }}
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
