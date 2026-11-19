"use client";

import React, { useEffect, useId, useState } from "react";
import { apiClient } from "@/lib/api/axiosClient";
import { formatarDataCriacao } from "@/lib/dashboard/solicitacoesResumo";
import { dashboardStyles } from "./DashboardCard";

const botao = dashboardStyles.secondaryAction;

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
            params: { busca, pagina },
            signal: controlador.signal,
          },
        );
        if (!controlador.signal.aborted) {
          const ultima = Math.max(
            1,
            Math.ceil(data.total / data.tamanhoPagina),
          );
          if (pagina > ultima) setPagina(ultima);
          else setDados(data);
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
  }, [solicitacao.id, solicitacao.ativa, busca, pagina, versao]);

  useEffect(() => {
    if (solicitacao.ativa === false) setSelecionados({});
  }, [solicitacao.ativa]);

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
          matriculaIds: Object.keys(selecionados),
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
        <div className="rounded-xl border border-gray-200 p-3">
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
                    Situação atual: {aluno.status}
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
          <p className="text-xs leading-5 text-gray-500">
            A lista mostra alunos disponíveis do curso solicitado, dentro da
            faixa etária e do sexo informados no pedido. Cada indicação vincula
            o aluno à empresa e muda sua situação para Indicado.
          </p>
          <label className="block text-xs font-medium text-gray-600">
            Buscar aluno, curso ou turma
            <input
              value={busca}
              maxLength={150}
              disabled={ocupado}
              onChange={(evento) => {
                setBusca(evento.target.value);
                setPagina(1);
              }}
              className="mt-1 min-h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </label>
          {carregando ? (
            <p role="status" className="py-4 text-sm text-gray-500">
              Carregando alunos…
            </p>
          ) : (
            !erroLeitura && (
              <>
                <fieldset disabled={ocupado}>
                  <legend className="mb-2 text-xs font-semibold text-gray-600">
                    Alunos compatíveis ({dados?.total || 0} matrículas)
                  </legend>
                  {dados?.alunos.length ? (
                    <div className="max-h-72 space-y-2 overflow-y-auto">
                      {dados.alunos.map((aluno) => {
                        const marcado = Boolean(
                          selecionados[aluno.matriculaId],
                        );
                        const bloqueado =
                          !marcado &&
                          (selecionadosLista.length >= 50 ||
                            selecionadosLista.some(
                              (item) => item.alunoId === aluno.alunoId,
                            ));
                        return (
                          <label
                            key={aluno.matriculaId}
                            className={`flex items-start gap-3 rounded-lg border p-3 ${marcado ? "border-blue-300 bg-blue-50" : "border-gray-200"} ${bloqueado ? "opacity-50" : "cursor-pointer"}`}
                          >
                            <input
                              type="checkbox"
                              checked={marcado}
                              disabled={bloqueado}
                              onChange={() => {
                                setSelecionados((anterior) => {
                                  const novos = { ...anterior };
                                  if (novos[aluno.matriculaId])
                                    delete novos[aluno.matriculaId];
                                  else novos[aluno.matriculaId] = aluno;
                                  return novos;
                                });
                                setSucesso("");
                                setErroEnvio("");
                              }}
                              className="mt-0.5 h-4 w-4 shrink-0 accent-blue-700"
                            />
                            <span className="min-w-0 text-xs text-gray-500">
                              <span className="block break-words font-semibold text-gray-900">
                                {aluno.nome} · {aluno.idade} anos
                              </span>
                              <span className="block break-words">
                                {aluno.curso} · {aluno.turma} · {aluno.periodo}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="py-3 text-xs text-gray-500">
                      Nenhum aluno disponível atende aos requisitos e à busca
                      informada.
                    </p>
                  )}
                </fieldset>
                {dados && dados.total > dados.tamanhoPagina && (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                    <button
                      type="button"
                      className={botao}
                      disabled={ocupado || pagina <= 1}
                      onClick={() => setPagina((valor) => valor - 1)}
                    >
                      Anterior
                    </button>
                    <span>
                      Página {pagina} de{" "}
                      {Math.ceil(dados.total / dados.tamanhoPagina)}
                    </span>
                    <button
                      type="button"
                      className={botao}
                      disabled={
                        ocupado ||
                        pagina >= Math.ceil(dados.total / dados.tamanhoPagina)
                      }
                      onClick={() => setPagina((valor) => valor + 1)}
                    >
                      Próxima
                    </button>
                  </div>
                )}
              </>
            )
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
