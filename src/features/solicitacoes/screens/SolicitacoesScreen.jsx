"use client";

import { useState, useEffect } from "react";
import PageContainer from "@/shared/layout/PageContainer";
import PageHeader from "@/shared/layout/PageHeader";
import Select from "@/shared/ui/Select";
import { Mail, RefreshCw } from "lucide-react";
import Card, { CardHeader, CardFooter, cardStyles } from "@/shared/ui/Card";
import { SolicitacaoCard } from "@/features/solicitacoes/components/SolicitacaoCard";
import { SolicitacaoDetalhes } from "@/features/solicitacoes/components/SolicitacaoDetalhes";
import { SolicitacoesAnalytics } from "@/features/solicitacoes/components/SolicitacoesAnalytics";
import { apiClient } from "@/lib/api/axiosClient";
import { contarPorSituacao } from "@/lib/dashboard/solicitacoesResumo";
import AtualizacoesEmpresas from "@/features/solicitacoes/components/AtualizacoesEmpresas";

export default function AdminSolicitacoesPage() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [versao, setVersao] = useState(0);
  const [selecionadaId, setSelecionadaId] = useState(null);
  const [busca, setBusca] = useState("");
  const [situacao, setSituacao] = useState("todas");

  useEffect(() => {
    const controlador = new AbortController();
    async function carregarDados() {
      setCarregando(true);
      setErro(null);
      try {
        const response = await apiClient.get("/admin/solicitacoes", {
          signal: controlador.signal,
        });
        if (!controlador.signal.aborted) setDados(response.data);
      } catch (err) {
        if (!controlador.signal.aborted)
          setErro(
            err.response?.data?.error ||
              err.response?.data?.mensagem ||
              err.response?.data?.message ||
              "Falha ao carregar as solicitações. Tente novamente.",
          );
      } finally {
        if (!controlador.signal.aborted) setCarregando(false);
      }
    }
    carregarDados();
    return () => controlador.abort();
  }, [versao]);

  const solicitacoes = dados?.solicitacoes || [];
  const selecionada = solicitacoes.find((item) => item.id === selecionadaId);
  const normalizar = (valor) =>
    String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const visiveis = solicitacoes.filter(
    (item) =>
      (situacao === "todas" ||
        (situacao === "ativas" ? item.ativa : !item.ativa)) &&
      normalizar(
        [
          item.empresa?.razaoSocial,
          item.empresa?.nomeFantasia,
          item.cursos,
          item.id,
        ].join(" "),
      ).includes(normalizar(busca.trim())),
  );

  function atualizarSolicitacao(alteracao) {
    if (!alteracao) {
      setVersao((valor) => valor + 1);
      return;
    }
    setDados((anterior) => {
      const novas = anterior.solicitacoes.map((item) =>
        item.id === alteracao.id ? { ...item, ...alteracao } : item,
      );
      return {
        ...anterior,
        solicitacoes: novas,
        analytics: {
          ...anterior.analytics,
          statusData: contarPorSituacao(novas).categorias,
        },
      };
    });
  }

  return (
    <PageContainer className="space-y-6" aria-busy={carregando}>
      <PageHeader
        titulo="Solicitações"
        descricao="Acompanhe os pedidos de aprendizes enviados pelas empresas parceiras."
      />
      {!carregando && !erro && (
        <SolicitacoesAnalytics
          dadosStatus={dados?.analytics?.statusData}
          dadosMensais={dados?.analytics?.monthlyData}
        />
      )}
      <AtualizacoesEmpresas
        abrirSolicitacao={setSelecionadaId}
        atualizar={() => setVersao((v) => v + 1)}
      />
      <Card aria-labelledby="solicitacoes-titulo">
        <CardHeader
          headingId="solicitacoes-titulo"
          eyebrow="Empresas parceiras"
          title="Solicitações recebidas"
          description="Consulte os pedidos, indique alunos e acompanhe a situação de cada solicitação."
          icon={Mail}
        />
        <div className="flex flex-wrap gap-3 border-b border-gray-100 px-5 py-4">
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-gray-500">
            Buscar solicitação
            <input
              value={busca}
              disabled={carregando}
              maxLength={150}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Empresa, curso ou número da solicitação"
              className="min-h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            Situação
            <Select
              value={situacao}
              disabled={carregando}
              onChange={(evento) => setSituacao(evento.target.value)}
              className="min-h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todas">Todas</option>
              <option value="ativas">Ativas</option>
              <option value="finalizadas">Finalizadas</option>
            </Select>
          </label>
        </div>
        <div className={cardStyles.body}>
          {carregando ? (
            <p
              role="status"
              className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500"
            >
              <RefreshCw
                className="h-4 w-4 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
              Carregando solicitações…
            </p>
          ) : erro ? (
            <div role="alert" className={cardStyles.error}>
              <p>{erro}</p>
              <button
                type="button"
                onClick={() => setVersao((valor) => valor + 1)}
                className={`mt-3 ${cardStyles.secondaryAction}`}
              >
                Tentar novamente
              </button>
            </div>
          ) : visiveis.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-12 text-center text-sm text-gray-500">
              {solicitacoes.length
                ? "Nenhuma solicitação encontrada para os filtros selecionados."
                : "Nenhuma solicitação cadastrada até o momento."}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {visiveis.map((item) => (
                <SolicitacaoCard
                  key={item.id}
                  solicitacao={item}
                  onSelect={setSelecionadaId}
                />
              ))}
            </div>
          )}
        </div>
        <CardFooter className="justify-between">
          <span>
            {!carregando && !erro
              ? `${visiveis.length} de ${solicitacoes.length} solicitações`
              : "Pedidos das empresas parceiras"}
          </span>
          <span>Mais recentes primeiro</span>
        </CardFooter>
      </Card>
      {selecionada && (
        <SolicitacaoDetalhes
          key={selecionada.id}
          solicitacao={selecionada}
          onClose={() => setSelecionadaId(null)}
          onUpdated={atualizarSolicitacao}
        />
      )}
    </PageContainer>
  );
}
