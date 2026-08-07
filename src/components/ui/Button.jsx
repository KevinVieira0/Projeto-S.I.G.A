/**
 * Botão padrão do projeto.
 * `color`: "blue" (admin) | "amber" (empresa) - definido explicitamente
 * (em vez de className solta) pra não depender de ordem de classes do Tailwind.
 */
const COLOR_STYLES = {
  blue: "bg-blue-500 text-white hover:bg-blue-600",
  amber: "bg-amber-400 text-gray-900 hover:bg-amber-500",
};

export default function Button({ children, isLoading, color = "blue", icon, className = "", ...rest }) {
  return (
    <button
      disabled={isLoading || rest.disabled}
      className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5
        text-sm font-semibold transition
        disabled:cursor-not-allowed disabled:opacity-60
        ${COLOR_STYLES[color]} ${className}`}
      {...rest}
    >
      {isLoading ? <Spinner /> : (
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
    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
