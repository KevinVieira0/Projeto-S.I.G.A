"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronRight,
  ClipboardList,
  Users,
} from "lucide-react";
import {
  estilosEmpresa,
  SeloParticipacao,
  dataEmpresa,
  useDadosEmpresa,
  FalhaEmpresa,
  PaginacaoEmpresa,
} from "./base";
import PainelAlunoEmpresa from "./PainelAlunoEmpresa";

const periodo = { manha: "Manhã", tarde: "Tarde" };
function SituacaoPedido({ pedido }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${!pedido.ativa ? "bg-slate-100 text-slate-600" : pedido.resumo.vagasPreenchidas ? "bg-emerald-50 text-emerald-800" : "bg-orange-50 text-orange-800"}`}
    >
      {!pedido.ativa
        ? "Finalizada"
        : pedido.resumo.vagasPreenchidas
          ? "Vagas preenchidas"
          : "Ativa"}
    </span>
  );
}
function ProgressoVagas({ pedido }) {
  return (
    <div>
      <div className="mb-2 flex justify-between gap-3 text-xs text-slate-500">
        <span>Vagas preenchidas</span>
        <span className="font-semibold text-slate-700">
          {pedido.resumo.contratados} de {pedido.quantidadeVagas}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Vagas preenchidas"
        aria-valuemin={0}
        aria-valuemax={pedido.quantidadeVagas}
        aria-valuenow={pedido.resumo.contratados}
        className="h-1.5 overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className="h-full rounded-full bg-orange-500 transition-[width] duration-300 motion-reduce:transition-none"
          style={{
            width: `${Math.min(100, (pedido.resumo.contratados / pedido.quantidadeVagas) * 100)}%`,
          }}
        />
      </div>
    </div>
  );
}
function DetalhePedido({ pedidoId, voltar }) {
  const [pagina, setPagina] = useState(1);
  const { dados, carregando, erro, recarregar } = useDadosEmpresa(
    `/empresas/solicitacao/${pedidoId}?pagina=${pagina}`,
  );
  const [selecionado, setSelecionado] = useState(null);
  const p = dados?.solicitacao;
  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={voltar}
        className={estilosEmpresa.secundario}
      >
        <ArrowLeft className="h-4 w-4" />
        Minhas solicitações
      </button>
      {erro && <FalhaEmpresa mensagem={erro} tentar={recarregar} />}
      {carregando && !p && (
        <p role="status" className="py-10 text-center text-sm text-slate-500">
          Carregando solicitação…
        </p>
      )}
      {p && !erro && (
        <>
          <section className={`${estilosEmpresa.superficie} p-5 sm:p-7`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-700">
                  SOL-{p.id.slice(0, 6).toUpperCase()}
                </p>
                <h2
                  data-foco-acompanhamento
                  tabIndex={-1}
                  className="mt-2 text-xl font-semibold text-slate-900"
                >
                  {p.cursos}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Enviada em {dataEmpresa(p.criadoEm, true)}
                </p>
              </div>
              <SituacaoPedido pedido={p} />
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-5 border-y border-slate-200 py-5 sm:grid-cols-4">
              {[
                ["Vagas solicitadas", p.quantidadeVagas],
                ["Faixa etária", `${p.idadeMinima} a ${p.idadeMaxima} anos`],
                [
                  "Oferta",
                  p.pratica === "com"
                    ? `Com prática${p.periodoPratica ? ` · ${periodo[p.periodoPratica]}` : ""}`
                    : "Sem prática",
                ],
                [
                  "Perfil",
                  p.sexo === "todos"
                    ? "Todos"
                    : p.sexo === "masculino"
                      ? "Masculino"
                      : "Feminino",
                ],
                ["Início previsto", dataEmpresa(p.inicio)],
                ["Término previsto", dataEmpresa(p.fim)],
              ].map(([rotulo, valor]) => (
                <div key={rotulo}>
                  <dt className="text-xs text-slate-500">{rotulo}</dt>
                  <dd className="mt-1 text-sm font-medium text-slate-800">
                    {valor}
                  </dd>
                </div>
              ))}
            </dl>
            {p.observacoes && (
              <div className="mt-5">
                <p className="text-xs text-slate-500">Observações enviadas</p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                  {p.observacoes}
                </p>
              </div>
            )}
            <div className="mt-6">
              <ProgressoVagas pedido={p} />
            </div>
          </section>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Indicados", p.resumo.indicados],
              ["Em processo", p.resumo.emProcesso],
              ["Contratados", p.resumo.contratados],
              ["Participações encerradas", p.resumo.encerrados],
            ].map(([rotulo, valor]) => (
              <div key={rotulo} className={`${estilosEmpresa.superficie} p-4`}>
                <p className="text-xs text-slate-500">{rotulo}</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
                  {valor}
                </p>
              </div>
            ))}
          </div>
          <section
            className={estilosEmpresa.superficie}
            aria-labelledby="alunos-pedido-titulo"
          >
            <div className="border-b border-slate-200 p-5">
              <h3
                id="alunos-pedido-titulo"
                className="font-semibold text-slate-900"
              >
                Alunos encaminhados
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Selecione um aluno para consultar os contatos e atualizar o
                acompanhamento.
              </p>
            </div>
            {p.participacoes.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Users className="mx-auto mb-3 h-7 w-7 text-orange-300" />
                <p className="font-medium text-slate-700">
                  Aguardando indicações
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Sua solicitação foi recebida. Os alunos encaminhados pela
                  coordenação aparecerão aqui.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {p.participacoes.map((aluno) => (
                  <li key={aluno.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setSelecionado({
                          ...aluno,
                          participacaoId: aluno.id,
                          solicitacaoId: p.id,
                        })
                      }
                      className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-orange-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900">
                          {aluno.nome}
                          {aluno.arquivado && (
                            <span className="ml-2 text-xs text-slate-500">
                              Cadastro arquivado
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {aluno.curso} · {aluno.turma} · {aluno.turno}
                        </p>
                      </div>
                      <SeloParticipacao status={aluno.status} />
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {p.totalParticipacoes > 20 && (
              <PaginacaoEmpresa
                pagina={pagina}
                tamanho={20}
                total={p.totalParticipacoes}
                alterar={setPagina}
              />
            )}
          </section>
        </>
      )}
      {selecionado && (
        <PainelAlunoEmpresa
          selecao={selecionado}
          onClose={() => setSelecionado(null)}
          onChanged={recarregar}
        />
      )}
    </div>
  );
}
export default function SolicitacoesEmpresa({
  selecionadaId,
  selecionar,
  novaSolicitacao,
}) {
  const { dados, carregando, erro, recarregar } = useDadosEmpresa(
    "/empresas/solicitacao",
  );
  if (selecionadaId)
    return (
      <DetalhePedido
        key={selecionadaId}
        pedidoId={selecionadaId}
        voltar={() => selecionar(null)}
      />
    );
  return (
    <section aria-labelledby="titulo-solicitacoes">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            id="titulo-solicitacoes"
            tabIndex={-1}
            data-foco-acompanhamento
            className="text-lg font-semibold text-slate-900"
          >
            Minhas solicitações
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Acompanhe as indicações e o preenchimento de cada pedido.
          </p>
        </div>
        <button
          type="button"
          className={estilosEmpresa.primario}
          onClick={novaSolicitacao}
        >
          Nova solicitação
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
      {erro ? (
        <FalhaEmpresa mensagem={erro} tentar={recarregar} />
      ) : carregando && !dados ? (
        <p role="status" className="py-10 text-center text-sm text-slate-500">
          Carregando solicitações…
        </p>
      ) : !dados?.solicitacoes.length ? (
        <div className={`${estilosEmpresa.superficie} p-10 text-center`}>
          <ClipboardList className="mx-auto mb-3 h-8 w-8 text-orange-300" />
          <p className="font-medium text-slate-700">
            Nenhuma solicitação enviada
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Crie um pedido para informar o perfil dos aprendizes que sua empresa
            procura.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {dados.solicitacoes.map((p) => (
            <li
              key={p.id}
              className={`${estilosEmpresa.superficie} flex flex-col p-5`}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-700">
                  SOL-{p.id.slice(0, 6).toUpperCase()}
                </p>
                <SituacaoPedido pedido={p} />
              </div>
              <h3 className="text-base font-semibold leading-6 text-slate-900">
                {p.cursos}
              </h3>
              <p className="mt-2 text-xs text-slate-500">
                Enviada em {dataEmpresa(p.criadoEm)} · {p.quantidadeVagas}{" "}
                {p.quantidadeVagas === 1 ? "vaga" : "vagas"}
              </p>
              <div className="my-5 flex flex-wrap gap-3 text-xs text-slate-500">
                <span>{p.resumo.indicados} indicados</span>
                <span>{p.resumo.emProcesso} em processo</span>
                <span>{p.resumo.contratados} contratados</span>
              </div>
              <div className="mt-auto">
                <ProgressoVagas pedido={p} />
                <button
                  type="button"
                  onClick={() => selecionar(p.id)}
                  className={`mt-5 w-full ${estilosEmpresa.secundario}`}
                >
                  Acompanhar solicitação
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
