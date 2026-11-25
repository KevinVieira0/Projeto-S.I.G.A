"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ClipboardList,
  UserCheck,
  Users,
  Workflow,
} from "lucide-react";
import LogoutButton from "@/components/login/LogoutButton";
import FormularioSolicitacao from "./solicitacao/FormularioSolicitacao";
import LateralAprendizesEmpresa from "./LateralAprendizesEmpresa";
import AprendizesEmpresa from "./acompanhamento/AprendizesEmpresa";
import PainelAlunoEmpresa from "./acompanhamento/PainelAlunoEmpresa";
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

const indicadores = [
  {
    chave: "solicitacoesAtivas",
    titulo: "Solicitações ativas",
    descricao: "Pedidos em acompanhamento",
    Icone: ClipboardList,
  },
  {
    chave: "indicados",
    titulo: "Alunos indicados",
    descricao: "Encaminhados à sua empresa",
    Icone: Users,
    filtro: "INDICADO",
  },
  {
    chave: "emProcesso",
    titulo: "Em processo",
    descricao: "Seleção ou formalização",
    Icone: Workflow,
    filtro: "EM_PROCESSO",
  },
  {
    chave: "contratados",
    titulo: "Contratados",
    descricao: "Alunos com vínculo confirmado",
    Icone: UserCheck,
    filtro: "CONTRATADO",
  },
];

