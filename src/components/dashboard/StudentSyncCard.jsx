"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  RefreshCw,
} from "lucide-react";

import DashboardCard, {
  DashboardCardHeader,
  dashboardStyles,
} from "./DashboardCard";

import {
  INTERVALO_SINCRONIZACAO_MS,
  useSincronizacaoAlunos,
} from "@/hooks/useSincronizacaoAlunos";

export default function StudentSyncCard() {
  const {
    isLoading,
    resposta,
    erro,
    ultimaSincronizacao,
  } = useSincronizacaoAlunos({
    automatico: true,
    intervaloMs: INTERVALO_SINCRONIZACAO_MS,
  });

  const resultado = resposta?.resultado;

  return (
    <DashboardCard
      className="mt-6 max-w-3xl"
      aria-labelledby="sincronizacao-titulo"
    >
      <DashboardCardHeader
        headingId="sincronizacao-titulo"
        eyebrow="Integração"
        title="Atualização automática de alunos"
        description="Os dados da planilha do Google Sheets são sincronizados automaticamente."
      >
        <div className="inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
          {isLoading ? (
            <RefreshCw
              className="h-4 w-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          ) : (
            <Clock3
              className="h-4 w-4"
              aria-hidden="true"
            />
          )}

          <span>
            {isLoading
              ? "Sincronizando…"
              : "Atualização a cada 5 minutos"}
          </span>
        </div>
      </DashboardCardHeader>

      <div
        className={dashboardStyles.body}
        aria-live="polite"
      >
        {erro ? (
          <div
            role="alert"
            className={`flex gap-3 ${dashboardStyles.error}`}
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />

            <div>
              <p className="font-medium">
                A sincronização automática falhou.
              </p>

              <p className="mt-1">{erro}</p>
            </div>
          </div>
        ) : resposta ? (
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

            {ultimaSincronizacao && (
              <p className="mt-2 text-xs opacity-80">
                Última sincronização:{" "}
                {formatarDataHora(ultimaSincronizacao)}
              </p>
            )}

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
                  <li
                    key={`${item.linha}-${item.mensagem}`}
                  >
                    Linha {item.linha}: {item.mensagem}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
            {isLoading
              ? "Buscando os dados atuais da planilha…"
              : "Aguardando a primeira sincronização automática."}
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

      <p className="mt-1 text-lg font-semibold">
        {value}
      </p>
    </div>
  );
}

function formatarDataHora(data) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(data);
}