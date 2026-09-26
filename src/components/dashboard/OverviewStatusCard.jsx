"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  ChevronDown,
  GraduationCap,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { buscarResumoDashboard } from "@/lib/api/dashboardService";

const PERIODOS = [7, 30, 90];
const RAIO = 58;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

const CONFIGURACAO = {
  alunos: {
    titulo: "Situação dos alunos",
    unidade: "alunos",
    link: "/admin/alunos",
    categorias: {
      indicados: {
        cor: "#16a36a",
        dotClass: "bg-emerald-600",
        barClass: "bg-emerald-600",
      },
      "em-analise": {
        cor: "#3678c7",
        dotClass: "bg-blue-500",
        barClass: "bg-blue-500",
      },
      "nao-indicados": {
        cor: "#db7b2b",
        dotClass: "bg-orange-500",
        barClass: "bg-orange-500",
      },
    },
  },
  empresas: {
    titulo: "Situação das empresas",
    unidade: "empresas",
    link: "/admin/empresas",
    categorias: {
      autorizadas: {
        cor: "#16a36a",
        dotClass: "bg-emerald-600",
        barClass: "bg-emerald-600",
      },
      aguardando: {
        cor: "#3678c7",
        dotClass: "bg-blue-500",
        barClass: "bg-blue-500",
      },
      inativas: {
        cor: "#db7b2b",
        dotClass: "bg-orange-500",
        barClass: "bg-orange-500",
      },
    },
  },
};

