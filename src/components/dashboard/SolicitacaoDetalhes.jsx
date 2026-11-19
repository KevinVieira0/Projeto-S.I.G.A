"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { apiClient } from "@/lib/api/axiosClient";
import { SolicitacaoIndicacoes } from "./SolicitacaoIndicacoes";
import { dashboardStyles } from "./DashboardCard";
import {
  formatarCnpj,
  formatarDataCivil,
  formatarDataCriacao,
  formatarFaixaEtaria,
  obterSituacao,
  rotuloPratica,
  rotuloSexo,
  situacaoSolicitacao,
} from "@/lib/dashboard/solicitacoesResumo";

export function SolicitacaoDetalhes({ solicitacao, onClose, onUpdated }) {
  const dialogoRef = useRef(null);
  const tituloId = useId();
  const [salvando, setSalvando] = useState(false);
  const [indicando, setIndicando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const ocupado = salvando || indicando;
  const situacao = obterSituacao(situacaoSolicitacao(solicitacao));
  useEffect(() => {
    const dialogo = dialogoRef.current;
    dialogo.showModal();
    return () => dialogo.close();
  }, []);

  async function alterarEstado() {
    if (ocupado || !solicitacao.ativa) return;
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      const { data } = await apiClient.patch(
        `/admin/solicitacoes/${solicitacao.id}`,
        {
          ativa: false,
          ativaAnterior: solicitacao.ativa,
        },
      );
      onUpdated(data.solicitacao);
      setMensagem(
        "Solicitação finalizada. O histórico de indicações foi preservado.",
      );
    } catch (e) {
      setErro(
        e.response?.data?.mensagem ||
          e.response?.data?.message ||
          "Não foi possível alterar a solicitação.",
      );
      if (e.response?.status === 409) onUpdated();
    } finally {
      setSalvando(false);
    }
  }

  const campos = [
    ["Empresa", solicitacao.empresa?.razaoSocial],
    ["Nome fantasia", solicitacao.empresa?.nomeFantasia],
    ["CNPJ", formatarCnpj(solicitacao.empresa?.cnpj)],
    ["E-mail", solicitacao.empresa?.email],
    ["Telefone", solicitacao.empresa?.telefone],
    ["Curso", solicitacao.cursos],
    ["Vagas solicitadas", solicitacao.quantidadeVagas],
    [
      "Faixa etária",
      formatarFaixaEtaria(solicitacao.idadeMinima, solicitacao.idadeMaxima),
    ],
    ["Sexo", rotuloSexo(solicitacao.sexo)],
    ["Oferta da empresa", rotuloPratica(solicitacao.pratica)],
    ["Início", formatarDataCivil(solicitacao.inicio)],
    ["Fim", formatarDataCivil(solicitacao.fim)],
    ["Recebida em", formatarDataCriacao(solicitacao.criadoEm)],
  ];

  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby={tituloId}
      onCancel={(evento) => {
        evento.preventDefault();
        if (!ocupado) onClose();
      }}
      className="fixed inset-0 m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-2xl border-0 border-t-[3px] border-t-[#0a3d7c] bg-white p-0 shadow-2xl backdrop:bg-slate-950/40"
    >
      <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
        <div>
          <p className={dashboardStyles.eyebrow}>Empresas parceiras</p>
          <h2 id={tituloId} className={dashboardStyles.title}>
            Detalhes da solicitação
          </h2>
          <p className="mt-1 break-all font-mono text-xs text-gray-500">
            {solicitacao.id}
          </p>
          <span
            className={`mt-3 inline-block rounded-full border px-2 py-1 text-xs font-medium ${situacao.seloClasse}`}
          >
            {situacao.label}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={ocupado}
          aria-label="Fechar detalhes"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>
      <dl className="grid gap-5 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
        {campos.map(([rotulo, valor]) => (
          <div key={rotulo} className="min-w-0">
            <dt className="text-xs text-gray-500">{rotulo}</dt>
            <dd className="mt-1 break-words text-sm font-medium text-gray-900">
              {valor === "" || valor == null ? "—" : valor}
            </dd>
          </div>
        ))}
        <div className="sm:col-span-2 lg:col-span-3">
          <dt className="text-xs text-gray-500">Observações</dt>
          <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-900">
            {solicitacao.observacoes || "Nenhuma observação informada."}
          </dd>
        </div>
      </dl>
      <SolicitacaoIndicacoes
        solicitacao={solicitacao}
        disabled={salvando}
        onBusyChange={setIndicando}
        onUpdated={onUpdated}
      />
      <footer className="space-y-3 border-t border-gray-100 bg-gray-50/80 px-6 py-4">
        {erro && (
          <p role="alert" className={dashboardStyles.error}>
            {erro}
          </p>
        )}
        {mensagem && (
          <p role="status" className="text-sm text-emerald-700">
            {mensagem}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-sm text-xs leading-5 text-gray-500">
            {solicitacao.ativa
              ? "A finalização é definitiva e encerra novas indicações. O histórico será mantido."
              : "Solicitação finalizada. O histórico de indicações permanece disponível para consulta."}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={ocupado}
              className={dashboardStyles.secondaryAction}
            >
              Fechar
            </button>
            {solicitacao.ativa && (
              <button
                type="button"
                disabled={ocupado}
                onClick={alterarEstado}
                className={dashboardStyles.primaryAction}
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                {salvando ? "Finalizando…" : "Finalizar solicitação"}
              </button>
            )}
          </div>
        </div>
      </footer>
    </dialog>
  );
}
