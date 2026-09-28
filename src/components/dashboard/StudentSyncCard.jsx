"use client";

import {
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

import DashboardCard, { DashboardCardHeader, dashboardStyles } from "./DashboardCard";
import { useSincronizacaoAlunos } from "@/hooks/useSincronizacaoAlunos";

export default function StudentSyncCard() {
  const {
    sincronizar,
    isLoading,
    resposta,
    erro,
  } = useSincronizacaoAlunos();

  const resultado = resposta?.resultado;

  return (
    <DashboardCard className="mt-6 max-w-3xl" aria-labelledby="sincronizacao-titulo">
      <DashboardCardHeader headingId="sincronizacao-titulo" eyebrow="Integração" title="Atualização de alunos" description="Importe os dados atuais da planilha do Google Sheets para o sistema.">
          <button
            type="button"
            onClick={sincronizar}
            disabled={isLoading}
            aria-busy={isLoading}
            className={dashboardStyles.primaryAction}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true" />
            {isLoading ? "Atualizando…" : "Atualizar alunos"}
          </button>
      </DashboardCardHeader>

      <div className={erro || resposta ? dashboardStyles.body : ""} aria-live="polite">
        {erro && (
          <div role="alert" className={`flex gap-3 ${dashboardStyles.error}`}>
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{erro}</p>
          </div>
        )}

        {resposta && (
          <div
            className={`rounded-lg p-4 ${
              resultado?.erros?.length
                ? "bg-amber-50 text-amber-800"
                : "bg-green-50 text-green-800"
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              {resultado?.erros?.length ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}

              <p>{resposta.mensagem}</p>
            </div>

            {resultado && (
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <ResultItem
                  label="Recebidos"
                  value={resultado.linhasRecebidas}
                />

                <ResultItem
                  label="Criados"
                  value={resultado.criados}
                />

                <ResultItem
                  label="Atualizados"
                  value={resultado.atualizados}
                />

                <ResultItem
                  label="Ignorados"
                  value={resultado.ignorados}
                />
              </div>
            )}

            {resultado?.erros?.length > 0 && (
              <ul className="mt-4 space-y-1 text-sm">
                {resultado.erros.map((item) => (
                  <li key={`${item.linha}-${item.mensagem}`}>
                    Linha {item.linha}: {item.mensagem}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </DashboardCard>
  );
}

function ResultItem({ label, value }) {
  return (
    <div className="rounded-md bg-white/70 px-3 py-2">
      <p className="text-xs opacity-75">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
