"use client";

import { useEffect, useRef } from "react";

// Releitura do banco oficial. Não importa nem aprova respostas dos formulários.

export function useAtualizacaoDashboard(atualizar) {
  const aoAtualizar = useRef(atualizar);
  useEffect(() => {
    aoAtualizar.current = atualizar;
  }, [atualizar]);
  useEffect(() => {
    const executar = () => {
      if (document.visibilityState === "visible") aoAtualizar.current();
    };
    window.addEventListener("alunos:sincronizados", executar);
    window.addEventListener("focus", executar);
    document.addEventListener("visibilitychange", executar);
    // Inclui aprovações feitas por outro administrador ou em outra aba.
    const intervalo = window.setInterval(executar, 60_000);
    return () => {
      window.removeEventListener("alunos:sincronizados", executar);
      window.removeEventListener("focus", executar);
      document.removeEventListener("visibilitychange", executar);
      window.clearInterval(intervalo);
    };
  }, []);
}
