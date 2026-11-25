"use client";

import React, { useEffect, useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { apiClient } from "@/lib/api/axiosClient";
import { formatarDataCriacao } from "@/lib/dashboard/solicitacoesResumo";
import { dashboardStyles } from "./DashboardCard";

const botao = dashboardStyles.secondaryAction;

function ListaCandidatos({
  alunos,
  total,
  pagina,
  tamanhoPagina,
  mudarPagina,
  selecionados,
  alternar,
  ocupado,
  mensagemVazia,
}) {
  const paginas = Math.ceil(total / tamanhoPagina);
  const limiteAtingido = Object.keys(selecionados).length >= 50;
  return (
    <div className="space-y-2">
      {alunos.length ? (
        <div className="max-h-56 space-y-1.5 overflow-y-auto">
          {alunos.map((aluno) => {
            const selecionado = selecionados[aluno.alunoId];
            const marcado = selecionado?.matriculaId === aluno.matriculaId;
            const bloqueado =
              !marcado && (limiteAtingido || Boolean(selecionado));
            return (
              <label
                key={aluno.matriculaId}
                className={`flex items-start gap-2 rounded-lg border bg-white px-3 py-2 ${marcado ? "border-blue-400" : "border-gray-200"} ${bloqueado ? "opacity-50" : "cursor-pointer"}`}
              >
                <input
                  type="checkbox"
                  checked={marcado}
                  disabled={ocupado || bloqueado}
                  onChange={() => alternar(aluno)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-blue-700"
                />
                <span className="min-w-0 break-words text-xs text-gray-600">
                  <span className="block font-semibold text-gray-900">
                    {aluno.nome}
                    {aluno.idade != null && ` · ${aluno.idade} anos`}
                  </span>
                  {aluno.curso} · {aluno.turma} · {aluno.periodo}
                </span>
              </label>
            );
          })}
        </div>
      ) : (
        <p className="py-2 text-xs text-gray-600">{mensagemVazia}</p>
      )}
      {paginas > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
          <button
            type="button"
            className={botao}
            disabled={ocupado || pagina <= 1}
            onClick={() => mudarPagina(pagina - 1)}
          >
            Anterior
          </button>
          <span>
            Página {pagina} de {paginas}
          </span>
          <button
            type="button"
            className={botao}
            disabled={ocupado || pagina >= paginas}
            onClick={() => mudarPagina(pagina + 1)}
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}

export function SolicitacaoIndicacoes({
  solicitacao,
  disabled,
  onBusyChange,
  onUpdated,
}) {
  const tituloId = useId();
  const [dados, setDados] = useState(null);
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [paginaDisponiveis, setPaginaDisponiveis] = useState(1);
  const [versao, setVersao] = useState(0);
  const [selecionados, setSelecionados] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erroLeitura, setErroLeitura] = useState("");
  const [erroEnvio, setErroEnvio] = useState("");
  const [sucesso, setSucesso] = useState("");
  const ativa = solicitacao.ativa !== false && dados?.ativa !== false;
  const selecionadosLista = Object.values(selecionados);
  const ocupado = disabled || salvando;

  useEffect(() => {
    const controlador = new AbortController();
    setCarregando(true);
    setErroLeitura("");
    const temporizador = window.setTimeout(async () => {
      try {
        const { data } = await apiClient.get(
          `/admin/solicitacoes/${solicitacao.id}/indicacoes`,
          {
            params: { busca, pagina, paginaDisponiveis },
            signal: controlador.signal,
          },
        );
        if (!controlador.signal.aborted) {
          const ultima = Math.max(
            1,
            Math.ceil(data.total / data.tamanhoPagina),
          );
          const ultimaDisponiveis = Math.max(
            1,
            Math.ceil(data.totalDisponiveis / data.tamanhoPagina),
          );
          if (pagina > ultima) setPagina(ultima);
          if (paginaDisponiveis > ultimaDisponiveis)
            setPaginaDisponiveis(ultimaDisponiveis);
          setDados(data);
          if (!data.ativa && solicitacao.ativa)
            onUpdated({
              id: solicitacao.id,
              ativa: false,
              encerradaEm: data.encerradaEm,
              motivoEncerramento: data.motivoEncerramento,
            });
        }
      } catch (e) {
        if (!controlador.signal.aborted)
          setErroLeitura(
            e.response?.data?.mensagem ||
              e.response?.data?.message ||
              "Não foi possível carregar os alunos.",
          );
      } finally {
        if (!controlador.signal.aborted) setCarregando(false);
      }
    }, 250);
    return () => {
      controlador.abort();
      window.clearTimeout(temporizador);
    };
  }, [
    solicitacao.id,
    solicitacao.ativa,
    busca,
    pagina,
    paginaDisponiveis,
    versao,
    onUpdated,
  ]);

  useEffect(() => {
    if (solicitacao.ativa === false) setSelecionados({});
  }, [solicitacao.ativa]);

  function alternar(aluno) {
    setSelecionados((anterior) => {
      const novos = { ...anterior };
      const selecionado = novos[aluno.alunoId];
      if (selecionado?.matriculaId === aluno.matriculaId)
        delete novos[aluno.alunoId];
      else if (!selecionado && Object.keys(novos).length < 50)
        novos[aluno.alunoId] = aluno;
      return novos;
    });
    setErroEnvio("");
    setSucesso("");
  }

  async function indicar(evento) {
    evento.preventDefault();
    if (
      ocupado ||
      carregando ||
      erroLeitura ||
      !ativa ||
      !selecionadosLista.length
    )
      return;
    setSalvando(true);
    onBusyChange(true);
    setErroEnvio("");
    setSucesso("");
    try {
      const { data } = await apiClient.post(
        `/admin/solicitacoes/${solicitacao.id}/indicacoes`,
        {
          matriculaIds: selecionadosLista.map(({ matriculaId }) => matriculaId),
        },
      );
      setSucesso(
        `${data.quantidade} ${data.quantidade === 1 ? "aluno indicado" : "alunos indicados"} com sucesso.`,
      );
      setSelecionados({});
      setVersao((valor) => valor + 1);
      onUpdated();
      window.dispatchEvent(new Event("alunos:sincronizados"));
    } catch (e) {
      setErroEnvio(
        e.response?.data?.mensagem ||
          e.response?.data?.message ||
          "Não foi possível indicar os alunos. Tente novamente.",
      );
      if (e.response?.status === 409) {
        setSelecionados({});
        setVersao((valor) => valor + 1);
        onUpdated();
      }
    } finally {
      setSalvando(false);
      onBusyChange(false);
    }
  }

  return (
    <section
      aria-labelledby={tituloId}
      className="space-y-4 border-t border-gray-100 px-6 py-5"
    >
      <h3 id={tituloId} className="text-base font-semibold text-gray-900">
        Indicação de alunos
      </h3>
      {!ativa && carregando && (
        <p role="status" className="text-sm text-gray-500">
          Carregando indicações…
        </p>
      )}
      {dados && (
        <div className="siga-card p-3">
          <h4 className="text-sm font-semibold text-gray-800">
            Alunos indicados ({dados.indicacoes.length})
          </h4>
          {dados.indicacoes.length ? (
            <ul className="mt-2 max-h-56 space-y-3 overflow-y-auto">
              {dados.indicacoes.map((aluno) => (
                <li key={aluno.id} className="text-xs text-gray-500">
                  <p className="break-words font-semibold text-gray-900">
                    {aluno.nome}
                  </p>
                  <p className="break-words">
                    {aluno.curso} · {aluno.turma}
                  </p>
                  <p>
                    Indicado em {formatarDataCriacao(aluno.indicadoEm)} ·
                    Situação na solicitação: {aluno.status}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-gray-500">
              Nenhum aluno indicado para esta solicitação.
            </p>
          )}
        </div>
      )}
      {!ativa && (
        <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
          Solicitação finalizada. Novas indicações estão encerradas. As
          indicações anteriores permanecem no histórico.
        </p>
      )}
      {erroLeitura && (
        <div
          role="alert"
          className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
        >
          <p>{erroLeitura}</p>
          <button
            type="button"
            className={`${botao} mt-2`}
            disabled={ocupado}
            onClick={() => setVersao((valor) => valor + 1)}
          >
            Tentar novamente
          </button>
        </div>
      )}
      {erroEnvio && (
        <p
          role="alert"
          className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
        >
          {erroEnvio}
        </p>
      )}
      {sucesso && (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700"
        >
          {sucesso}
        </p>
      )}
      {ativa && (
        <form onSubmit={indicar} className="space-y-3">
          <label className="block text-xs font-medium text-gray-600">
            Buscar aluno, curso ou turma
            <input
              value={busca}
              maxLength={150}
              disabled={ocupado}
              onChange={(evento) => {
                setBusca(evento.target.value);
                setPagina(1);
                setPaginaDisponiveis(1);
              }}
              className="mt-1 min-h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </label>
          {carregando ? (
            <p role="status" className="py-4 text-sm text-gray-500">
              Carregando alunos…
            </p>
          ) : (
            !erroLeitura &&
            dados && (
              <>
                <section
                  aria-label="Alunos recomendados"
                  className="siga-card space-y-2 border-blue-200 bg-blue-50 p-3"
                >
                  <h4 className="text-sm font-semibold text-blue-900">
                    Alunos recomendados ({dados.total})
                  </h4>
                  <p className="text-xs text-slate-600">
                    Disponíveis que atendem ao curso, à faixa etária e ao perfil
                    do pedido.
                  </p>
                  <ListaCandidatos
                    alunos={dados.alunos}
                    total={dados.total}
                    pagina={pagina}
                    tamanhoPagina={dados.tamanhoPagina}
                    mudarPagina={setPagina}
                    selecionados={selecionados}
                    alternar={alternar}
                    ocupado={ocupado}
                    mensagemVazia="Nenhum aluno recomendado para esta busca."
                  />
                </section>
                <details className="siga-card siga-card-interativo siga-expansivel">
                  <summary className="siga-cabecalho-expansivel flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-gray-900 hover:bg-gray-50 focus-visible:outline-blue-600">
                    Todos os alunos disponíveis ({dados.totalDisponiveis})
                    <ChevronDown
                      className="siga-seta-expansao text-gray-500"
                      aria-hidden="true"
                    />
                  </summary>
                  <div className="px-3 pb-3">
                    <ListaCandidatos
                      alunos={dados.disponiveis}
                      total={dados.totalDisponiveis}
                      pagina={paginaDisponiveis}
                      tamanhoPagina={dados.tamanhoPagina}
                      mudarPagina={setPaginaDisponiveis}
                      selecionados={selecionados}
                      alternar={alternar}
                      ocupado={ocupado}
                      mensagemVazia="Nenhum aluno disponível para esta busca."
                    />
                  </div>
                </details>
              </>
            )
          )}
          {selecionadosLista.length > 0 && (
            <div className="siga-card bg-gray-50 p-3">
              <h4 className="text-sm font-semibold text-gray-900">
                Revisar selecionados ({selecionadosLista.length})
              </h4>
              <ul className="mt-2 max-h-36 space-y-2 overflow-y-auto">
                {selecionadosLista.map((aluno) => (
                  <li
                    key={aluno.alunoId}
                    className="flex items-start justify-between gap-2 text-xs"
                  >
                    <p className="min-w-0 break-words text-gray-600">
                      <strong className="block font-semibold text-gray-900">
                        {aluno.nome}
                      </strong>
                      {aluno.curso} · {aluno.turma}
                    </p>
                    <button
                      type="button"
                      disabled={ocupado}
                      aria-label={`Remover ${aluno.nome} da seleção`}
                      className="shrink-0 rounded px-2 py-1 font-medium text-blue-800 hover:bg-blue-100"
                      onClick={() => alternar(aluno)}
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={
                ocupado ||
                carregando ||
                Boolean(erroLeitura) ||
                !selecionadosLista.length
              }
              className={dashboardStyles.primaryAction}
            >
              {salvando
                ? "Indicando…"
                : `Indicar selecionados (${selecionadosLista.length})`}
            </button>
            {selecionadosLista.length > 0 && (
              <button
                type="button"
                className={botao}
                disabled={ocupado}
                onClick={() => setSelecionados({})}
              >
                Limpar seleção
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
