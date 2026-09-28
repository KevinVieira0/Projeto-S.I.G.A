// Padrão visual compartilhado apenas pelos componentes da Visão Geral.
// As larguras dos cards continuam definidas na página do dashboard.
export const dashboardStyles = {
  surface: "group relative flex min-w-0 flex-col rounded-2xl border border-gray-200 border-t-[3px] border-t-[#0a3d7c] bg-white shadow-sm duration-300 hover:shadow-xl hover:shadow-blue-950/10 motion-reduce:transition-none",
  header: "flex min-h-[85px] flex-col gap-4 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
  eyebrow: "text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0a3d7c]",
  title: "mt-1 text-lg font-semibold text-gray-900",
  description: "mt-1 text-sm text-gray-500",
  body: "min-w-0 px-5 py-5",
  footer: "mt-auto flex min-h-12 flex-wrap items-center gap-3 rounded-b-2xl border-t border-gray-100 bg-gray-50/80 px-5 py-3 text-xs text-gray-500",
  primaryAction: "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#0a3d7c] bg-[#0a3d7c] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#125198] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none",
  secondaryAction: "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
  error: "rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700",
};

export default function DashboardCard({ children, className = "", lift = false, ...props }) {
  return (
    <section
      {...props}
      className={`${dashboardStyles.surface} ${lift ? "transition hover:-translate-y-0.5 motion-reduce:transform-none" : "transition-shadow"} ${className}`}
    >
      {children}
    </section>
  );
}

export function DashboardCardHeader({ title, headingId, eyebrow, description, icon: Icon, children }) {
  return (
    <header className={dashboardStyles.header}>
      <div className="min-w-0">
        {eyebrow && <p className={dashboardStyles.eyebrow}>{eyebrow}</p>}
        <h2 id={headingId} className={dashboardStyles.title}>{title}</h2>
        {description && <p className={dashboardStyles.description}>{description}</p>}
      </div>
      {(Icon || children) && (
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {children}
          {Icon && <Icon className="h-5 w-5 shrink-0 text-[#0a3d7c] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 motion-reduce:transform-none motion-reduce:transition-none" aria-hidden="true" />}
        </div>
      )}
    </header>
  );
}

export function DashboardCardFooter({ children, className = "", ...props }) {
  return <footer {...props} className={`${dashboardStyles.footer} ${className}`}>{children}</footer>;
}
