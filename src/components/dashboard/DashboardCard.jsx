import React from "react";

export const dashboardStyles = {
  surface: "siga-card siga-card-admin group relative flex min-w-0 flex-col",
  header:
    "siga-cabecalho-card flex flex-col gap-3 rounded-t-[calc(var(--siga-raio-card)-1px)] border-b border-slate-200/80 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5",
  eyebrow:
    "text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0a3d7c]",
  title: "mt-1 text-lg font-semibold text-gray-900",
  description: "mt-1 text-sm text-gray-500",
  body: "min-w-0 px-4 py-4 sm:px-5",
  footer:
    "siga-rodape-card mt-auto flex flex-wrap items-center gap-2 rounded-b-[calc(var(--siga-raio-card)-1px)] border-t border-slate-200/80 px-4 py-2.5 text-xs text-gray-600 sm:px-5",
  primaryAction:
    "siga-acao siga-acao-primaria inline-flex min-h-10 max-w-full items-center justify-center gap-2 rounded-lg border border-[#0a3d7c] bg-[#0a3d7c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#125198] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
  secondaryAction:
    "siga-acao siga-controle inline-flex min-h-10 max-w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#174777] hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  searchField:
    "siga-controle siga-acao h-10 w-full rounded-lg pl-9 pr-9 text-sm text-gray-900 outline-none placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-100",
  pageAction:
    "siga-controle siga-acao inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-[#0a3d7c] focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-40",
  error:
    "rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700",
};

export default function DashboardCard({
  children,
  className = "",
  lift = false,
  ...props
}) {
  return (
    <section
      {...props}
      className={`${dashboardStyles.surface} ${lift ? "siga-card-interativo" : ""} ${className}`}
    >
      {children}
    </section>
  );
}

export function DashboardCardHeader({
  title: titulo,
  headingId: idTitulo,
  eyebrow: categoria,
  description: descricao,
  icon: Icon,
  className = "",
  children,
}) {
  return (
    <header className={`${dashboardStyles.header} ${className}`}>
      <div className="min-w-0">
        {categoria && <p className={dashboardStyles.eyebrow}>{categoria}</p>}
        <h2 id={idTitulo} className={dashboardStyles.title}>
          {titulo}
        </h2>
        {descricao && (
          <p className={dashboardStyles.description}>{descricao}</p>
        )}
      </div>
      {(Icon || children) && (
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {children}
          {Icon && (
            <Icon
              className="h-5 w-5 shrink-0 text-[#0a3d7c]"
              aria-hidden="true"
            />
          )}
        </div>
      )}
    </header>
  );
}

export function DashboardCardFooter({ children, className = "", ...props }) {
  return (
    <footer {...props} className={`${dashboardStyles.footer} ${className}`}>
      {children}
    </footer>
  );
}
