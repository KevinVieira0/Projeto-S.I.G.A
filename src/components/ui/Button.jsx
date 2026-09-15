/**
 * Botão padrão do projeto.
 * `color`: "blue" (admin) | "amber" (empresa).
 */
const COLOR_STYLES = {
  blue:
    "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-200",

  orange:
    "bg-orange-600 text-white hover:bg-orange-700 focus-visible:ring-orange-200",

  // Compatibilidade temporária.
  amber:
    "bg-amber-400 text-slate-900 hover:bg-amber-500 focus-visible:ring-amber-200",
};

export default function Button({
  children,
  isLoading,
  disabled = false,
  color = "blue",
  icon,
  className = "",
  ...rest
}) {
  const colorStyle = COLOR_STYLES[color] || COLOR_STYLES.blue;

  return (
    <button
      {...rest}
      disabled={isLoading || disabled}
      aria-busy={isLoading}
      className={`
        flex w-full items-center justify-center gap-2
        rounded-xl px-4 py-3
        text-sm font-semibold
        outline-none transition-colors
        focus-visible:ring-4
        disabled:cursor-not-allowed disabled:opacity-60
        ${colorStyle}
        ${className}
      `}
    >
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          {children}
          {icon}
        </>
      )}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />

      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}