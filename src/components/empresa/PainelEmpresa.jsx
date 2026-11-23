"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ClipboardList,
  UserCheck,
  Users,
  Workflow,
} from "lucide-react";
import LogoutButton from "@/components/login/LogoutButton";
import FormularioSolicitacao from "./FormularioSolicitacao";
import AprendizesEmpresa from "./acompanhamento/AprendizesEmpresa";
import SolicitacoesEmpresa from "./acompanhamento/SolicitacoesEmpresa";
import {
  estilosEmpresa,
  useDadosEmpresa,
  FalhaEmpresa,
} from "./acompanhamento/base";

const abas = [
  { id: "alunos", rotulo: "Aprendizes" },
  { id: "nova", rotulo: "Nova solicitação" },
  { id: "solicitacoes", rotulo: "Minhas solicitações" },
];

const cabecalhos = {
  alunos: {
    titulo: "Visão Geral",
    texto: "Acompanhe suas solicitações e as etapas dos aprendizes.",
  },
  nova: {
    titulo: "Nova solicitação",
    texto: "Informe o perfil dos aprendizes que sua empresa procura.",
  },
  solicitacoes: {
    titulo: "Minhas solicitações",
    texto: "Acompanhe as indicações e o preenchimento de cada pedido.",
  },
};

const etapas = [
  { chave: "indicados", titulo: "Indicados", Icone: Users, filtro: "INDICADO" },
  {
    chave: "emProcesso",
    titulo: "Em processo",
    Icone: Workflow,
    filtro: "EM_PROCESSO",
  },
  {
    chave: "contratados",
    titulo: "Contratados",
    Icone: UserCheck,
    filtro: "CONTRATADO",
  },
];

