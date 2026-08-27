"use client";

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "siga:session";

export function AuthProvider({ children }) {
  // { token, tipo: "admin" | "empresa", dados: {...} } | null
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaura a sessão salva ao carregar a aplicação (sobrevive a F5).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSession(JSON.parse(raw));
    } catch {
      // localStorage corrompido/indisponível — segue sem sessão.
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (token, tipo, dados) => {
    const novaSessao = { token, tipo, dados };
    setSession(novaSessao);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novaSessao));
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ session, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
