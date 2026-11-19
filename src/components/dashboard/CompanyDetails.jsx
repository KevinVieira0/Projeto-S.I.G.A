"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  FileCheck2,
  ListChecks,
  Pencil,
  RefreshCw,
  Users,
} from "lucide-react";
import { apiClient } from "@/lib/api/axiosClient";
import { dashboardStyles } from "./DashboardCard";
import CompanyDrawer from "./CompanyDrawer";

export const formatarCnpj = (valor) =>
  valor?.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") ||
  "—";
const formatarData = (valor, comHora = false) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    ...(comHora ? { timeStyle: "short" } : {}),
    timeZone: comHora ? "America/Sao_Paulo" : "UTC",
  }).format(new Date(valor));

export default function CompanyDetails({ empresaId, onClose, onEdit }) {
  const [empresa, setEmpresa] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [versao, setVersao] = useState(0);
  const recarregar = useCallback(() => setVersao((valor) => valor + 1), []);
  useEffect(() => {
    const controlador = new AbortController();
    setCarregando(true);
    setErro("");
    apiClient
      .get(`/admin/empresas/${empresaId}`, { signal: controlador.signal })
      .then(({ data }) => {
        if (!controlador.signal.aborted) setEmpresa(data.empresa);
      })
      .catch((erroCapturado) => {
        if (!controlador.signal.aborted)
          setErro(
            erroCapturado.response?.data?.mensagem ||
              "Não foi possível carregar os detalhes.",
          );
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCarregando(false);
      });
    return () => controlador.abort();
  }, [empresaId, versao]);
  const resumo = empresa?.resumo;
  return (
    <CompanyDrawer
      empresaId={empresaId}
      titulo={empresa?.razaoSocial || "Detalhes da empresa"}
      nome={empresa?.razaoSocial}
      subtitulo={empresa && formatarCnpj(empresa.cnpj)}
      onClose={onClose}
    >
      {({ fechar, fechando }) => (
        <>
          <div
            aria-busy={carregando}
            className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-6 sm:px-7"
          >
            {erro && (
              <p role="alert" className={dashboardStyles.error}>
                {erro}
              </p>
            )}
            {carregando ? (
              <div role="status">
                <span className="sr-only">Carregando empresa…</span>
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
              !erro &&
              empresa && (
                <>
                  <section
                    aria-label="Situação cadastral"
                    className="rounded-xl border border-blue-100/80 bg-blue-50/80 p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="mb-2 text-xs font-medium text-gray-500">
                          Situação cadastral atual
                        </p>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${empresa.ativa ? "bg-green-50 text-green-700 ring-green-600/20" : "bg-gray-100 text-gray-600 ring-gray-500/20"}`}
                        >
                          {empresa.ativa ? "Ativa" : "Inativa"}
                        </span>
                      </div>
                      <button
                        className={dashboardStyles.secondaryAction}
                        disabled={fechando}
                        onClick={() => fechar(onEdit)}
                      >
                        <Pencil className="h-4 w-4" />
                        Editar cadastro
                      </button>
                    </div>
                    <p className="mt-3 text-sm text-gray-600">
                      {empresa.ativa
                        ? "Empresa beneficiária cadastrada."
                        : "Cadastro inativo. Os vínculos e o histórico são preservados."}
                    </p>
                    <dl className="mt-5 grid grid-cols-2 gap-4">
                      <Dado
                        rotulo="Alunos vinculados"
                        valor={resumo.totalAlunos}
                      />
                      <Dado
                        rotulo="Solicitações ativas"
                        valor={resumo.solicitacoesAtivas}
                      />
                    </dl>
                  </section>
                  <Secao titulo="Dados da empresa" Icone={Building2}>
                    <dl className="grid grid-cols-2 gap-5">
                      <Dado
                        rotulo="Razão social"
                        valor={empresa.razaoSocial}
                        amplo
                      />
                      <Dado
                        rotulo="Nome fantasia"
                        valor={empresa.nomeFantasia}
                        amplo
                      />
                      <Dado rotulo="CNPJ" valor={formatarCnpj(empresa.cnpj)} />
                      <Dado
                        rotulo="Contribuinte"
                        valor={
                          empresa.contribuinte === null
                            ? "Não informado"
                            : empresa.contribuinte
                              ? "Sim"
                              : "Não"
                        }
                      />
                      <Dado rotulo="E-mail" valor={empresa.email} amplo />
                      <Dado rotulo="Telefone" valor={empresa.telefone} />
                    </dl>
                  </Secao>
                  <Secao titulo="Alunos vinculados" Icone={Users}>
                    <dl className="mb-4 grid grid-cols-3 gap-3">
                      <Dado
                        rotulo="Indicados"
                        valor={resumo.alunosPorStatus.Indicado || 0}
                      />
                      <Dado
                        rotulo="Em processo"
                        valor={resumo.alunosPorStatus["Em processo"] || 0}
                      />
                      <Dado
                        rotulo="Empregados"
                        valor={resumo.alunosPorStatus.Contratado || 0}
                      />
                    </dl>
                    {empresa.alunos.length ? (
                      <ul className="divide-y divide-gray-200/70">
                        {empresa.alunos.map((aluno) => (
                          <li key={aluno.id} className="py-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="break-words text-sm font-medium">
                                {aluno.nome}
                              </p>
                              <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-[#0a3d7c]">
                                {aluno.statusIndicacao === "Contratado"
                                  ? "Empregado"
                                  : aluno.statusIndicacao}
                              </span>
                            </div>
                            <p className="mt-1 break-words text-xs text-gray-500">
                              {aluno.curso} · {aluno.turma}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Vazio>Nenhum aluno vinculado atualmente.</Vazio>
                    )}
                    {resumo.totalAlunos > empresa.alunos.length && (
                      <p className="mt-3 text-xs text-gray-500">
                        Exibindo {empresa.alunos.length} de {resumo.totalAlunos}{" "}
                        alunos, em ordem alfabética. Consulte os demais na aba
                        Alunos.
                      </p>
                    )}
                  </Secao>
                  <Secao titulo="Confirmação de contratos" Icone={FileCheck2}>
                    <p className="text-sm text-gray-700">
                      <strong className="text-[#0a3d7c]">
                        {resumo.contratosConfirmados}
                      </strong>{" "}
                      de {resumo.matriculasEmpregadas} matrículas empregadas com
                      contrato confirmado.
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-gray-500">
                      Confirmações Sim/Não registradas no cadastro dos alunos.
                      Os arquivos dos contratos ainda não são anexados.
                    </p>
                  </Secao>
                  <Secao titulo="Solicitações registradas" Icone={ListChecks}>
                    {empresa.solicitacoes.length ? (
                      <ul className="space-y-3">
                        {empresa.solicitacoes.map((solicitacao) => (
                          <li
                            key={solicitacao.id}
                            className="min-w-0 rounded-lg border border-gray-200/80 bg-white/60 p-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-medium">
                                {solicitacao.quantidadeVagas}{" "}
                                {solicitacao.quantidadeVagas === 1
                                  ? "aluno solicitado"
                                  : "alunos solicitados"}
                              </p>
                              <span className="text-xs text-gray-500">
                                {solicitacao.ativa ? "Ativa" : "Inativa"}
                              </span>
                            </div>
                            <p className="mt-2 break-words text-sm text-gray-700">
                              {solicitacao.cursos}
                            </p>
                            <p className="mt-1 break-words text-xs text-gray-500">
                              {solicitacao.pratica}
                            </p>
                            <p className="mt-2 text-xs text-gray-500">
                              {formatarData(solicitacao.inicio)} a{" "}
                              {formatarData(solicitacao.fim)}
                            </p>
                            <p
                              className="mt-1 text-[11px] text-gray-400"
                              title={solicitacao.id}
                            >
                              Solicitação #{solicitacao.id.slice(0, 8)} ·{" "}
                              {formatarData(solicitacao.criadoEm, true)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Vazio>Nenhuma solicitação registrada.</Vazio>
                    )}
                    {resumo.totalSolicitacoes > empresa.solicitacoes.length && (
                      <p className="mt-3 text-xs text-gray-500">
                        Exibindo as {empresa.solicitacoes.length} solicitações
                        mais recentes de {resumo.totalSolicitacoes}.
                      </p>
                    )}
                  </Secao>
                  <p className="text-[11px] text-gray-400">
                    Cadastro em {formatarData(empresa.criadoEm, true)} ·
                    Atualizado em {formatarData(empresa.atualizadoEm, true)}
                  </p>
                </>
              )
            )}
          </div>
          <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-gray-200/70 bg-white/80 px-5 py-4 backdrop-blur-xl sm:px-7">
            <button
              className={dashboardStyles.secondaryAction}
              onClick={recarregar}
              disabled={carregando || fechando}
            >
              <RefreshCw className="h-4 w-4" />
              Recarregar detalhes
            </button>
            <button
              className={dashboardStyles.primaryAction}
              onClick={() => fechar()}
              disabled={fechando}
            >
              Fechar
            </button>
          </footer>
        </>
      )}
    </CompanyDrawer>
  );
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
      <dd className="break-words text-sm text-gray-800">{valor ?? "—"}</dd>
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
