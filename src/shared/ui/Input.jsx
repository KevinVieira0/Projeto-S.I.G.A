import { forwardRef } from "react";

const ESTILOS_FOCO = {
  blue: "border-blue-200 focus:border-blue-400 focus:ring-blue-100",
  amber: "border-orange-200 focus:border-orange-500 focus:ring-orange-100",
};
const Input = forwardRef(function Input(
  {
    label: rotulo,
    name: nomeCampo,
    error: erroCapturado,
    icon: Icon,
    rightElement,
    color: cor = "blue",
    className = "",
    ...rest
  },
  ref,
) {
  return (
    <div className="mb-4">
      {rotulo && (
        <label
          htmlFor={nomeCampo}
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          {rotulo}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        )}

        <input
          id={nomeCampo}
          name={nomeCampo}
          ref={ref}
          aria-invalid={Boolean(erroCapturado)}
          aria-describedby={erroCapturado ? `${nomeCampo}-error` : undefined}
          className={` w-full rounded-xl border bg-white py-3 pl-10 pr-3.5
            text-sm text-slate-900 outline-none
            transition-colors placeholder:text-slate-400
            focus:ring-4
            ${Icon ? "pl-9" : "pl-3"}
            ${rightElement ? "pr-10" : "pr-3"}
            ${erroCapturado ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ESTILOS_FOCO[cor]}
            ${className}`}
          {...rest}
        />

        {rightElement && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>

      {erroCapturado && (
        <p id={`${nomeCampo}-error`} className="mt-1.5 text-xs text-red-600">
          {erroCapturado}
        </p>
      )}
    </div>
  );
});

export default Input;
