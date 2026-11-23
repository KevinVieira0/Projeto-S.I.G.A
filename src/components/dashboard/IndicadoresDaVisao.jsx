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
import estilos from "./IndicadoresDaVisao.module.css";

const numero = (valor) => valor.toLocaleString("pt-BR");
const horario = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
});

export default function IndicadoresDaVisao({ visao, ativo, children }) {
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

  const movimentacao = (
    <GraficoDeMovimentacao
      visao={visao}
      dados={alunos ? dados?.semanas : dados?.meses}
      erro={erro}
    />
  );

  return (
    <div className="min-w-0 space-y-6">
      {alunos && children}
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
      <section
        aria-label={alunos ? "Resumo de alunos" : "Resumo de solicitações"}
        className={estilos.resumo}
      >
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 className="text-sm font-semibold text-slate-800">
            {alunos
              ? "Indicadores de alunos"
              : "Acompanhamento de solicitações"}
          </h2>
          {dados && (
            <p className="text-xs text-slate-600">
              Atualizado às{" "}
              <time dateTime={dados.atualizadoEm}>
                {horario.format(new Date(dados.atualizadoEm))}
              </time>
            </p>
          )}
        </div>
        <ResumoIndicadores visao={visao} dados={dados} />
      </section>
      {!alunos && children}
      {alunos && movimentacao}
      <div className={estilos.graficos}>
        <div className={estilos.linhaComPanorama}>
          {alunos ? <StudentsByCourseCard ativo={ativo} /> : movimentacao}
          <OverviewStatusCard
            showViewToggle={false}
            initialView={visao}
            ativo={ativo}
          />
        </div>
      </div>
      {!alunos && dados && <CursosMaisSolicitados cursos={dados.cursos} />}
    </div>
  );
}

const aparenciaDosIndicadores = {
  comprovante: { Icone: FileClock, tom: "ambar" },
  disponiveis: { Icone: UsersRound, tom: "azul" },
  contratacoes: { Icone: ClipboardCheck, tom: "verde" },
  prazo: { Icone: Timer, tom: "ambar" },
  indicacao: { Icone: Inbox, tom: "azul" },
  encerradas: { Icone: Archive, tom: "violeta" },
};

function ResumoIndicadores({ visao, dados }) {
  if (!dados) return null;

  return (
    <div className={estilos.grade}>
      {resumirIndicadores(visao, dados).map(
        ({ id, titulo, valor, detalhe, descricao }) => {
          const { Icone, tom } = aparenciaDosIndicadores[id];
          return (
            <DashboardCard
              key={id}
              lift
              className={`${estilos.cartao} gap-3 p-4 sm:p-5`}
              data-tom={tom === "ambar" && valor === 0 ? "neutro" : tom}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 break-words text-sm font-semibold leading-5 text-slate-700">
                  {titulo}
                </h3>
                <span
                  className={`${estilos.icone} grid h-9 w-9 shrink-0 place-items-center rounded-lg border`}
                >
                  <Icone className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-auto">
                <p className="break-words text-3xl font-semibold leading-none tracking-tight tabular-nums text-slate-950">
                  {numero(valor)}
                </p>
                <p className="mt-2 text-xs leading-4 text-slate-600">
                  {detalhe || descricao}
                </p>
              </div>
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
        <ol
          className={`${dashboardStyles.body} siga-grade-compacta [--siga-coluna-card:13rem]`}
        >
          {cursos.map(({ curso, solicitacoes, vagas }) => (
            <li
              key={curso}
              className="min-w-0 space-y-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3"
            >
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
