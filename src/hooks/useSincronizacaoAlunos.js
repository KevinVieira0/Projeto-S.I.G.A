"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sincronizarAlunosDaPlanilha } from "@/lib/api/alunosService";

export const INTERVALO_SINCRONIZACAO_MS = 5 * 60 * 1000;

export function useSincronizacaoAlunos({
  automatico = false,
  intervaloMs = INTERVALO_SINCRONIZACAO_MS,
} = {}) {
  const [carregando, setCarregando] = useState(false);
  const [resposta, setResposta] = useState(null);
  const [erro, setErro] = useState(null);
  const [ultimaSincronizacao, setUltimaSincronizacao] = useState(null);
  const sincronizandoRef = useRef(false);
  const ultimaExecucaoRef = useRef(0);
  const sincronizar = useCallback(async () => {
    if (sincronizandoRef.current) {
      return;
    }
    sincronizandoRef.current = true;
    ultimaExecucaoRef.current = Date.now();
    setCarregando(true);
    setErro(null);
    try {
      const dados = await sincronizarAlunosDaPlanilha();
      setResposta(dados);
      setUltimaSincronizacao(new Date());
      window.dispatchEvent(new Event("alunos:sincronizados"));
    } catch (erroCapturado) {
      const mensagem =
        erroCapturado.response?.data?.erro ||
        erroCapturado.response?.data?.mensagem ||
        erroCapturado.message ||
        "Não foi possível atualizar os alunos.";
      setErro(mensagem);
    } finally {
      setCarregando(false);
      sincronizandoRef.current = false;
    }
  }, []);
  useEffect(() => {
    if (!automatico) {
      return;
    }
    function executarAutomaticamente() {
      if (document.visibilityState !== "visible") {
        return;
      }
      const tempoDesdeUltimaExecucao = Date.now() - ultimaExecucaoRef.current;
      if (ultimaExecucaoRef.current !== 0 && tempoDesdeUltimaExecucao < intervaloMs) {
        return;
      }
      void sincronizar();
    }
    executarAutomaticamente();
    const identificadorIntervalo = window.setInterval(
      executarAutomaticamente,
      intervaloMs,
    );
    document.addEventListener("visibilitychange", executarAutomaticamente);
    return () => {
      window.clearInterval(identificadorIntervalo);
      document.removeEventListener("visibilitychange", executarAutomaticamente);
    };
  }, [automatico, intervaloMs, sincronizar]);
  return { sincronizar, isLoading: carregando, resposta, erro, ultimaSincronizacao };
}
