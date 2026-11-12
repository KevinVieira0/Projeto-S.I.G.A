"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ClipboardList,
  UserCheck,
  Users,
  Workflow,
} from "lucide-react";
import EmpresaShell from "@/layouts/empresa/EmpresaShell";
import PageHeader from "@/shared/layout/PageHeader";
import FormularioSolicitacao from "@/features/portal-empresa/components/FormularioSolicitacao";
import AprendizesEmpresa from "@/features/portal-empresa/components/AprendizesEmpresa";
import SolicitacoesEmpresa from "@/features/portal-empresa/components/SolicitacoesEmpresa";
import { useDadosEmpresa } from "@/features/portal-empresa/hooks/useDadosEmpresa";
import {
  estilosEmpresa,
  FalhaEmpresa,
} from "@/features/portal-empresa/components/PortalUi";

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
    <EmpresaShell aba={aba} alterar={setAba}>
      <PageHeader
        categoria="Portal da empresa"
        titulo={"Olá, " + (empresa?.nome || "sua empresa")}
        descricao="Acompanhe as indicações, as seleções em andamento e as contratações da sua empresa."
      />
      <section
        role="tabpanel"
        id="empresa-alunos-panel"
        aria-labelledby="empresa-alunos-tab"
        hidden={aba !== "alunos"}
        className="ui-conteudo space-y-6"
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
        id="empresa-nova-panel"
        aria-labelledby="empresa-nova-tab"
        hidden={aba !== "nova"}
        className="ui-conteudo"
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
        id="empresa-solicitacoes-panel"
        aria-labelledby="empresa-solicitacoes-tab"
        hidden={aba !== "solicitacoes"}
        className="ui-conteudo"
      >
        <SolicitacoesEmpresa
          selecionadaId={pedidoId}
          selecionar={setPedidoId}
          novaSolicitacao={() => setAba("nova")}
        />
      </section>
    </EmpresaShell>
  );
}
