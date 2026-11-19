"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { obterSessao, encerrarSessao } from "@/lib/api/authService";

const AuthContext = createContext(null);
const CHAVE_EVENTO = "siga:auth:atualizada";

function avisarAlteracao(perfil) {
  try {
    localStorage.setItem(
      CHAVE_EVENTO,
      JSON.stringify({ perfil, evento: crypto.randomUUID() }),
    );
  } catch {}
}

export function AuthProvider({ children }) {
  const caminho = usePathname();
  const perfil = /^\/admin(?:\/|$)/.test(caminho || "")
    ? "admin"
    : /^\/empresa(?:\/|$)/.test(caminho || "")
      ? "empresa"
      : null;
  const [estado, setEstado] = useState({
    perfil: null,
    sessao: null,
    carregando: true,
  });
  const geracao = useRef(0);
  useEffect(() => {
    let ativo = true;
    let controlador;
    // Sessões legadas nunca são usadas como prova de identidade.
    try {
      localStorage.removeItem("siga:session");
    } catch {}
    if (!perfil) {
      geracao.current += 1;
      setEstado({ perfil: null, sessao: null, carregando: false });
      return;
    }
    async function verificar(inicial = false) {
      if (!inicial && document.hidden) return;
      controlador?.abort();
      controlador = new AbortController();
      const consulta = controlador;
      const versao = ++geracao.current;
      if (inicial)
        setEstado((anterior) => ({
          perfil,
          sessao: anterior.perfil === perfil ? anterior.sessao : null,
          carregando: true,
        }));
      try {
        const dados = await obterSessao(perfil, { signal: consulta.signal });
        if (ativo && geracao.current === versao)
          setEstado({ perfil, sessao: dados.session, carregando: false });
      } catch (erro) {
        if (ativo && geracao.current === versao && !consulta.signal.aborted) {
          if (inicial || [401, 403].includes(erro.response?.status))
            setEstado({ perfil, sessao: null, carregando: false });
        }
      }
    }
    const aoFocar = () => verificar();
    const aoAlterar = (evento) => {
      if (evento.key !== CHAVE_EVENTO || !evento.newValue) return;
      try {
        if (JSON.parse(evento.newValue).perfil === perfil) void verificar();
      } catch {}
    };
    void verificar(true);
    window.addEventListener("focus", aoFocar);
    window.addEventListener("storage", aoAlterar);
    document.addEventListener("visibilitychange", aoFocar);
    return () => {
      ativo = false;
      controlador?.abort();
      window.removeEventListener("focus", aoFocar);
      window.removeEventListener("storage", aoAlterar);
      document.removeEventListener("visibilitychange", aoFocar);
    };
  }, [perfil]);
  const login = (tipo, dados) => {
    geracao.current += 1;
    setEstado({ perfil: tipo, sessao: { tipo, dados }, carregando: false });
    avisarAlteracao(tipo);
  };
  const logout = async () => {
    if (!perfil) throw new Error("Perfil de sessão não identificado.");
    await encerrarSessao(perfil);
    geracao.current += 1;
    setEstado({ perfil, sessao: null, carregando: false });
    avisarAlteracao(perfil);
  };
  return (
    <AuthContext.Provider
      value={{
        session: estado.perfil === perfil ? estado.sessao : null,
        login,
        logout,
        isLoading: Boolean(
          perfil && (estado.perfil !== perfil || estado.carregando),
        ),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto)
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return contexto;
}
