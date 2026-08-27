"use client";

import { useState } from "react";
import { sincronizarAlunosDaPlanilha } from "@/lib/api/alunosService";

export function useSincronizacaoAlunos() {
  const [isLoading, setIsLoading] = useState(false);
  const [resposta, setResposta] = useState(null);
  const [erro, setErro] = useState(null);

  async function sincronizar() {
    setIsLoading(true);
    setResposta(null);
    setErro(null);

    try {
      const dados = await sincronizarAlunosDaPlanilha();
      setResposta(dados);
    } catch (error) {
      const mensagem =
        error.response?.data?.erro ||
        error.response?.data?.mensagem ||
        "Não foi possível atualizar os alunos.";

      setErro(mensagem);
    } finally {
      setIsLoading(false);
    }
  }

  return {
    sincronizar,
    isLoading,
    resposta,
    erro,
  };
}