"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { obterSessao, encerrarSessao } from "@/lib/api/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const generation = useRef(0);

  useEffect(() => {
    let active = true;
    const version = generation.current;
    // Sessões legadas nunca são usadas como prova de identidade.
    try { localStorage.removeItem("siga:session"); } catch {}
    obterSessao().then((data) => {
      if (active && generation.current === version) setSession(data.session);
    }).catch(() => {
      if (active && generation.current === version) setSession(null);
    }).finally(() => {
      if (active) setIsLoading(false);
    });
    return () => { active = false; };
  }, []);

  const login = (tipo, dados) => {
    generation.current += 1;
    setSession({ tipo, dados });
    setIsLoading(false);
  };

  const logout = async () => {
    await encerrarSessao();
    generation.current += 1;
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return context;
}
