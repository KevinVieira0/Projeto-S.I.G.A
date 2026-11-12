"use client";
import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api/axiosClient";

export function useDadosEmpresa(caminho, monitorar = true) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [versao, setVersao] = useState(0);
  const recarregar = useCallback(() => setVersao((v) => v + 1), []);
  useEffect(() => {
    if (!caminho) return;
    const controlador = new AbortController();
    setCarregando(true);
    setErro("");
    apiClient
      .get(caminho, { signal: controlador.signal })
      .then(({ data }) => {
        if (!controlador.signal.aborted) setDados(data);
      })
      .catch((erro) => {
        if (!controlador.signal.aborted)
          setErro(
            erro.response?.data?.mensagem ||
              erro.response?.data?.message ||
              "Não foi possível carregar os dados. Tente novamente.",
          );
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCarregando(false);
      });
    return () => controlador.abort();
  }, [caminho, versao]);
  useEffect(() => {
    if (!monitorar) return;
    const atualizar = () => {
      if (!document.hidden) recarregar();
    };
    const temporizador = window.setInterval(atualizar, 300000);
    window.addEventListener("empresa:atualizada", atualizar);
    window.addEventListener("focus", atualizar);
    return () => {
      window.clearInterval(temporizador);
      window.removeEventListener("empresa:atualizada", atualizar);
      window.removeEventListener("focus", atualizar);
    };
  }, [monitorar, recarregar]);
  return { dados, carregando, erro, recarregar };
}
