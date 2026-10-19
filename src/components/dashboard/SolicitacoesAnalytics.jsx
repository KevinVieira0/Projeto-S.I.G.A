import React from "react";
import { BarChart3, PieChart } from "lucide-react";
import { obterSituacao } from "@/lib/dashboard/solicitacoesResumo";
import DashboardCard, {
  DashboardCardHeader,
  DashboardCardFooter,
  dashboardStyles,
} from "./DashboardCard";

export function SolicitacoesAnalytics({ dadosStatus = [], dadosMensais = [] }) {
  const maxSolicitacoes = Math.max(
    ...dadosMensais.map((item) => item.solicitacoes),
    1,
  );
  const total = dadosStatus.reduce((soma, item) => soma + item.valor, 0);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <DashboardCard
        aria-label="Volume mensal de solicitações"
        className="xl:col-span-2"
      >
        <DashboardCardHeader
          eyebrow="Evolução mensal"
          title="Volume de solicitações"
          description="Recebidas nos últimos seis meses."
          icon={BarChart3}
        />
        <div className={dashboardStyles.body}>
          {dadosMensais.some((item) => item.solicitacoes > 0) ? (
            <ul className="mt-4 flex h-44 items-end gap-2 border-b border-gray-100 pb-2">
              {dadosMensais.map((item) => (
                <li
                  key={item.chave}
                  aria-label={`${item.rotuloCompleto}: ${item.solicitacoes} solicitações`}
                  className="flex h-full min-w-0 flex-1 flex-col items-center gap-1.5"
                >
                  <span
                    className="text-[11px] font-semibold text-gray-600"
                    aria-hidden="true"
                  >
                    {item.solicitacoes}
                  </span>
                  <div
                    className="flex w-full max-w-10 min-h-0 flex-1 items-end rounded-t-md bg-gray-100"
                    aria-hidden="true"
                  >
                    <div
                      className="w-full rounded-t-md bg-[#0a3d7c]"
                      style={{
                        height: `${(item.solicitacoes / maxSolicitacoes) * 100}%`,
                      }}
                    />
                  </div>
                  <span
                    className="whitespace-nowrap text-[10px] font-medium text-gray-500 sm:text-xs"
                    aria-hidden="true"
                  >
                    {item.rotulo}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex min-h-44 items-center justify-center text-center text-sm text-gray-500">
              Nenhuma solicitação recebida neste período.
            </p>
          )}
        </div>
        <DashboardCardFooter>Volume por mês de recebimento</DashboardCardFooter>
      </DashboardCard>
      <DashboardCard aria-label="Distribuição por situação">
        <DashboardCardHeader
          eyebrow="Acompanhamento"
          title="Situação das solicitações"
          description="Ativas e finalizadas pela coordenação."
          icon={PieChart}
        />
        <div className={`${dashboardStyles.body} flex-1`}>
          {total > 0 ? (
            <ul className="mt-4 space-y-3">
              {dadosStatus.map((item) => {
                const situacao = obterSituacao(item.id);
                const percentual = Math.round((item.valor / total) * 100);
                return (
                  <li key={item.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-gray-700">
                        {situacao.label}
                      </span>
                      <span className="whitespace-nowrap tabular-nums text-gray-500">
                        {item.valor} ({percentual}%)
                      </span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-gray-100"
                      aria-hidden="true"
                    >
                      <div
                        className={`h-full rounded-full ${situacao.pontoClasse}`}
                        style={{ width: `${percentual}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-10 text-center text-sm text-gray-500">
              Nenhuma solicitação cadastrada.
            </p>
          )}
        </div>
        <DashboardCardFooter>
          {total} solicitações · todos os pedidos
        </DashboardCardFooter>
      </DashboardCard>
    </div>
  );
}
