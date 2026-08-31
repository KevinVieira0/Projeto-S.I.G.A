"use client";

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "siga:session";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSession(JSON.parse(raw));
    } catch {
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (tipo, dados) => {
    const novaSessao = { tipo, dados };
    setSession(novaSessao);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novaSessao));
    } catch {
      // A sessão continua válida em memória quando o storage está indisponível.
    }
  };

  return (
    <AuthContext.Provider value={{ session, login, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  }

  return context;
}
