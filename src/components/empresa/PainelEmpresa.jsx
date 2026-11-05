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
export default function PainelEmpresa() {
  const [aba, setAba] = useState("alunos");
  const [pedidoId, setPedidoId] = useState(null);
  const [situacaoAluno, setSituacaoAluno] = useState("todos");
  const { dados: empresa } = useDadosEmpresa("/empresas/me");
  const { dados, erro, recarregar } = useDadosEmpresa("/empresas/resumo");
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
  const resumo = dados?.resumo;
  const indicadores = [
    {
      chave: "solicitacoesAtivas",
      titulo: "Solicitações ativas",
      descricao: "Pedidos em acompanhamento",
      Icone: ClipboardList,
      acao: () => {
        setPedidoId(null);
        setAba("solicitacoes");
      },
    },
    {
      chave: "indicados",
      titulo: "Alunos indicados",
      descricao: "Encaminhados à sua empresa",
      Icone: Users,
      acao: () => {
        setSituacaoAluno("INDICADO");
        setAba("alunos");
      },
    },
    {
      chave: "emProcesso",
      titulo: "Em processo",
      descricao: "Seleção ou formalização",
      Icone: Workflow,
      acao: () => {
        setSituacaoAluno("EM_PROCESSO");
        setAba("alunos");
      },
    },
    {
      chave: "contratados",
      titulo: "Contratados",
      descricao: "Alunos com vínculo confirmado",
      Icone: UserCheck,
      acao: () => {
        setSituacaoAluno("CONTRATADO");
        setAba("alunos");
      },
    },
  ];
  return (
    <div className="min-h-screen bg-[#faf9f7] text-slate-900">
      <header className="pointer-events-none sticky top-0 z-40 flex justify-center px-3 pt-4 sm:px-6">
        <div className="pointer-events-auto flex max-w-full items-center gap-1 rounded-full border border-orange-300/80 bg-white/90 p-1.5 shadow-lg shadow-orange-900/5 backdrop-blur-xl">
          <div
            role="tablist"
            aria-label="Seções do painel"
            className="flex min-w-0 gap-1 overflow-x-auto"
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
                className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-600 ${aba === item.id ? "bg-orange-100 text-orange-900" : "text-slate-600 hover:bg-orange-50"}`}
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
      <main className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
        <div className="mb-7">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">
            Portal da empresa
          </p>
          <h1 className="break-words text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Olá, {empresa?.nome || "sua empresa"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Acompanhe as indicações, as seleções em andamento e as contratações
            da sua empresa.
          </p>
        </div>
        <section
          role="tabpanel"
          id="painel-alunos"
          aria-labelledby="aba-alunos"
          hidden={aba !== "alunos"}
          className="empresa-conteudo space-y-6"
        >
          {erro && <FalhaEmpresa mensagem={erro} tentar={recarregar} />}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {indicadores.map(({ chave, titulo, descricao, Icone, acao }) => (
              <button
                type="button"
                key={chave}
                onClick={acao}
                className={`${estilosEmpresa.superficie} group relative p-4 text-left hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 motion-reduce:transform-none sm:p-5`}
              >
                <div className="mb-4 flex items-center justify-between gap-2">
                  <span className="rounded-xl bg-orange-50 p-2 text-orange-600">
                    <Icone className="h-5 w-5" />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-orange-600" />
                </div>
                <p className="text-xs font-medium text-slate-500">{titulo}</p>
                <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-slate-900">
                  {resumo ? resumo[chave].toLocaleString("pt-BR") : "—"}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {descricao}
                </p>
              </button>
            ))}
          </div>
          <AprendizesEmpresa
            situacao={situacaoAluno}
            alterarSituacao={setSituacaoAluno}
          />
        </section>
        <section
          role="tabpanel"
          id="painel-nova"
          aria-labelledby="aba-nova"
          hidden={aba !== "nova"}
          className="empresa-conteudo"
        >
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Nova solicitação
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Informe o perfil dos aprendizes que sua empresa procura.
            </p>
          </div>
          <FormularioSolicitacao onAcompanhar={acompanhar} />
        </section>
        <section
          role="tabpanel"
          id="painel-solicitacoes"
          aria-labelledby="aba-solicitacoes"
          hidden={aba !== "solicitacoes"}
          className="empresa-conteudo"
        >
          <SolicitacoesEmpresa
            selecionadaId={pedidoId}
            selecionar={setPedidoId}
            novaSolicitacao={() => setAba("nova")}
          />
        </section>
      </main>
      <style jsx>{`
        .empresa-conteudo:not([hidden]) {
          animation: conteudo-empresa 180ms ease-out;
        }
        @keyframes conteudo-empresa {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .empresa-conteudo:not([hidden]) {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
