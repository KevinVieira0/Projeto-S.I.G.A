"use client";

import { ChevronRight, Search, Users, X } from "lucide-react";
import {
  estilosEmpresa,
  SeloParticipacao,
  useDadosEmpresa,
  FalhaEmpresa,
  PaginacaoEmpresa,
} from "./base";

export default function AprendizesEmpresa({
  situacao,
  alterarSituacao,
  pendencia,
  busca,
  alterarBusca,
  pagina,
  alterarPagina,
  selecionado,
  abrirAluno,
}) {
  const parametros = new URLSearchParams({
    situacao,
    pagina: String(pagina),
    busca,
  });
  if (pendencia) parametros.set("pendencia", pendencia);
  const { dados, carregando, erro, recarregar } = useDadosEmpresa(
    `/empresas/aprendizes?${parametros}`,
  );
  const filtros = [
    ["todos", "Todos"],
    ["INDICADO", "Indicados"],
    ["EM_PROCESSO", "Em processo"],
    ["CONTRATADO", "Contratados"],
  ];
  return (
    <section
      id="lista-aprendizes-empresa"
      className={`${estilosEmpresa.superficie} siga-card-fosco flex flex-col`}
      aria-labelledby="titulo-aprendizes"
    >
      <header className="siga-cabecalho-card flex items-start justify-between gap-3 rounded-t-[calc(var(--siga-raio-card)-1px)] border-b border-slate-200 p-4 sm:gap-4 sm:p-6">
        <div className="min-w-0">
          <h2
            id="titulo-aprendizes"
            data-foco-acompanhamento
            tabIndex={-1}
            className="scroll-mt-24 text-xl font-semibold tracking-tight text-slate-950"
          >
            Aprendizes da empresa
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Consulte os encaminhamentos e acompanhe cada contratação.
          </p>
        </div>
        <span className="shrink-0 rounded-lg bg-orange-50 p-2.5 text-orange-800">
          <Users className="h-5 w-5" aria-hidden="true" />
        </span>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div
          role="group"
          aria-label="Filtrar aprendizes por situação"
          className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1"
        >
          {filtros.map(([valor, rotulo]) => (
            <button
              type="button"
              key={valor}
              aria-pressed={!pendencia && situacao === valor}
              onClick={() => alterarSituacao(valor)}
              className={`siga-acao min-h-9 rounded-lg px-3 text-sm ${!pendencia && situacao === valor ? "bg-white font-semibold text-orange-800 shadow-sm" : "text-slate-600 hover:bg-white/70"}`}
            >
              {rotulo}
            </button>
          ))}
        </div>
        <label className="relative w-full sm:max-w-xs">
          <span className="sr-only">Buscar aprendiz</span>
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            value={busca}
            onChange={(evento) => alterarBusca(evento.target.value)}
            maxLength={150}
            placeholder="Buscar por nome ou curso"
            className={`${estilosEmpresa.campo} pl-9`}
          />
        </label>
        {pendencia && (
          <div className="basis-full">
            <button
              type="button"
              onClick={() => alterarSituacao("todos")}
              aria-label="Limpar filtro de pendência"
              className="siga-acao inline-flex min-h-8 items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-2.5 text-xs font-medium text-orange-900 hover:bg-orange-100 focus-visible:outline-orange-700"
            >
              {pendencia === "APROVADO"
                ? "Comprovante pendente"
                : "Indicação para avaliar"}
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      {erro ? (
        <div className="px-5 pb-5">
          <FalhaEmpresa mensagem={erro} tentar={recarregar} />
        </div>
      ) : (
        <div
          className="siga-moldura-tabela siga-rolagem-tabela mx-5 mb-4"
          role="region"
          aria-label="Tabela de aprendizes da empresa"
          aria-busy={carregando}
          tabIndex={0}
        >
          <table className="siga-tabela w-full min-w-[620px] text-left text-sm">
            <thead className="text-xs">
              <tr>
                {["Aprendiz", "Curso e turma", "Turno", "Situação", ""].map(
                  (coluna, i) => (
                    <th key={i} scope="col" className="px-5 py-3 font-medium">
                      {coluna || <span className="sr-only">Detalhes</span>}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr>
                  <td
                    colSpan={5}
                    role="status"
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    Carregando aprendizes…
                  </td>
                </tr>
              ) : !dados?.aprendizes.length ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    Nenhum aprendiz encontrado para esta situação.
                  </td>
                </tr>
              ) : (
                dados.aprendizes.map((aluno) => (
                  <tr
                    key={aluno.matriculaId}
                    data-registro=""
                    data-selecionado={
                      selecionado?.matriculaId === aluno.matriculaId
                    }
                  >
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => abrirAluno(aluno)}
                        className="text-left font-semibold text-slate-900 outline-none hover:text-orange-700 focus-visible:rounded focus-visible:ring-2 focus-visible:ring-orange-500"
                      >
                        {aluno.nome}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <p className="max-w-xs text-slate-700">{aluno.curso}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {aluno.turma} · {aluno.termo}º termo
                      </p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{aluno.turno}</td>
                    <td className="px-5 py-4">
                      <SeloParticipacao
                        status={aluno.status}
                        rotulo={
                          aluno.status === "APROVADO" ? "Aprovado" : undefined
                        }
                      />
                      {aluno.status === "APROVADO" && (
                        <p className="mt-1 text-xs text-slate-600">
                          Aguardando formalização
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        aria-label={`Ver detalhes de ${aluno.nome}`}
                        onClick={() => abrirAluno(aluno)}
                        className="siga-acao rounded-lg p-2 text-slate-500 hover:bg-orange-100 hover:text-orange-800"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {dados && !erro && (
        <div className="mt-auto">
          <PaginacaoEmpresa
            pagina={pagina}
            total={dados.total}
            alterar={alterarPagina}
          />
        </div>
      )}
    </section>
  );
}
