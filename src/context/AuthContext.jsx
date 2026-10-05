"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { obterSessao, encerrarSessao } from "@/lib/api/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const geracao = useRef(0);
  useEffect(() => {
    let ativo = true;
    const versao = geracao.current;
    // Sessões legadas nunca são usadas como prova de identidade.
    try {
      localStorage.removeItem("siga:session");
    } catch {}
    obterSessao()
      .then((dados) => {
        if (ativo && geracao.current === versao) setSessao(dados.session);
      })
      .catch(() => {
        if (ativo && geracao.current === versao) setSessao(null);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);
  const login = (tipo, dados) => {
    geracao.current += 1;
    setSessao({ tipo, dados });
    setCarregando(false);
  };
  const logout = async () => {
    await encerrarSessao();
    geracao.current += 1;
    setSessao(null);
  };
  return (
    <AuthContext.Provider
      value={{ session: sessao, login, logout, isLoading: carregando }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return contexto;
}
