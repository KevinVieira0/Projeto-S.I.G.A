"use client";

import { useEffect, useId, useState } from "react";
import { BarChart3, GraduationCap, RefreshCw } from "lucide-react";
import { buscarAlunosPorCurso } from "@/lib/api/dashboardService";

const numero = (valor) => valor.toLocaleString("pt-BR");

export default function StudentsByCourseCard() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [versao, setVersao] = useState(0);
  const headingId = useId();

  useEffect(() => {
    const controller = new AbortController();
    setCarregando(true);
    setErro("");

    buscarAlunosPorCurso({ signal: controller.signal })
      .then((resposta) => { if (!controller.signal.aborted) setDados(resposta); })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setErro(error.response?.data?.mensagem || "Não foi possível carregar os alunos por curso.");
        }
      })
      .finally(() => { if (!controller.signal.aborted) setCarregando(false); });

    return () => controller.abort();
  }, [versao]);

  useEffect(() => {
    const atualizar = () => setVersao((atual) => atual + 1);
    window.addEventListener("alunos:sincronizados", atualizar);
    return () => window.removeEventListener("alunos:sincronizados", atualizar);
  }, []);

  return (
    <section aria-labelledby={headingId} className="group/course flex min-w-0 flex-col rounded-2xl border border-gray-200 border-t-[3px] border-t-[#0a3d7c] bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-950/10 motion-reduce:transform-none motion-reduce:transition-none">
      <header className="flex min-h-[85px] items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0a3d7c]">Distribuição de alunos</p>
          <h2 id={headingId} className="mt-1 text-lg font-semibold text-gray-900">Alunos por curso</h2>
        </div>
        <BarChart3 className="h-5 w-5 shrink-0 text-[#0a3d7c] transition-transform duration-300 group-hover/course:-rotate-6 group-hover/course:scale-110 motion-reduce:transform-none motion-reduce:transition-none" aria-hidden="true" />
      </header>

      <div className="flex flex-1 flex-col px-4 py-4 sm:px-5" aria-busy={carregando}>
        {carregando ? (
          <div role="status" className="flex min-h-[216px] items-center justify-center gap-2 text-sm text-gray-500">
            <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            Carregando cursos…
          </div>
        ) : erro ? (
          <div className="flex min-h-[216px] flex-col items-center justify-center text-center">
            <p role="alert" className="text-sm text-gray-600">{erro}</p>
            <button type="button" onClick={() => setVersao((atual) => atual + 1)} className="mt-3 min-h-11 rounded-lg px-3 text-sm font-semibold text-[#0a3d7c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500">Tentar novamente</button>
          </div>
        ) : !dados?.cursos.length ? (
          <div role="status" className="flex min-h-[216px] flex-col items-center justify-center text-center">
            <GraduationCap className="h-8 w-8 text-gray-400" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-gray-700">Nenhum aluno cadastrado</p>
            <p className="mt-1 text-xs text-gray-500">Os cursos aparecerão após a sincronização dos alunos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto py-1"><CourseChart cursos={dados.cursos} /></div>
        )}
      </div>

      <footer className="flex min-h-12 flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-b-2xl border-t border-gray-100 bg-gray-50/80 px-5 py-3 text-[11px] text-gray-500">
        <span>{!carregando && !erro && dados ? `${dados.cursos.length} de ${numero(dados.totalCursos)} cursos · maiores totais` : "Cursos com mais alunos"}</span>
        <span>Todos os cadastros</span>
      </footer>
    </section>
  );
}

