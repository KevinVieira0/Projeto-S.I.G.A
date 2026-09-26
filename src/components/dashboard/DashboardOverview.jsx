"use client";

import { Building2, GraduationCap } from "lucide-react";
import { useRef, useState } from "react";

const VIEWS = [
  { id: "alunos", label: "Alunos", icon: GraduationCap },
  { id: "empresas", label: "Empresas", icon: Building2 },
];

export default function DashboardOverview({ children }) {
  const [view, setView] = useState("alunos");
  const tabRefs = useRef([]);

  function handleKeyDown(event, index) {
    let nextIndex;

    if (event.key === "ArrowRight") nextIndex = (index + 1) % VIEWS.length;
    else if (event.key === "ArrowLeft") {
      nextIndex = (index + VIEWS.length - 1) % VIEWS.length;
    } else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = VIEWS.length - 1;
    else return;

    event.preventDefault();
    setView(VIEWS[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <div className="p-5 sm:p-8">
      <header className="grid items-center gap-5 lg:grid-cols-[1fr_auto_1fr]">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
          <p className="mt-1 text-sm text-gray-500">
            Acompanhe os principais dados de alunos, empresas e solicitações.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Visão geral de alunos ou empresas"
          className="relative isolate mx-auto grid w-full max-w-[280px] grid-cols-2 rounded-full bg-gray-100 p-1"
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-1 left-1 -z-10 w-[calc(50%-4px)] rounded-full bg-[#0a3d7c] shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none ${
              view === "empresas" ? "translate-x-full" : "translate-x-0"
            }`}
          />
          {VIEWS.map(({ id, label, icon: Icon }, index) => (
            <button
              key={id}
              ref={(element) => { tabRefs.current[index] = element; }}
              id={`overview-${id}-tab`}
              type="button"
              role="tab"
              aria-selected={view === id}
              aria-controls={`overview-${id}-panel`}
              tabIndex={view === id ? 0 : -1}
              onClick={() => setView(id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 motion-reduce:transition-none ${
                view === id ? "text-white" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Keep the student view mounted so filters and pagination survive switching. */}
      <section
        id="overview-alunos-panel"
        role="tabpanel"
        aria-labelledby="overview-alunos-tab"
        hidden={view !== "alunos"}
        className="overview-panel mt-6"
      >
        {children}
      </section>

      <section
        id="overview-empresas-panel"
        role="tabpanel"
        aria-labelledby="overview-empresas-tab"
        hidden={view !== "empresas"}
        className="overview-panel mt-6"
      >
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
          <Building2 className="h-8 w-8 text-[#0a3d7c]" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            Visão geral das empresas
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Os indicadores desta visão serão disponibilizados em breve.
          </p>
        </div>
      </section>

      <style jsx>{`
        .overview-panel:not([hidden]) {
          animation: overview-enter 200ms ease-out;
        }

        @keyframes overview-enter {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .overview-panel:not([hidden]) { animation: none; }
        }
      `}</style>
    </div>
  );
}
