export const cardStyles = {
  surface: "ui-card group relative flex min-w-0 flex-col",
  header:
    "flex min-h-[85px] flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between",
  eyebrow:
    "text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ui-accent)]",
  title: "mt-1 text-base font-semibold text-slate-900 sm:text-lg",
  description: "mt-1 text-sm leading-6 text-slate-500",
  body: "min-w-0 px-5 py-5",
  footer:
    "mt-auto flex min-h-12 flex-wrap items-center gap-3 rounded-b-2xl border-t border-slate-200 bg-slate-50/80 px-5 py-3 text-xs text-slate-500",
  primaryAction: "ui-action",
  secondaryAction: "ui-action ui-action-secondary",
  error:
    "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700",
};
export default function Card({
  children,
  className = "",
  lift = false,
  ...props
}) {
  return (
    <section
      {...props}
      className={
        cardStyles.surface +
        (lift ? " hover:-translate-y-0.5 motion-reduce:transform-none " : " ") +
        className
      }
    >
      {children}
    </section>
  );
}
export function CardHeader({
  title: titulo,
  headingId,
  eyebrow,
  description,
  icon: Icone,
  children,
}) {
  return (
    <header className={cardStyles.header}>
      <div className="min-w-0">
        {eyebrow && <p className={cardStyles.eyebrow}>{eyebrow}</p>}
        <h2 id={headingId} className={cardStyles.title}>
          {titulo}
        </h2>
        {description && <p className={cardStyles.description}>{description}</p>}
      </div>
      {(Icone || children) && (
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {children}
          {Icone && (
            <Icone
              className="h-5 w-5 text-[var(--ui-accent)]"
              aria-hidden="true"
            />
          )}
        </div>
      )}
    </header>
  );
}
export function CardFooter({ children, className = "", ...props }) {
  return (
    <footer {...props} className={cardStyles.footer + " " + className}>
      {children}
    </footer>
  );
}
