import React from "react";
import { Building2, Calendar, ChevronRight, Users } from "lucide-react";
import { dashboardStyles } from "./DashboardCard";
import {
  formatarDataCivil,
  formatarDataCriacao,
  obterSituacao,
  situacaoSolicitacao,
} from "@/lib/dashboard/solicitacoesResumo";

export function SolicitacaoCard({ solicitacao, onSelect }) {
  const situacao = obterSituacao(situacaoSolicitacao(solicitacao));
  const empresa = solicitacao.empresa?.razaoSocial || "Empresa não informada";

  return (
    <article className="flex min-w-0 flex-col rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-blue-200 motion-reduce:transition-none">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          #{String(solicitacao.id).slice(0, 8)}
        </span>
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${situacao.seloClasse}`}
        >
          {situacao.label}
        </span>
      </div>
      <h3 className="break-words text-sm font-semibold text-gray-900">
        {solicitacao.cursos || "Curso não informado"}
      </h3>
      <p className="mt-2 flex items-start gap-1.5 text-xs text-gray-600">
        <Building2
          className="h-4 w-4 shrink-0 text-gray-400"
          aria-hidden="true"
        />
        <span className="break-words">{empresa}</span>
      </p>
      <p className="mt-2 text-xs font-medium text-blue-700">
        {solicitacao.totalIndicados || 0}{" "}
        {solicitacao.totalIndicados === 1
          ? "aluno indicado"
          : "alunos indicados"}
      </p>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-600">
        <Users className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
        {solicitacao.quantidadeAlunos}{" "}
        {solicitacao.quantidadeAlunos === 1
          ? "vaga solicitada"
          : "vagas solicitadas"}
      </p>
      <p className="mt-2 flex items-start gap-1.5 text-xs text-gray-600">
        <Calendar
          className="h-4 w-4 shrink-0 text-gray-400"
          aria-hidden="true"
        />
        <span>
          {formatarDataCivil(solicitacao.inicio)} a{" "}
          {formatarDataCivil(solicitacao.fim)}
        </span>
      </p>
      <div className="mt-auto pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
          <span className="text-xs text-gray-500">
            Recebida em {formatarDataCriacao(solicitacao.criadoEm)}
          </span>
          {onSelect && (
            <button
              type="button"
              onClick={() => onSelect(solicitacao.id)}
              aria-label={`Ver detalhes da solicitação de ${empresa}, ${solicitacao.cursos || "curso não informado"}, ${String(solicitacao.id).slice(0, 8)}`}
              className={dashboardStyles.secondaryAction}
            >
              Ver detalhes{" "}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