function ResumoDoPortal({ resumo, situacao, filtrar, abrirSolicitacoes }) {
  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(15rem,24rem)_minmax(0,1fr)] 2xl:grid-cols-1">
      <section
        className={`${estilosEmpresa.superficie} flex h-full flex-col bg-gradient-to-br from-orange-50 to-white p-4 sm:p-5`}
        aria-labelledby="titulo-solicitacoes-ativas"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="titulo-solicitacoes-ativas"
              className="text-sm font-semibold text-slate-800"
            >
              Solicitações ativas
            </h2>
            <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-slate-950">
              {resumo?.solicitacoesAtivas?.toLocaleString("pt-BR") ?? "—"}
            </p>
          </div>
          <span className="shrink-0 rounded-lg border border-orange-200 bg-white p-2 text-orange-800">
            <ClipboardList className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>
        <button
          type="button"
          onClick={abrirSolicitacoes}
          className="siga-acao mt-3 inline-flex min-h-9 items-center gap-1.5 self-start rounded-md text-sm font-semibold text-orange-800 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600"
        >
          Ver solicitações
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </section>

      <section
        aria-labelledby="titulo-etapas-aprendizes"
        className={`${estilosEmpresa.superficie} min-w-0 p-4 sm:p-5`}
      >
        <h2
          id="titulo-etapas-aprendizes"
          className="text-sm font-semibold text-slate-800"
        >
          Aprendizes por etapa
        </h2>
        <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2.5">
          {etapas.map(({ chave, titulo, Icone, filtro }) => (
            <button
              key={chave}
              type="button"
              aria-pressed={situacao === filtro}
              aria-controls="lista-aprendizes-empresa"
              onClick={() => filtrar(situacao === filtro ? "todos" : filtro)}
              className="min-w-0 rounded-lg border border-slate-200 bg-slate-50/60 px-1.5 py-2.5 text-left text-slate-800 transition-colors hover:border-orange-300 hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 aria-pressed:border-orange-400 aria-pressed:bg-orange-50 aria-pressed:text-orange-950 motion-reduce:transition-none sm:px-3"
            >
              <Icone className="h-4 w-4 text-orange-800" aria-hidden="true" />
              <span className="mt-1.5 block text-2xl font-semibold leading-none tracking-tight tabular-nums">
                {resumo?.[chave]?.toLocaleString("pt-BR") ?? "—"}
              </span>
              <span className="mt-1.5 block break-words text-xs font-medium">
                {titulo}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function FundoNovaSolicitacao() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute -right-40 -top-44 h-[34rem] w-[34rem] rounded-full bg-orange-100/70" />
      <div className="absolute -bottom-56 -left-44 h-[32rem] w-[32rem] rounded-full bg-stone-200/50" />
      <div className="absolute left-[8%] top-[38%] h-20 w-20 rounded-full bg-orange-200/40" />
    </div>
  );
}

export default function PainelEmpresa() {
  const [aba, setAba] = useState("alunos");
  const [pedidoId, setPedidoId] = useState(null);
  const [situacaoAluno, setSituacaoAluno] = useState("todos");
  const [paginaAprendizes, setPaginaAprendizes] = useState(1);
  const { dados: empresa } = useDadosEmpresa("/empresas/me");
  const { dados, erro, recarregar } = useDadosEmpresa("/empresas/resumo");
  const cabecalho = cabecalhos[aba];
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("solicitacao");
    if (id && /^[a-f\d-]{36}$/i.test(id)) {
      setPedidoId(id);
      setAba("solicitacoes");
    }
  }, []);
  function acompanhar(id) {
    setPedidoId(id);
    setAba("solicitacoes");
  }
  function filtrarAprendizes(situacao) {
    setSituacaoAluno(situacao);
    setPaginaAprendizes(1);
  }
  function navegarTeclado(evento, indice) {
    const proximo = {
      ArrowRight: (indice + 1) % abas.length,
      ArrowLeft: (indice + abas.length - 1) % abas.length,
      Home: 0,
      End: abas.length - 1,
    }[evento.key];
    if (proximo === undefined) return;
    evento.preventDefault();
    setAba(abas[proximo].id);
    evento.currentTarget.parentElement
      .querySelectorAll('[role="tab"]')
      [proximo]?.focus();
  }
  return (
    <div className="relative isolate min-h-screen bg-[#faf9f7] text-slate-900">
      <FundoNovaSolicitacao />
      <header className="pointer-events-none sticky top-0 z-40 flex justify-center px-3 pt-4 sm:px-6">
        <div className="pointer-events-auto flex max-w-full items-center gap-1 rounded-2xl border border-orange-300/80 bg-white/90 p-1.5 shadow-lg shadow-orange-900/5 backdrop-blur-xl sm:rounded-full">
          <div
            role="tablist"
            aria-label="Seções do painel"
            className="grid min-w-0 grid-cols-3 gap-1 sm:flex"
          >
            {abas.map((item, indice) => (
              <button
                key={item.id}
                role="tab"
                id={`aba-${item.id}`}
                aria-selected={aba === item.id}
                aria-controls={`painel-${item.id}`}
                tabIndex={aba === item.id ? 0 : -1}
                onKeyDown={(e) => navegarTeclado(e, indice)}
                onClick={() => setAba(item.id)}
                className={`siga-acao min-h-10 min-w-0 rounded-xl px-1 text-center text-[11px] font-semibold leading-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-600 sm:shrink-0 sm:rounded-full sm:px-4 sm:text-sm ${aba === item.id ? "bg-orange-100 text-orange-900" : "text-slate-600 hover:bg-orange-50"}`}
              >
                {item.rotulo}
              </button>
            ))}
          </div>
          <span
            aria-hidden="true"
            className="mx-1 h-6 w-px shrink-0 bg-slate-200"
          />
          <div className="shrink-0">
            <LogoutButton variante="laranja" />
          </div>
        </div>
      </header>
      <main className="siga-pagina pb-12">
        <div className="mb-6 sm:mb-8">
          <p className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">
              <span
                aria-hidden="true"
                className="h-1.5 w-6 rounded-full bg-orange-500"
              />
              Portal da empresa
            </span>
            <span aria-hidden="true" className="text-orange-300">
              /
            </span>
            <span className="break-words text-lg font-semibold tracking-tight text-slate-700 sm:text-xl">
              {empresa?.nome || "sua empresa"}
            </span>
          </p>
          <h1
            data-foco-acompanhamento
            tabIndex={-1}
            className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
          >
            {cabecalho.titulo}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            {cabecalho.texto}
          </p>
        </div>
        <section
          role="tabpanel"
          id="painel-alunos"
          aria-labelledby="aba-alunos"
          hidden={aba !== "alunos"}
          className="siga-entrada space-y-5"
        >
          {erro && <FalhaEmpresa mensagem={erro} tentar={recarregar} />}
          <div className="grid min-w-0 items-start gap-5 2xl:grid-cols-[minmax(19rem,23rem)_minmax(0,1fr)]">
            <ResumoDoPortal
              resumo={dados?.resumo}
              situacao={situacaoAluno}
              filtrar={filtrarAprendizes}
              abrirSolicitacoes={() => acompanhar(null)}
            />
            <AprendizesEmpresa
              situacao={situacaoAluno}
              alterarSituacao={filtrarAprendizes}
              pagina={paginaAprendizes}
              alterarPagina={setPaginaAprendizes}
            />
          </div>
        </section>
        <section
          role="tabpanel"
          id="painel-nova"
          aria-labelledby="aba-nova"
          hidden={aba !== "nova"}
          className="siga-entrada"
        >
          <FormularioSolicitacao onAcompanhar={acompanhar} />
        </section>
        <section
          role="tabpanel"
          id="painel-solicitacoes"
          aria-labelledby="aba-solicitacoes"
          hidden={aba !== "solicitacoes"}
          className="siga-entrada"
        >
          <SolicitacoesEmpresa
            selecionadaId={pedidoId}
            selecionar={setPedidoId}
            novaSolicitacao={() => setAba("nova")}
          />
        </section>
      </main>
    </div>
  );
}
