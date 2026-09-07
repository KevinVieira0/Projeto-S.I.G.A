"use client";

import { forwardRef } from "react";
import { Building2 } from "lucide-react";
import { maskCnpj } from "@/lib/validations/cnpjUtils";

const STATUS_MESSAGES = {
  checking: {
    text: "Verificando CNPJ...",
    className: "text-slate-500",
  },

  valid: {
    text: "Empresa beneficiária confirmada.",
    className: "text-green-600",
  },

  invalid: {
    text: "CNPJ não encontrado como beneficiária.",
    className: "text-red-600",
  },

  error: {
    text: "Não foi possível validar agora. Tente novamente.",
    className: "text-red-600",
  },
};

const CnpjInput = forwardRef(function CnpjInput(
  {
    label,
    name,
    error,
    value,
    onChange,
    status,
    ...rest
  },
  ref
) {
  const statusInfo = STATUS_MESSAGES[status];

  return (
    <div className="mb-1">
      {label && (
        <label
          htmlFor={name}
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <input
          id={name}
          name={name}
          ref={ref}
          value={value}
          onChange={(event) =>
            onChange(maskCnpj(event.target.value))
          }
          placeholder="00.000.000/0000-00"
          inputMode="numeric"
          aria-invalid={Boolean(error)}
          className={`
            w-full rounded-xl border bg-white py-3 pl-10 pr-3.5
            text-sm text-slate-900 outline-none
            transition-colors placeholder:text-slate-400
            focus:ring-4
            ${
              error
                ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                : "border-orange-200 focus:border-orange-500 focus:ring-orange-100"
            }
          `}
          {...rest}
        />
      </div>

      {error ? (
        <p className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      ) : (
        <p className="mt-1.5 text-xs text-slate-500">
          Use o CNPJ cadastrado no onboarding da empresa.
        </p>
      )}

      {!error && statusInfo && (
        <p className={`mt-1 text-xs ${statusInfo.className}`}>
          {statusInfo.text}
        </p>
      )}
    </div>
  );
});

export default CnpjInput;