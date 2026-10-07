"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  Building2,
  FileCheck2,
  GraduationCap,
  History,
  ListChecks,
  Pencil,
  RefreshCw,
  UserRound,
  X,
} from "lucide-react";
import { apiClient } from "@/lib/api/axiosClient";
import { dashboardStyles } from "./DashboardCard";

const rotulosStatus = {
  DISPONIVEL: "Disponível",
  Disponível: "Disponível",
  INDICADO: "Indicado",
  Indicado: "Indicado",
  EM_PROCESSO: "Em processo",
  "Em processo": "Em processo",
  CONTRATADO: "Empregado",
  Contratado: "Empregado",
};
const coresStatus = {
  Disponível: "bg-orange-50 text-orange-700 ring-orange-600/20",
  Indicado: "bg-green-50 text-green-700 ring-green-600/20",
  "Em processo": "bg-blue-50 text-blue-700 ring-blue-600/20",
  Empregado: "bg-violet-50 text-violet-700 ring-violet-600/20",
};
const nomeEmpresa = (empresa) => empresa?.nomeFantasia || empresa?.razaoSocial;
const documento = (valor, tipo = "CPF") =>
  !valor
    ? "—"
    : tipo === "CPF"
      ? valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
      : valor.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
function data(valor, comHora = false) {
  if (!valor) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    ...(comHora ? { timeStyle: "short" } : {}),
    timeZone: comHora ? "America/Sao_Paulo" : "UTC",
  }).format(new Date(valor));
}

