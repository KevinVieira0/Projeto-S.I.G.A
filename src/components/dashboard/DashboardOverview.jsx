"use client";

import { Building2, GraduationCap } from "lucide-react";
import { useRef, useState } from "react";
import IndicadoresDaVisao from "./IndicadoresDaVisao";
import { RecortesDaVisao } from "./RecortesDaVisao";

const VISOES = [
  { id: "alunos", label: "Alunos", icon: GraduationCap },
  { id: "empresas", label: "Empresas", icon: Building2 },
];

export default function DashboardOverview({ children, empresas }) {
  const [visao, setVisao] = useState("alunos");
  const [visitouEmpresas, setVisitouEmpresas] = useState(false);
  const abasRef = useRef([]);
  function selecionarVisao(id) {
    if (id === "empresas") setVisitouEmpresas(true);
    setVisao(id);
  }

  function tratarTeclado(evento, indice) {
    let proximoIndice;
    if (evento.key === "ArrowRight")
      proximoIndice = (indice + 1) % VISOES.length;
    else if (evento.key === "ArrowLeft") {
      proximoIndice = (indice + VISOES.length - 1) % VISOES.length;
    } else if (evento.key === "Home") proximoIndice = 0;
    else if (evento.key === "End") proximoIndice = VISOES.length - 1;
    else return;
    evento.preventDefault();
    selecionarVisao(VISOES[proximoIndice].id);
    abasRef.current[proximoIndice]?.focus();
  }
  return (
    <div className="siga-pagina siga-visao-geral">
      <header className="grid items-center gap-4 border-b border-slate-200 pb-5 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[1.75rem]">
            Visão Geral
          </h1>
          <p className="mt-1 text-sm leading-5 text-slate-600">
            Alunos, empresas e acompanhamento das solicitações.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Visão geral de alunos ou empresas"
          className="siga-vidro siga-vidro-elevado relative isolate mx-auto grid w-full max-w-[280px] grid-cols-2 rounded-xl p-1 xl:w-72"
        >
          <span
            aria-hidden="true"
            className={`siga-acao-primaria pointer-events-none absolute inset-y-1 left-1 -z-10 w-[calc(50%-4px)] rounded-lg bg-[#0a3d7c] motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,0.78,0.24,1)] ${visao === "empresas" ? "translate-x-full" : "translate-x-0"}`}
          />
          {VISOES.map(({ id, label: rotulo, icon: Icon }, indice) => (
            <button
              key={id}
              ref={(elemento) => {
                abasRef.current[indice] = elemento;
              }}
              id={`overview-${id}-tab`}
              type="button"
              role="tab"
              aria-selected={visao === id}
              aria-controls={`overview-${id}-panel`}
              tabIndex={visao === id ? 0 : -1}
              onClick={() => selecionarVisao(id)}
              onKeyDown={(evento) => tratarTeclado(evento, indice)}
              className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 motion-reduce:transition-none sm:px-4 ${visao === id ? "text-white" : "text-slate-600 hover:text-slate-950"}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {rotulo}
            </button>
          ))}
        </div>
      </header>

      {/* Mantém filtros e paginação dos alunos ao alternar a visão. */}
      <section
        id="overview-alunos-panel"
        role="tabpanel"
        aria-labelledby="overview-alunos-tab"
        hidden={visao !== "alunos"}
        className="siga-entrada mt-6"
      >
        <RecortesDaVisao visao="alunos">
          <IndicadoresDaVisao visao="alunos" ativo={visao === "alunos"}>
            {children}
          </IndicadoresDaVisao>
        </RecortesDaVisao>
      </section>

      <section
        id="overview-empresas-panel"
        role="tabpanel"
        aria-labelledby="overview-empresas-tab"
        hidden={visao !== "empresas"}
        className="siga-entrada mt-6"
      >
        {visitouEmpresas && (
          <RecortesDaVisao visao="empresas">
            <IndicadoresDaVisao visao="empresas" ativo={visao === "empresas"}>
              {empresas}
            </IndicadoresDaVisao>
          </RecortesDaVisao>
        )}
      </section>
    </div>
  );
}