function CourseChart({ cursos }) {
  const [ativo, setAtivo] = useState(null);
  const tooltipId = useId();
  const passo = Math.max(1, Math.ceil(Math.max(...cursos.map((curso) => curso.total)) / 4));
  const teto = passo * 4;
  const selecionado = ativo === null ? null : cursos[ativo];

  return (
    <div className="relative min-h-[216px] min-w-[280px]">
      <p className="mb-2 text-[11px] text-gray-500">Alunos</p>
      <div className="relative pl-9">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32" aria-hidden="true">
          {[4, 3, 2, 1, 0].map((nivel) => (
            <div key={nivel} className="absolute inset-x-0 flex items-center" style={{ top: `${(4 - nivel) * 25}%` }}>
              <span className="w-9 shrink-0 -translate-y-1/2 pr-2 text-right text-[10px] tabular-nums text-gray-400">{numero(nivel * passo)}</span>
              <span className="w-full border-t border-gray-100" />
            </div>
          ))}
        </div>

        <div className="relative grid gap-2" style={{ gridTemplateColumns: `repeat(${cursos.length}, minmax(0, 1fr))` }}>
          {cursos.map((curso, index) => (
            <button
              key={curso.curso}
              type="button"
              aria-label={`${curso.curso}: ${numero(curso.total)} alunos. Ver divisão por turno.`}
              aria-describedby={ativo === index ? tooltipId : undefined}
              onPointerEnter={(event) => { if (event.pointerType === "mouse") setAtivo(index); }}
              onPointerLeave={(event) => { if (document.activeElement !== event.currentTarget) setAtivo(null); }}
              onFocus={() => setAtivo(index)}
              onBlur={() => setAtivo(null)}
              onClick={() => setAtivo(index)}
              onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); setAtivo(null); } }}
              className="group min-w-0 rounded-md text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              <span className="flex h-32 items-end justify-center rounded-t-md transition-colors group-hover:bg-blue-50/60 group-focus-visible:bg-blue-50/60 motion-reduce:transition-none">
                <span className={`course-bar block w-7 max-w-[65%] rounded-t-md transition-colors duration-200 motion-reduce:transition-none ${ativo === index ? "bg-[#0a3d7c]" : "bg-[#3678c7]"}`} style={{ height: `${curso.total / teto * 100}%`, animationDelay: `${index * 60}ms` }} />
              </span>
              <span className="mt-3 block h-9 text-[11px] leading-[18px] text-gray-600"><span className="line-clamp-2 break-words">{curso.curso}</span></span>
            </button>
          ))}
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-gray-400">Cursos</p>

      {selecionado && (
        <div
          key={selecionado.curso}
          id={tooltipId}
          role="tooltip"
          className="course-tooltip pointer-events-none absolute top-0 z-20 w-56 max-w-full rounded-xl border border-gray-200 bg-white p-3 shadow-xl shadow-blue-950/10"
          style={{ left: `max(0px, min(calc(${((ativo + 0.5) / cursos.length) * 100}% - 112px), calc(100% - 224px)))` }}
        >
          <p className="break-words text-xs font-semibold text-gray-900">{selecionado.curso}</p>
          <div className="mt-2 flex items-center justify-between gap-3 border-b border-gray-100 pb-2 text-xs">
            <span className="text-gray-500">Total de alunos</span><strong className="tabular-nums text-[#0a3d7c]">{numero(selecionado.total)}</strong>
          </div>
          <dl className="mt-2 space-y-1.5">
            {selecionado.turnos.map(({ turno, total }) => (
              <div key={turno} className="flex justify-between gap-3 text-xs"><dt className="break-words text-gray-500">{turno}</dt><dd className="shrink-0 font-medium tabular-nums text-gray-800">{numero(total)}</dd></div>
            ))}
          </dl>
        </div>
      )}
      <style jsx>{`
        .course-bar {
          transform-origin: bottom;
          animation: course-bar-grow 550ms cubic-bezier(.22, 1, .36, 1) both;
        }
        .course-tooltip {
          animation: course-tooltip-enter 160ms ease-out both;
        }
        @keyframes course-bar-grow {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        @keyframes course-tooltip-enter {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .course-bar, .course-tooltip { animation: none; }
        }
      `}</style>
    </div>
  );
}