export default function StudentDetails({ alunoId, onClose, onEdit }) {
  const dialogoRef = useRef(null);
  const controladorRef = useRef(null);
  const montadoRef = useRef(false);
  const fechamentoRef = useRef(null);
  const tituloId = useId();
  const [aluno, setAluno] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(null);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [contratoSalvo, setContratoSalvo] = useState(null);
  const [fechando, setFechando] = useState(false);
  const carregar = useCallback(async () => {
    controladorRef.current?.abort();
    const controlador = new AbortController();
    controladorRef.current = controlador;
    setCarregando(true);
    setErro("");
    setMensagem("");
    setContratoSalvo(null);
    try {
      const resposta = await apiClient.get("/admin/alunos/" + alunoId, {
        signal: controlador.signal,
      });
      if (!controlador.signal.aborted) setAluno(resposta.data.aluno);
    } catch (erroCapturado) {
      if (!controlador.signal.aborted)
        setErro(
          erroCapturado.response?.data?.mensagem ||
            "Não foi possível carregar os detalhes.",
        );
    } finally {
      if (!controlador.signal.aborted) setCarregando(false);
    }
  }, [alunoId]);
  useEffect(() => {
    montadoRef.current = true;
    const dialogo = dialogoRef.current;
    const focoAnterior = document.activeElement;
    const rolagemAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogo.showModal();
    carregar();
    return () => {
      montadoRef.current = false;
      controladorRef.current?.abort();
      window.clearTimeout(fechamentoRef.current);
      dialogo.close();
      document.body.style.overflow = rolagemAnterior;
      const focoRetorno = focoAnterior?.isConnected
        ? focoAnterior
        : [...document.querySelectorAll("button[data-detalhes]")].find(
            (botao) => botao.dataset.alunoId === alunoId,
          );
      focoRetorno?.focus();
    };
  }, [carregar, alunoId]);
  function fechar(acao = onClose) {
    if (salvando || fechando) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      acao();
      return;
    }
    setFechando(true);
    fechamentoRef.current = window.setTimeout(acao, 180);
  }
  async function salvarContrato(matricula, confirmado) {
    if (salvando || carregando || fechando) return;
    setSalvando(matricula.id);
    setErro("");
    setMensagem("");
    setContratoSalvo(null);
    try {
      const resposta = await apiClient.patch(
        `/admin/alunos/${alunoId}/contrato`,
        {
          matriculaId: matricula.id,
          confirmado,
          versao: matricula.atualizadoEm,
        },
      );
      if (!montadoRef.current) return;
      setAluno((anterior) => ({
        ...anterior,
        matriculas: anterior.matriculas.map((m) =>
          m.id === matricula.id ? { ...m, ...resposta.data.matricula } : m,
        ),
      }));
      setMensagem(
        `Contrato de ${matricula.turma.codigo}: ${confirmado ? "Sim" : "Não"}. Confirmação salva.`,
      );
      setContratoSalvo(matricula.id);
      window.dispatchEvent(new Event("alunos:sincronizados"));
    } catch (erroCapturado) {
      if (montadoRef.current)
        setErro(
          erroCapturado.response?.data?.mensagem ||
            "Não foi possível salvar a confirmação.",
        );
    } finally {
      if (montadoRef.current) setSalvando(null);
    }
  }
  const empresa = aluno?.empresa;
  const situacao = rotulosStatus[aluno?.statusIndicacao];
  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby={tituloId}
      onCancel={(evento) => {
        evento.preventDefault();
        fechar();
      }}
      onClick={(evento) => {
        if (evento.target !== evento.currentTarget || salvando) return;
        const caixa = evento.currentTarget.getBoundingClientRect();
        if (
          evento.clientX < caixa.left ||
          evento.clientX > caixa.right ||
          evento.clientY < caixa.top ||
          evento.clientY > caixa.bottom
        )
          fechar();
      }}
      data-fechando={fechando || undefined}
      className="student-details fixed m-0 overflow-hidden border-0 p-0 text-gray-900"
    >
      <header className="z-10 flex shrink-0 items-center justify-between gap-4 border-b border-gray-200/70 border-t-[3px] border-t-[#0a3d7c] bg-white/80 px-5 py-5 backdrop-blur-xl sm:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg font-semibold text-[#0a3d7c]"
            aria-hidden="true"
          >
            {aluno?.nome
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((n) => n[0])
              .join("")
              .toUpperCase() || <UserRound className="h-6 w-6" />}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#0a3d7c]">
              Cadastro do aluno
            </p>
            <h2
              id={tituloId}
              className="break-words text-lg font-semibold text-gray-900 sm:text-xl"
            >
              {aluno?.nome || "Detalhes do aluno"}
            </h2>
            {aluno && (
              <p
                className="mt-1 truncate text-xs text-gray-600"
                title={`${aluno.curso} · ${aluno.turma}`}
              >
                {aluno.curso} · {aluno.turma}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          aria-label="Fechar detalhes do aluno"
          onClick={() => fechar()}
          disabled={Boolean(salvando) || fechando}
          className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40"
        >
          <X className="h-5 w-5" />
        </button>
      </header>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-6 sm:px-7">
        {erro && (
          <div role="alert" className={dashboardStyles.error}>
            {erro}
          </div>
        )}
        {mensagem && (
          <p
            role="status"
            className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            {mensagem}
          </p>
        )}
        {carregando ? (
          <div role="status" aria-live="polite">
            <span className="sr-only">Carregando cadastro…</span>
            <div
              aria-hidden="true"
              className="space-y-7 animate-pulse motion-reduce:animate-none"
            >
              <div className="space-y-3 rounded-xl bg-blue-50/80 p-5">
                <div className="h-3 w-36 rounded bg-blue-100" />
                <div className="h-6 w-24 rounded-full bg-blue-100" />
                <div className="h-4 w-3/4 rounded bg-blue-100" />
              </div>
              {[0, 1, 2].map((secao) => (
                <div
                  key={secao}
                  className="space-y-4 border-b border-gray-200/70 pb-7"
                >
                  <div className="h-4 w-40 rounded bg-gray-200/80" />
                  <div className="grid grid-cols-2 gap-5">
                    {[0, 1, 2, 3].map((campo) => (
                      <div key={campo} className="space-y-2">
                        <div className="h-3 w-16 rounded bg-gray-200/70" />
                        <div className="h-4 w-4/5 rounded bg-gray-200/80" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          aluno && (
            <>
              <section
                className="rounded-xl border border-blue-100/80 bg-blue-50/80 p-4 sm:p-5"
                aria-label="Situação profissional"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="mb-2 text-xs font-medium text-gray-500">
                      Situação profissional atual
                    </p>
                    <Situacao valor={aluno.statusIndicacao} />
                  </div>
                  {onEdit && (
                    <button
                      type="button"
                      className={dashboardStyles.secondaryAction}
                      disabled={Boolean(salvando) || fechando}
                      onClick={() => fechar(onEdit)}
                    >
                      <Pencil className="h-4 w-4" />
                      Editar cadastro
                    </button>
                  )}
                </div>
                <p className="mt-3 text-sm font-medium text-gray-800">
                  {situacao === "Disponível"
                    ? "Disponível para indicação a uma empresa."
                    : `${situacao === "Empregado" ? "Empregado em" : situacao === "Em processo" ? "Em processo de aceite por" : "Indicado para"} ${nomeEmpresa(empresa) || "empresa não informada"}.`}
                </p>
              </section>
              <div className="space-y-6">
                <Secao titulo="Dados pessoais" Icone={UserRound}>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                    <Dado rotulo="CPF" valor={documento(aluno.cpf)} />
                    <Dado
                      rotulo="Nascimento"
                      valor={`${data(aluno.dataNascimento)}${aluno.idade != null ? ` · ${aluno.idade} anos` : ""}`}
                    />
                    <Dado rotulo="Gênero" valor={aluno.genero} />
                    <Dado rotulo="Celular" valor={aluno.celular} />
                    <Dado rotulo="Telefone" valor={aluno.telefone} />
                    <Dado rotulo="E-mail" valor={aluno.email} amplo />
                    <Dado rotulo="Endereço" valor={aluno.endereco} amplo />
                    <Dado rotulo="CEP" valor={aluno.cep} />
                  </dl>
                </Secao>
                <Secao titulo="Empresa vinculada" Icone={Building2}>
                  {empresa ? (
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                      <Dado rotulo="Nome" valor={nomeEmpresa(empresa)} />
                      <Dado
                        rotulo="CNPJ"
                        valor={documento(empresa.cnpj, "CNPJ")}
                      />
                      <Dado
                        rotulo="Razão social"
                        valor={empresa.razaoSocial}
                        amplo
                      />
                      <Dado
                        rotulo="Situação cadastral"
                        valor={empresa.ativa ? "Ativa" : "Inativa"}
                      />
                      <Dado rotulo="E-mail" valor={empresa.email} amplo />
                      <Dado rotulo="Telefone" valor={empresa.telefone} />
                    </dl>
                  ) : (
                    <Vazio>
                      Este aluno não possui empresa vinculada no momento.
                    </Vazio>
                  )}
                </Secao>
              </div>
              <Secao titulo="Formação e matrículas" Icone={GraduationCap}>
                {aluno.matriculas.length ? (
                  <div className="space-y-3">
                    {aluno.matriculas.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-xl border border-gray-200/80 bg-white/65 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-gray-900">
                            {m.turma.curso.nome}
                          </h4>
                          {m.id === aluno.matriculaAtualId && (
                            <span className="rounded bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
                              Na tabela
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {m.turma.curso.tipoCurso} · {m.turma.codigo} ·{" "}
                          {m.turma.turno}
                        </p>
                        <p className="mt-2 text-sm text-gray-700">
                          {m.termoAtual}º termo de{" "}
                          {m.turma.quantidadeTermos || "—"} ·{" "}
                          {data(m.turma.dataInicio)} a {data(m.turma.dataFim)}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Situacao valor={m.status} />
                          {m.empresaAtual && (
                            <span className="text-xs text-gray-600">
                              {nomeEmpresa(m.empresaAtual)}
                            </span>
                          )}
                        </div>
                        {m.status === "CONTRATADO" && m.empresaAtual && (
                          <div className="mt-4 border-t border-gray-100 pt-4">
                            <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-medium text-gray-700">
                              <span className="flex items-center gap-2">
                                <FileCheck2 className="h-4 w-4 text-[#0a3d7c]" />
                                Contrato enviado e assinado
                              </span>
                              {onEdit ? (
                                <fieldset
                                  aria-label={`Contrato enviado e assinado — ${m.turma.codigo}`}
                                  disabled={Boolean(salvando) || fechando}
                                  className="flex rounded-lg border border-gray-200 bg-white/90 p-1 disabled:opacity-50"
                                >
                                  {[
                                    { valor: false, rotulo: "Não" },
                                    { valor: true, rotulo: "Sim" },
                                  ].map((opcao) => (
                                    <label
                                      key={opcao.rotulo}
                                      className="relative cursor-pointer"
                                    >
                                      <input
                                        type="radio"
                                        name={`contrato-${m.id}`}
                                        value={opcao.valor ? "sim" : "nao"}
                                        checked={
                                          m.contratoConfirmado === opcao.valor
                                        }
                                        onChange={() =>
                                          salvarContrato(m, opcao.valor)
                                        }
                                        className="peer sr-only"
                                      />
                                      <span className="flex min-h-9 min-w-14 items-center justify-center rounded-md px-3 text-sm font-medium text-gray-600 transition-colors duration-150 peer-checked:bg-[#0a3d7c] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2 peer-disabled:cursor-wait motion-reduce:transition-none">
                                        {opcao.rotulo}
                                      </span>
                                    </label>
                                  ))}
                                </fieldset>
                              ) : (
                                <span>
                                  {m.contratoConfirmado ? "Sim" : "Não"}
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
                              {contratoSalvo === m.id && (
                                <span className="font-medium text-emerald-700">
                                  Salvo ·{" "}
                                </span>
                              )}
                              {salvando === m.id
                                ? "Salvando confirmação…"
                                : m.contratoAtualizadoEm
                                  ? `Atualizado em ${data(m.contratoAtualizadoEm, true)}.`
                                  : "Marque Sim quando a empresa enviar o contrato assinado. Apenas confirmação, sem anexos."}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <Vazio>Nenhuma matrícula registrada.</Vazio>
                )}
              </Secao>
              <div className="space-y-6">
                <Secao titulo="Solicitações vinculadas" Icone={ListChecks}>
                  {aluno.solicitacoes.length ? (
                    <ul className="space-y-3">
                      {aluno.solicitacoes.map((s) => (
                        <li
                          key={s.id}
                          className="rounded-lg border border-gray-200/80 bg-white/65 p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900">
                              {nomeEmpresa(s.empresa)}
                            </p>
                            <span className="text-[11px] text-gray-500">
                              {s.ativa ? "Ativa" : "Inativa"}
                            </span>
                          </div>
                          <p
                            className="mt-1 text-xs text-gray-500"
                            title={s.id}
                          >
                            Solicitação #{s.id.slice(0, 8)}
                          </p>
                          <p className="mt-2 break-words text-sm text-gray-700">
                            {s.pratica}
                          </p>
                          <p className="mt-2 text-xs text-gray-500">
                            {s.quantidadeAlunos} vagas · {data(s.inicio)} a{" "}
                            {data(s.fim)}
                          </p>
                          {s.eventosAcompanhamento[0] && (
                            <div className="mt-3 space-y-1">
                              <Situacao
                                valor={s.eventosAcompanhamento[0].novoStatus}
                              />
                              <p className="text-[11px] text-gray-500">
                                Último vínculo registrado em{" "}
                                {data(
                                  s.eventosAcompanhamento[0].registradoEm,
                                  true,
                                )}
                                .
                              </p>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Vazio>
                      Nenhuma solicitação vinculada a este aluno foi registrada
                      no sistema.
                    </Vazio>
                  )}
                  {aluno.totalSolicitacoes > aluno.solicitacoes.length && (
                    <p className="mt-3 text-xs text-gray-500">
                      Exibindo as {aluno.solicitacoes.length} solicitações mais
                      recentes de {aluno.totalSolicitacoes}.
                    </p>
                  )}
                </Secao>
                <Secao titulo="Histórico de acompanhamento" Icone={History}>
                  {aluno.historico.length ? (
                    <ol className="space-y-5">
                      {aluno.historico.map((h) => (
                        <li
                          key={h.id}
                          className="relative ml-1 border-l-2 border-blue-100 pl-4"
                        >
                          <span
                            aria-hidden="true"
                            className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-[#0a3d7c] ring-4 ring-slate-50"
                          />
                          <p className="text-xs text-gray-500">
                            {data(h.registradoEm, true)} ·{" "}
                            {h.matricula.turma.codigo}
                          </p>
                          <p className="mt-1 text-sm font-medium text-gray-800">
                            {h.tipo === "CARGA_INICIAL"
                              ? "Cadastro inicial"
                              : "Situação atualizada"}
                          </p>
                          {(h.statusAnterior || h.novoStatus) && (
                            <p className="mt-1 text-xs text-gray-700">
                              {h.statusAnterior
                                ? `${rotulosStatus[h.statusAnterior]} → `
                                : ""}
                              {rotulosStatus[h.novoStatus]}
                            </p>
                          )}
                          {h.empresa && (
                            <p className="mt-1 text-xs text-gray-600">
                              {nomeEmpresa(h.empresa)}
                            </p>
                          )}
                          {h.solicitacaoId && (
                            <p
                              className="mt-1 text-[11px] text-gray-500"
                              title={h.solicitacaoId}
                            >
                              Solicitação #{h.solicitacaoId.slice(0, 8)}
                            </p>
                          )}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <Vazio>Nenhum evento de acompanhamento registrado.</Vazio>
                  )}
                  {aluno.totalHistorico > aluno.historico.length && (
                    <p className="mt-3 text-xs text-gray-500">
                      Exibindo os {aluno.historico.length} eventos mais recentes
                      de {aluno.totalHistorico}.
                    </p>
                  )}
                </Secao>
              </div>
              <p className="text-[11px] text-gray-400">
                Cadastro em {data(aluno.dataCadastro, true)} · Última
                sincronização em {data(aluno.ultimaSincronizacao, true)}
              </p>
            </>
          )
        )}
      </div>
      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-200/70 bg-white/80 px-5 py-4 backdrop-blur-xl sm:px-7">
        <button
          type="button"
          className={dashboardStyles.secondaryAction}
          onClick={carregar}
          disabled={carregando || Boolean(salvando) || fechando}
        >
          <RefreshCw className="h-4 w-4" />
          Recarregar detalhes
        </button>
        <button
          type="button"
          className={dashboardStyles.primaryAction}
          onClick={() => fechar()}
          disabled={Boolean(salvando) || fechando}
        >
          Fechar
        </button>
      </footer>
      <style jsx>{`
        .student-details {
          inset: 0 0 0 auto;
          width: min(48vw, 680px);
          min-width: 560px;
          max-width: 100vw;
          height: 100vh;
          height: 100dvh;
          max-height: 100dvh;
          flex-direction: column;
          border-left: 1px solid rgba(255, 255, 255, 0.9);
          border-radius: 24px 0 0 24px;
          background: #f8fafc;
          box-shadow: -16px 0 60px rgba(15, 23, 42, 0.16);
        }
        @supports (
          (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))
        ) {
          .student-details {
            background: rgba(248, 250, 252, 0.92);
            backdrop-filter: blur(32px) saturate(115%);
            -webkit-backdrop-filter: blur(32px) saturate(115%);
          }
        }
        .student-details[open] {
          display: flex;
          animation: details-enter 220ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .student-details::backdrop {
          background: rgba(15, 23, 42, 0.22);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          animation: backdrop-enter 220ms ease-out both;
        }
        .student-details[data-fechando] {
          pointer-events: none;
          animation: details-exit 180ms ease-in both;
        }
        .student-details[data-fechando]::backdrop {
          animation: backdrop-exit 180ms ease-in both;
        }
        @keyframes details-enter {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes details-exit {
          to {
            transform: translateX(100%);
          }
        }
        @keyframes backdrop-enter {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes backdrop-exit {
          to {
            opacity: 0;
          }
        }
        @media (max-width: 767px) {
          .student-details {
            width: 100%;
            min-width: 0;
            border-left: 0;
            border-radius: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .student-details[open],
          .student-details::backdrop,
          .student-details[data-fechando],
          .student-details[data-fechando]::backdrop {
            animation: none;
          }
        }
      `}</style>
    </dialog>
  );
}

function Situacao({ valor }) {
  const rotulo = rotulosStatus[valor];
  return rotulo ? (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${coresStatus[rotulo]}`}
    >
      {rotulo}
    </span>
  ) : null;
}
function Secao({ titulo, Icone, children }) {
  return (
    <section className="min-w-0 rounded-xl border border-gray-200 p-4 sm:p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
        <Icone className="h-4 w-4 shrink-0 text-[#0a3d7c]" />
        {titulo}
      </h3>
      {children}
    </section>
  );
}
function Dado({ rotulo, valor, amplo = false }) {
  return (
    <div className={`min-w-0 ${amplo ? "col-span-2" : ""}`}>
      <dt className="mb-1 text-xs text-gray-500">{rotulo}</dt>
      <dd className="break-words text-sm text-gray-800">{valor || "—"}</dd>
    </div>
  );
}
function Vazio({ children }) {
  return (
    <p className="rounded-lg bg-gray-50 p-3 text-sm leading-relaxed text-gray-500">
      {children}
    </p>
  );
}
