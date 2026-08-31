import { forwardRef } from "react";

/**
 * Input de formulário padrão do projeto.
 * - `icon`: componente de ícone (lucide-react) exibido à esquerda
 * - `rightElement`: nó exibido à direita (ex: botão de mostrar/ocultar senha)
 * - `color`: "blue" | "amber" -> cor da borda/foco
 * - `error`: mensagem vinda do react-hook-form/zod
 */
const FOCUS_STYLES = {
  blue: "border-blue-200 focus:border-blue-400 focus:ring-blue-100",
  amber: "border-amber-200 focus:border-amber-400 focus:ring-amber-100",
};

const Input = forwardRef(function Input(
  {
    label,
    name,
    error,
    icon: Icon,
    rightElement,
    color = "blue",
    className = "",
    ...rest
  },
  ref
) {
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        )}

        <input
          id={name}
          name={name}
          ref={ref}
          className={`w-full rounded-lg border bg-white py-2.5 text-sm text-gray-800 outline-none
            transition focus:ring-4
            ${Icon ? "pl-9" : "pl-3"}
            ${rightElement ? "pr-10" : "pr-3"}
            ${error ? "border-red-400 focus:border-red-400 focus:ring-red-100" : FOCUS_STYLES[color]}
            ${className}`}
          {...rest}
        />

        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
});

export default Input;