export default function OverviewStatusCard({ showViewToggle = true }) {
  const [visao, setVisao] = useState("alunos");
  const [periodo, setPeriodo] = useState(30);
  const [resumo, setResumo] = useState(null);
  const [erro, setErro] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [animar, setAnimar] = useState(false);
  const [categoriaDestacada, setCategoriaDestacada] = useState(null);
  const [versao, setVersao] = useState(0);

  const carregarResumo = useCallback((signal) => {
    setIsLoading(true);
    setErro("");
    setResumo(null);

    buscarResumoDashboard(periodo, { signal })
      .then((dados) => {
        setResumo(dados);
      })
      .catch((error) => {
        if (error.code === "ERR_CANCELED") return;

        setErro(
          error.response?.data?.mensagem ||
            error.message ||
            "Não foi possível carregar o panorama."
        );
      })
      .finally(() => {
        if (!signal.aborted) setIsLoading(false);
      });
  }, [periodo]);

  useEffect(() => {
    const controller = new AbortController();
    carregarResumo(controller.signal);

    return () => controller.abort();
  }, [carregarResumo, versao]);

  useEffect(() => {
    const atualizarAposSincronizacao = () => {
      setVersao((valorAtual) => valorAtual + 1);
    };

    window.addEventListener("alunos:sincronizados", atualizarAposSincronizacao);

    return () => {
      window.removeEventListener(
        "alunos:sincronizados",
        atualizarAposSincronizacao
      );
    };
  }, []);

  const dadosAtivos = resumo?.[visao];
  const configuracao = CONFIGURACAO[visao];
  const identidadeDosDados = useMemo(
    () =>
      dadosAtivos?.categorias
        ?.map((categoria) => `${categoria.id}:${categoria.valor}`)
        .join("|") || "",
    [dadosAtivos]
  );

  useEffect(() => {
    setCategoriaDestacada(null);
    setAnimar(false);

    const frame = requestAnimationFrame(() => {
      setAnimar(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [visao, periodo, identidadeDosDados]);

  const valorCentral = categoriaDestacada?.valor ?? dadosAtivos?.total ?? 0;
  const rotuloCentral = categoriaDestacada
    ? `${categoriaDestacada.label} · ${calcularPercentual(
        categoriaDestacada.valor,
        dadosAtivos?.total
      )}%`
    : configuracao.unidade;
  const valorAnimado = useAnimatedNumber(valorCentral);

  function selecionarVisao(novaVisao) {
    if (novaVisao === visao) return;

    setAnimar(false);
    setCategoriaDestacada(null);
    setVisao(novaVisao);
  }

  function selecionarPeriodo(event) {
    setAnimar(false);
    setPeriodo(Number(event.target.value));
  }

  return (
    <section className="group relative overflow-hidden rounded-2xl border border-gray-200 border-t-[3px] border-t-[#0a3d7c] bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-950/10">
      <header className="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0a3d7c]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0a3d7c] ring-4 ring-blue-50" />
            Visão geral
          </p>
          <h2 className="mt-1 text-lg font-semibold text-gray-900">
            Panorama do período
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {showViewToggle && <div
            className="flex rounded-lg bg-gray-100 p-1"
            role="tablist"
            aria-label="Tipo de informação"
          >
            <TabButton
              id="panorama-alunos-tab"
              active={visao === "alunos"}
              icon={GraduationCap}
              onClick={() => selecionarVisao("alunos")}
            >
              Alunos
            </TabButton>
            <TabButton
              id="panorama-empresas-tab"
              active={visao === "empresas"}
              icon={Building2}
              onClick={() => selecionarVisao("empresas")}
            >
              Empresas
            </TabButton>
          </div>}

          <label className="relative">
            <span className="sr-only">Selecionar período</span>
            <select
              value={periodo}
              onChange={selecionarPeriodo}
              className="h-9 appearance-none rounded-lg border border-gray-200 bg-white py-1.5 pl-3 pr-8 text-xs font-medium text-gray-700 outline-none transition hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {PERIODOS.map((quantidadeDeDias) => (
                <option key={quantidadeDeDias} value={quantidadeDeDias}>
                  {quantidadeDeDias} dias
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          </label>
        </div>
      </header>

      <div
        id="panorama-conteudo"
        role={showViewToggle ? "tabpanel" : "region"}
        aria-labelledby={showViewToggle ? `panorama-${visao}-tab` : undefined}
        aria-label={showViewToggle ? undefined : configuracao.titulo}
        className={`transition duration-200 ${
          isLoading && resumo ? "opacity-50" : "opacity-100"
        }`}
        aria-live="polite"
      >
        {isLoading && !resumo ? (
          <LoadingState />
        ) : erro ? (
          <ErrorState
            mensagem={erro}
            onRetry={() => setVersao((valorAtual) => valorAtual + 1)}
          />
        ) : (
          <div className="grid grid-cols-[132px_1fr] items-center gap-3 px-4 py-5 sm:grid-cols-[160px_1fr] sm:gap-5 sm:px-6">
            <div className="relative mx-auto h-32 w-32 sm:h-36 sm:w-36">
              <div className="absolute inset-[18px] rounded-full bg-gray-50 transition duration-300 group-hover:bg-blue-50/60" />
              <svg
                viewBox="0 0 160 160"
                className="relative h-full w-full -rotate-90 overflow-visible"
                role="img"
                aria-label={`${configuracao.titulo}. Total de ${
                  dadosAtivos?.total || 0
                } ${configuracao.unidade}.`}
              >
                <circle
                  cx="80"
                  cy="80"
                  r={RAIO}
                  fill="none"
                  stroke="#e8edf3"
                  strokeWidth="17"
                />
                <ChartSegments
                  categorias={dadosAtivos?.categorias || []}
                  total={dadosAtivos?.total || 0}
                  configuracao={configuracao}
                  animar={animar}
                  onHighlight={setCategoriaDestacada}
                />
              </svg>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <strong className="text-2xl font-semibold tabular-nums text-gray-900 sm:text-3xl">
                  {valorAnimado}
                </strong>
                <span className="mt-1 max-w-[88px] text-[11px] leading-tight text-gray-500">
                  {rotuloCentral}
                </span>
              </div>
            </div>

            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-1.5">
                <h3 className="text-sm font-semibold text-gray-900">
                  {configuracao.titulo}
                </h3>
                <span className="text-[11px] text-gray-500">
                  atualizados em {periodo} dias
                </span>
              </div>

              <div className="space-y-1">
                {(dadosAtivos?.categorias || []).map((categoria) => (
                  <LegendItem
                    key={categoria.id}
                    categoria={categoria}
                    total={dadosAtivos.total}
                    visual={configuracao.categorias[categoria.id]}
                    animar={animar}
                    onHighlight={setCategoriaDestacada}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="flex min-h-12 items-center gap-2.5 border-t border-gray-100 bg-gray-50/80 px-4 py-2.5 sm:px-5">
        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-blue-50 text-[#0a3d7c] transition duration-300 group-hover:-rotate-6 group-hover:scale-110">
          <Sparkles className="h-3.5 w-3.5" />
        </span>

        <ResumoRodape visao={visao} dados={dadosAtivos?.resumo} />

        <Link
          href={configuracao.link}
          className="ml-auto inline-flex flex-none items-center gap-1 text-xs font-semibold text-[#0a3d7c] transition hover:text-blue-700"
        >
          Ver detalhes
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </footer>
    </section>
  );
}

function TabButton({ id, active, children, icon: Icon, onClick }) {
  return (
    <button
      id={id}
      type="button"
      role="tab"
      aria-controls="panorama-conteudo"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
        active
          ? "bg-white text-[#0a3d7c] shadow-sm"
          : "text-gray-500 hover:-translate-y-px hover:text-gray-800"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

function ChartSegments({
  categorias,
  total,
  configuracao,
  animar,
  onHighlight,
}) {
  let deslocamento = 0;

  return categorias.map((categoria) => {
    const proporcao = total > 0 ? categoria.valor / total : 0;
    const comprimento = proporcao * CIRCUNFERENCIA;
    const espaco = Math.min(3, comprimento * 0.16);
    const comprimentoVisivel = Math.max(0, comprimento - espaco);
    const dasharray = animar
      ? `${comprimentoVisivel} ${CIRCUNFERENCIA - comprimentoVisivel}`
      : `0 ${CIRCUNFERENCIA}`;
    const dashoffset = -deslocamento;
    const visual = configuracao.categorias[categoria.id];

    deslocamento += comprimento;

    return (
      <circle
        key={categoria.id}
        cx="80"
        cy="80"
        r={RAIO}
        fill="none"
        stroke={visual.cor}
        strokeWidth="17"
        strokeLinecap="round"
        strokeDasharray={dasharray}
        strokeDashoffset={dashoffset}
        className="cursor-pointer drop-shadow-sm transition-all duration-500 ease-out hover:opacity-75"
        onMouseEnter={() => onHighlight(categoria)}
        onMouseLeave={() => onHighlight(null)}
      />
    );
  });
}

function LegendItem({ categoria, total, visual, animar, onHighlight }) {
  const percentual = calcularPercentual(categoria.valor, total);

  return (
    <button
      type="button"
      onMouseEnter={() => onHighlight(categoria)}
      onMouseLeave={() => onHighlight(null)}
      onFocus={() => onHighlight(categoria)}
      onBlur={() => onHighlight(null)}
      className="grid min-h-11 w-full grid-cols-[10px_1fr_auto_auto] items-center gap-x-2 rounded-lg px-2 py-1.5 text-left transition duration-200 hover:translate-x-0.5 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <span className={`h-2.5 w-2.5 rounded-full ${visual.dotClass}`} />
      <span className="truncate text-xs text-gray-600">{categoria.label}</span>
      <strong className="text-sm font-semibold tabular-nums text-gray-900">
        {categoria.valor}
      </strong>
      <span className="w-8 text-right text-[11px] tabular-nums text-gray-400">
        {percentual}%
      </span>
      <span className="col-start-2 col-end-5 mt-1 h-1 overflow-hidden rounded-full bg-gray-100">
        <span
          className={`block h-full rounded-full transition-[width] duration-500 ease-out ${visual.barClass}`}
          style={{ width: animar ? `${percentual}%` : "0%" }}
        />
      </span>
    </button>
  );
}

function ResumoRodape({ visao, dados }) {
  if (!dados) {
    return <p className="min-w-0 flex-1 text-xs text-gray-500">Sem dados.</p>;
  }

  if (visao === "alunos") {
    return (
      <p className="min-w-0 flex-1 truncate text-xs text-gray-500">
        <strong className="font-semibold text-gray-800">
          {dados.indicados} indicados
        </strong>{" "}
        <span className="mx-1">•</span>
        {dados.disponiveis} disponíveis no recorte
      </p>
    );
  }

  return (
    <p className="min-w-0 flex-1 truncate text-xs text-gray-500">
      <strong className="font-semibold text-gray-800">
        {dados.solicitacoes} solicitações
      </strong>{" "}
      <span className="mx-1">•</span>
      {dados.vagas} vagas solicitadas
    </p>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-[132px_1fr] items-center gap-4 px-5 py-6 sm:grid-cols-[160px_1fr]">
      <div className="mx-auto h-32 w-32 animate-pulse rounded-full border-[17px] border-gray-100" />
      <div className="space-y-4">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
        {[72, 48, 35].map((largura) => (
          <div key={largura} className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
            <div className="h-1 rounded-full bg-gray-100">
              <div
                className="h-full animate-pulse rounded-full bg-gray-200"
                style={{ width: `${largura}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ mensagem, onRetry }) {
  return (
    <div className="flex min-h-[190px] flex-col items-center justify-center px-6 py-8 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
        <RefreshCw className="h-4 w-4" />
      </span>
      <p className="mt-3 text-sm font-medium text-gray-800">{mensagem}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 text-xs font-semibold text-[#0a3d7c] transition hover:text-blue-700"
      >
        Tentar novamente
      </button>
    </div>
  );
}

function calcularPercentual(valor, total) {
  if (!total) return 0;
  return Math.round((valor / total) * 100);
}

function useAnimatedNumber(target) {
  const [valor, setValor] = useState(target);
  const valorAnterior = useRef(target);

  useEffect(() => {
    const inicio = valorAnterior.current;
    const diferenca = target - inicio;
    valorAnterior.current = target;

    if (
      diferenca === 0 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setValor(target);
      return undefined;
    }

    const duracao = 420;
    const inicioDaAnimacao = performance.now();
    let frame;

    function atualizar(agora) {
      const progresso = Math.min(1, (agora - inicioDaAnimacao) / duracao);
      const suavizado = 1 - Math.pow(1 - progresso, 3);

      setValor(Math.round(inicio + diferenca * suavizado));

      if (progresso < 1) {
        frame = requestAnimationFrame(atualizar);
      }
    }

    frame = requestAnimationFrame(atualizar);

    return () => cancelAnimationFrame(frame);
  }, [target]);

  return valor;
}
