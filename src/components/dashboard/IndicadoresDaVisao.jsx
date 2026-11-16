"use client";

import {
  Archive,
  ClipboardCheck,
  FileClock,
  Inbox,
  ListOrdered,
  RefreshCw,
  Timer,
  UsersRound,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import StudentsByCourseCard from "@/components/alunos/StudentsByCourseCard";
import { useAtualizacaoDashboard } from "@/hooks/useAtualizacaoDashboard";
import { buscarIndicadoresDashboard } from "@/lib/api/dashboardService";
import { resumirIndicadores } from "@/lib/dashboard/resumoIndicadores";
import DashboardCard, {
  DashboardCardHeader,
  dashboardStyles,
} from "./DashboardCard";
import GraficoDeMovimentacao from "./GraficoDeMovimentacao";
import OverviewStatusCard from "./OverviewStatusCard";

const numero = (valor) => valor.toLocaleString("pt-BR");
const horario = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
});

export default function IndicadoresDaVisao({ visao, ativo }) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const [versao, setVersao] = useState(0);
  const alunos = visao === "alunos";

  useEffect(() => {
    if (!ativo) return;
    const controlador = new AbortController();
    buscarIndicadoresDashboard(visao, { signal: controlador.signal })
      .then((resposta) => {
        if (controlador.signal.aborted) return;
        setDados(resposta);
        setErro("");
      })
      .catch(() => {
        if (!controlador.signal.aborted)
          setErro("Não foi possível atualizar os indicadores.");
      });
    return () => controlador.abort();
  }, [ativo, visao, versao]);
  useAtualizacaoDashboard(() => setVersao((valor) => valor + 1), ativo);

  return (
    <section
      aria-label={alunos ? "Indicadores de alunos" : "Indicadores de empresas"}
      className="mt-6 space-y-5"
    >
      {erro && (
        <div
          role="alert"
          className={`flex flex-wrap items-center justify-between gap-2 ${dashboardStyles.error}`}
        >
          {erro}
          {dados ? " Exibindo a última leitura." : ""}
          <button
            type="button"
            className={dashboardStyles.secondaryAction}
            onClick={() => setVersao((valor) => valor + 1)}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Tentar novamente
          </button>
        </div>
      )}
      {dados && (
        <div className="space-y-2">
          <ResumoIndicadores visao={visao} dados={dados} />
          <p className="max-w-[68rem] text-right text-xs text-gray-500">
            Indicadores atualizados às{" "}
            <time dateTime={dados.atualizadoEm}>
              {horario.format(new Date(dados.atualizadoEm))}
            </time>
          </p>
        </div>
      )}
      <div className="grid max-w-[86rem] items-start gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.45fr)]">
        <div className="min-w-0 max-w-xl xl:max-w-none">
          <OverviewStatusCard
            showViewToggle={false}
            initialView={visao}
            ativo={ativo}
          />
        </div>
        <GraficoDeMovimentacao
          visao={visao}
          dados={alunos ? dados?.semanas : dados?.meses}
          erro={erro}
        />
      </div>
      <div className="max-w-5xl">
        {alunos ? (
          <StudentsByCourseCard ativo={ativo} />
        ) : (
          dados && <CursosMaisSolicitados cursos={dados.cursos} />
        )}
      </div>
    </section>
  );
}

const iconesDosIndicadores = {
  comprovante: FileClock,
  disponiveis: UsersRound,
  contratacoes: ClipboardCheck,
  prazo: Timer,
  indicacao: Inbox,
  encerradas: Archive,
};

function ResumoIndicadores({ visao, dados }) {
  return (
    <div className="siga-grade-compacta">
      {resumirIndicadores(visao, dados).map(
        ({ id, titulo, valor, detalhe }) => {
          const Icone = iconesDosIndicadores[id];
          const atencao = valor > 0 && ["comprovante", "prazo"].includes(id);
          return (
            <DashboardCard
              key={id}
              className={`gap-1.5 px-3.5 py-3 ${atencao ? "!border-amber-200 !border-t-amber-500 !bg-amber-50/60" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="min-w-0 break-words text-sm font-semibold leading-5 text-gray-800">
                  {titulo}
                </h2>
                <span
                  className={`shrink-0 rounded-lg p-1.5 ${atencao ? "bg-amber-100 text-amber-800" : "bg-blue-50 text-[#0a3d7c]"}`}
                >
                  <Icone className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <p className="text-2xl font-bold leading-none tabular-nums text-gray-900">
                {numero(valor)}
              </p>
              {detalhe && <p className="text-xs text-gray-500">{detalhe}</p>}
            </DashboardCard>
          );
        },
      )}
    </div>
  );
}

function CursosMaisSolicitados({ cursos }) {
  const idTitulo = useId();
  const maximo = cursos[0]?.solicitacoes || 1;
  return (
    <DashboardCard aria-labelledby={idTitulo} lift>
      <DashboardCardHeader
        headingId={idTitulo}
        title="Cursos mais solicitados"
        description="Pedidos do mês atual e dos dois meses anteriores"
        icon={ListOrdered}
      />
      {cursos.length > 0 ? (
        <ol className={`${dashboardStyles.body} space-y-4`}>
          {cursos.map(({ curso, solicitacoes, vagas }) => (
            <li key={curso} className="space-y-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
                <span className="min-w-0 break-words font-medium text-gray-800">
                  {curso}
                </span>
                <span className="tabular-nums text-gray-600">
                  {numero(solicitacoes)}{" "}
                  {solicitacoes === 1 ? "pedido" : "pedidos"} · {numero(vagas)}{" "}
                  {vagas === 1 ? "vaga" : "vagas"}
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-[#0a3d7c]"
                  style={{ width: `${(solicitacoes / maximo) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="px-5 py-10 text-center text-sm text-gray-500">
          Nenhum curso solicitado neste período.
        </p>
      )}
    </DashboardCard>
  );
}
