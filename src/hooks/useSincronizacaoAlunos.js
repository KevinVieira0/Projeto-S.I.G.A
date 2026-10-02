"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { sincronizarAlunosDaPlanilha } from "@/lib/api/alunosService";

export const INTERVALO_SINCRONIZACAO_MS =
  5 * 60 * 1000;

export function useSincronizacaoAlunos({
  automatico = false,
  intervaloMs = INTERVALO_SINCRONIZACAO_MS,
} = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [resposta, setResposta] = useState(null);
  const [erro, setErro] = useState(null);
  const [ultimaSincronizacao, setUltimaSincronizacao] =
    useState(null);

  const sincronizandoRef = useRef(false);
  const ultimaExecucaoRef = useRef(0);

  const sincronizar = useCallback(async () => {
    if (sincronizandoRef.current) {
      return;
    }

    sincronizandoRef.current = true;
    ultimaExecucaoRef.current = Date.now();

    setIsLoading(true);
    setErro(null);

    try {
      const dados = await sincronizarAlunosDaPlanilha();

      setResposta(dados);
      setUltimaSincronizacao(new Date());

      window.dispatchEvent(
        new Event("alunos:sincronizados")
      );
    } catch (error) {
      const mensagem =
        error.response?.data?.erro ||
        error.response?.data?.mensagem ||
        error.message ||
        "Não foi possível atualizar os alunos.";

      setErro(mensagem);
    } finally {
      setIsLoading(false);
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

      const tempoDesdeUltimaExecucao =
        Date.now() - ultimaExecucaoRef.current;

      if (
        ultimaExecucaoRef.current !== 0 &&
        tempoDesdeUltimaExecucao < intervaloMs
      ) {
        return;
      }

      void sincronizar();
    }

    // Sincroniza assim que o dashboard é aberto.
    executarAutomaticamente();

    // Repete a sincronização no intervalo configurado.
    const identificadorIntervalo = window.setInterval(
      executarAutomaticamente,
      intervaloMs
    );

    // Sincroniza quando o usuário volta para a aba.
    document.addEventListener(
      "visibilitychange",
      executarAutomaticamente
    );

    return () => {
      window.clearInterval(identificadorIntervalo);

      document.removeEventListener(
        "visibilitychange",
        executarAutomaticamente
      );
    };
  }, [automatico, intervaloMs, sincronizar]);

  return {
    sincronizar,
    isLoading,
    resposta,
    erro,
    ultimaSincronizacao,
  };
}