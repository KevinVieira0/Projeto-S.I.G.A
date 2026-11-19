"use client";

import { useState } from "react";
import { ChevronRight, Search, Users } from "lucide-react";
import {
  estilosEmpresa,
  SeloParticipacao,
  useDadosEmpresa,
  FalhaEmpresa,
  PaginacaoEmpresa,
} from "./base";
import PainelAlunoEmpresa from "./PainelAlunoEmpresa";

export default function AprendizesEmpresa({ situacao, alterarSituacao }) {
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [selecionado, setSelecionado] = useState(null);
  const { dados, carregando, erro, recarregar } = useDadosEmpresa(
    `/empresas/aprendizes?${new URLSearchParams({ situacao, pagina: String(pagina), busca })}`,
  );
  const filtros = [
    ["todos", "Todos"],
    ["INDICADO", "Indicados"],
    ["EM_PROCESSO", "Em processo"],
    ["CONTRATADO", "Contratados"],
  ];
  return (
    <>
      <section
        className={estilosEmpresa.superficie}
        aria-labelledby="titulo-aprendizes"
      >
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
          <div>
            <h2
              id="titulo-aprendizes"
              data-foco-acompanhamento
              tabIndex={-1}
              className="text-lg font-semibold text-slate-900"
            >
              Aprendizes da empresa
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Consulte os encaminhamentos e acompanhe cada contratação.
            </p>
          </div>
          <span className="rounded-xl bg-orange-50 p-3 text-orange-600">
            <Users className="h-5 w-5" />
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
                aria-pressed={situacao === valor}
                onClick={() => {
                  alterarSituacao(valor);
                  setPagina(1);
                }}
                className={`min-h-9 rounded-lg px-3 text-sm transition-colors ${situacao === valor ? "bg-white font-semibold text-orange-800 shadow-sm" : "text-slate-600 hover:bg-white/70"}`}
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
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
              maxLength={150}
              placeholder="Buscar por nome ou curso"
              className={`${estilosEmpresa.campo} pl-9`}
            />
          </label>
        </div>
        {erro ? (
          <div className="px-5 pb-5">
            <FalhaEmpresa mensagem={erro} tentar={recarregar} />
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="border-y border-slate-200 bg-slate-50 text-xs text-slate-500">
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
              <tbody className="divide-y divide-slate-200">
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
                      className="group hover:bg-orange-50/40"
                    >
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => setSelecionado(aluno)}
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
                      <td className="px-5 py-4 text-slate-600">
                        {aluno.turno}
                      </td>
                      <td className="px-5 py-4">
                        <SeloParticipacao status={aluno.status} />
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          aria-label={`Ver detalhes de ${aluno.nome}`}
                          onClick={() => setSelecionado(aluno)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-orange-100 hover:text-orange-800"
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
          <PaginacaoEmpresa
            pagina={pagina}
            total={dados.total}
            alterar={setPagina}
          />
        )}
      </section>
      {selecionado && (
        <PainelAlunoEmpresa
          selecao={selecionado}
          onClose={() => setSelecionado(null)}
          onChanged={recarregar}
        />
      )}
    </>
  );
}