function IndicadoresEmpresa({ resumo, situacao, filtrar, abrirSolicitacoes }) {
  return (
    <div
      role="group"
      aria-label="Indicadores da empresa"
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      {indicadores.map(({ chave, titulo, descricao, Icone, filtro }) => {
        const selecionado = situacao === filtro;
        return (
          <button
            key={chave}
            type="button"
            aria-pressed={filtro ? selecionado : undefined}
            aria-controls={
              filtro ? "lista-aprendizes-empresa" : "painel-solicitacoes"
            }
            onClick={
              filtro
                ? () => filtrar(selecionado ? "todos" : filtro)
                : abrirSolicitacoes
            }
            className={`${estilosEmpresa.superficie} group flex flex-col items-start p-3.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 aria-pressed:border-orange-500 aria-pressed:ring-1 aria-pressed:ring-orange-500/50 sm:px-5 sm:py-4`}
          >
            <span className="flex w-full items-center justify-between gap-2">
              <span className="rounded-lg border border-orange-200 bg-orange-50 p-2 text-orange-800">
                <Icone className="h-4 w-4" aria-hidden="true" />
              </span>
              <ArrowUpRight
                className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-orange-800 motion-safe:transition-colors"
                aria-hidden="true"
              />
            </span>
            <span className="mt-3 break-words text-sm font-semibold text-slate-800">
              {titulo}
            </span>
            <span className="mt-1.5 text-3xl font-semibold leading-none tracking-tight tabular-nums text-slate-950">
              {resumo?.[chave]?.toLocaleString("pt-BR") ?? "—"}
            </span>
            <span className="mt-2 break-words text-xs leading-5 text-slate-600">
              {descricao}
            </span>
          </button>
        );
      })}
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
  const [pendenciaAluno, setPendenciaAluno] = useState(null);
  const [buscaAprendizes, setBuscaAprendizes] = useState("");
  const [aprendizSelecionado, setAprendizSelecionado] = useState(null);
  const [paginaAprendizes, setPaginaAprendizes] = useState(1);
  const tituloRef = useRef(null);
  const { dados: empresa } = useDadosEmpresa("/empresas/me");
  const { dados, erro, recarregar } = useDadosEmpresa("/empresas/resumo");
  const pedidos = useDadosEmpresa("/empresas/solicitacao");
  const cabecalho = cabecalhos[aba];
  const exibindoFormulario = aba === "nova";
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
    requestAnimationFrame(() => tituloRef.current?.focus());
  }
  function filtrarAprendizes(situacao) {
    setSituacaoAluno(situacao);
    setPendenciaAluno(null);
    setPaginaAprendizes(1);
  }
  function buscarAprendizes(texto) {
    setBuscaAprendizes(texto);
    setPaginaAprendizes(1);
  }
  function abrirPendencia(status, pendencia) {
    if (pendencia.aprendiz) {
      setAprendizSelecionado(pendencia.aprendiz);
      return;
    }
    setPendenciaAluno(status);
    setSituacaoAluno("todos");
    buscarAprendizes("");
    document.getElementById("titulo-aprendizes")?.focus();
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
    <div
      className={`relative isolate min-h-screen bg-[#faf9f7] text-slate-900 ${
        exibindoFormulario ? "lg:flex lg:min-h-dvh lg:flex-col" : ""
      }`}
    >
      <FundoNovaSolicitacao />
      <header className="pointer-events-none sticky top-0 z-40 flex justify-center px-3 pt-4 sm:px-6">
        <div className="siga-vidro siga-vidro-elevado siga-card-empresa pointer-events-auto flex max-w-full items-center gap-1 rounded-2xl p-1.5 sm:rounded-full">
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
      <main
        className={`mx-auto w-full px-4 sm:px-6 ${
          exibindoFormulario
            ? "max-w-[57rem] pb-6 pt-3.5 lg:flex lg:flex-1 lg:flex-col lg:[@media(min-height:740px)]:pt-5"
            : `pb-12 ${aba === "alunos" ? "max-w-[84rem] pt-7" : "max-w-6xl pt-8 sm:pt-10"}`
        }`}
      >
        <div
          className={
            exibindoFormulario
              ? "mb-3 lg:[@media(min-height:740px)]:mb-4"
              : aba === "alunos"
                ? "mb-5"
                : "mb-6 sm:mb-8"
          }
        >
          <p
            className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 ${
              exibindoFormulario ? "mb-1" : aba === "alunos" ? "mb-2" : "mb-3"
            }`}
          >
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
            <span
              className={`min-w-0 break-words font-semibold tracking-tight text-slate-700 ${
                exibindoFormulario ? "text-base" : "text-lg sm:text-xl"
              }`}
            >
              {empresa?.nome || "sua empresa"}
            </span>
          </p>
          <h1
            ref={tituloRef}
            data-foco-acompanhamento
            tabIndex={-1}
            className={`scroll-mt-24 font-bold tracking-tight text-slate-900 ${
              exibindoFormulario
                ? "text-2xl sm:text-3xl"
                : "text-3xl sm:text-4xl"
            }`}
          >
            {cabecalho.titulo}
          </h1>
          <p
            className={`max-w-2xl text-slate-600 ${
              exibindoFormulario
                ? "mt-1 text-sm leading-5"
                : `text-base leading-7 ${aba === "alunos" ? "mt-2" : "mt-3"}`
            }`}
          >
            {cabecalho.texto}
          </p>
        </div>
        <section
          role="tabpanel"
          id="painel-alunos"
          aria-labelledby="aba-alunos"
          hidden={aba !== "alunos"}
          className="siga-entrada space-y-6"
        >
          {erro && <FalhaEmpresa mensagem={erro} tentar={recarregar} />}
          <IndicadoresEmpresa
            resumo={dados?.resumo}
            situacao={pendenciaAluno ? null : situacaoAluno}
            filtrar={filtrarAprendizes}
            abrirSolicitacoes={() => acompanhar(null)}
          />
          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]">
            <AprendizesEmpresa
              situacao={situacaoAluno}
              alterarSituacao={filtrarAprendizes}
              pendencia={pendenciaAluno}
              busca={buscaAprendizes}
              alterarBusca={buscarAprendizes}
              pagina={paginaAprendizes}
              alterarPagina={setPaginaAprendizes}
              selecionado={aprendizSelecionado}
              abrirAluno={setAprendizSelecionado}
            />
            <LateralAprendizesEmpresa
              dados={dados}
              erro={erro}
              pedidos={pedidos}
              abrirPendencia={abrirPendencia}
              abrirAluno={setAprendizSelecionado}
              acompanhar={acompanhar}
            />
          </div>
        </section>
        <section
          role="tabpanel"
          id="painel-nova"
          aria-labelledby="aba-nova"
          hidden={aba !== "nova"}
          className={`siga-entrada ${exibindoFormulario ? "lg:flex lg:flex-1 lg:flex-col" : ""}`}
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
            consulta={pedidos}
            selecionadaId={pedidoId}
            selecionar={setPedidoId}
            novaSolicitacao={() => setAba("nova")}
          />
        </section>
      </main>
      {aprendizSelecionado && (
        <PainelAlunoEmpresa
          key={
            aprendizSelecionado.participacaoId ||
            aprendizSelecionado.matriculaId
          }
          selecao={aprendizSelecionado}
          onClose={() => setAprendizSelecionado(null)}
        />
      )}
    </div>
  );
}
