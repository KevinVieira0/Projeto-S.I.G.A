"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api/axiosClient";

export const estilosEmpresa = {
  superficie:
    "min-w-0 rounded-2xl border border-slate-300 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)] transition-[border-color,box-shadow,transform] duration-200 hover:border-orange-400 hover:shadow-[0_0_0_1px_rgba(249,115,22,0.12),0_8px_24px_-8px_rgba(249,115,22,0.24)] motion-reduce:transition-none",
  primario:
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  secundario:
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-orange-300 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50",
  campo:
    "min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100",
};
export const rotulosParticipacao = {
  INDICADO: "Indicado",
  EM_PROCESSO: "Em processo",
  APROVADO: "Aprovado · aguardando formalização",
  CONTRATADO: "Contratado",
  NAO_CONTRATADO: "Não contratado",
  DESISTIU: "Desistiu",
  CANCELADO: "Encerrado pela coordenação",
};
const cores = {
  INDICADO: "bg-sky-50 text-sky-800 ring-sky-600/15",
  EM_PROCESSO: "bg-amber-50 text-amber-800 ring-amber-600/15",
  APROVADO: "bg-violet-50 text-violet-800 ring-violet-600/15",
  CONTRATADO: "bg-emerald-50 text-emerald-800 ring-emerald-600/15",
};
export function SeloParticipacao({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${cores[status] || "bg-slate-100 text-slate-600 ring-slate-500/15"}`}
    >
      {rotulosParticipacao[status] || status}
    </span>
  );
}
export function dataEmpresa(valor, hora = false) {
  return valor
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        ...(hora ? { timeStyle: "short" } : {}),
        timeZone: hora ? "America/Sao_Paulo" : "UTC",
      }).format(new Date(valor))
    : "Não informado";
}
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
export function FalhaEmpresa({ mensagem, tentar }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800"
    >
      <p>{mensagem}</p>
      <button
        type="button"
        className="mt-2 font-semibold underline underline-offset-4"
        onClick={tentar}
      >
        Tentar novamente
      </button>
    </div>
  );
}
export function PaginacaoEmpresa({ pagina, total, tamanho = 25, alterar }) {
  const paginas = Math.max(1, Math.ceil(total / tamanho));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 text-xs text-slate-500">
      <span>
        {total} {total === 1 ? "registro" : "registros"} · Página {pagina} de{" "}
        {paginas}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          aria-label="Página anterior"
          disabled={pagina <= 1}
          onClick={() => alterar(pagina - 1)}
          className={estilosEmpresa.secundario}
        >
          Anterior
        </button>
        <button
          type="button"
          aria-label="Próxima página"
          disabled={pagina >= paginas}
          onClick={() => alterar(pagina + 1)}
          className={estilosEmpresa.secundario}
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
