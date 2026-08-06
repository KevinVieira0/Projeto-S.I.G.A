"use client";

import { forwardRef } from "react";
import { Building2 } from "lucide-react";
import { maskCnpj } from "@/lib/validations/cnpjUtils";

const STATUS_MESSAGES = {
  checking: { text: "Verificando CNPJ...", className: "text-gray-500" },
  valid: { text: "Empresa beneficiária confirmada.", className: "text-green-600" },
  invalid: { text: "CNPJ não encontrado como beneficiária.", className: "text-red-500" },
  error: { text: "Não foi possível validar agora. Tente novamente.", className: "text-red-500" },
};

/**
 * Input especializado de CNPJ: aplica máscara enquanto digita e mostra
 * o status da validação contra a API (checking/valid/invalid/error),
 * vindo do hook useCnpjValidation.
 */
const CnpjInput = forwardRef(function CnpjInput(
  { label, name, error, value, onChange, status, ...rest },
  ref
) {
  const statusInfo = STATUS_MESSAGES[status];

  return (
    <div className="mb-1">
      {label && (
        <label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div className="relative">
        <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          id={name}
          name={name}
          ref={ref}
          value={value}
          onChange={(e) => onChange(maskCnpj(e.target.value))}
          placeholder="00.000.000/0000-00"
          inputMode="numeric"
          className={`w-full rounded-lg border bg-white py-2.5 pl-9 pr-3 text-sm text-gray-800
            outline-none transition focus:ring-4
            ${error
              ? "border-red-400 focus:border-red-400 focus:ring-red-100"
              : "border-amber-200 focus:border-amber-400 focus:ring-amber-100"}`}
          {...rest}
        />
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {!error && (
        <p className="mt-1 text-xs text-gray-500">
          Use o CNPJ cadastrado no momento do onboarding da empresa.
        </p>
      )}
      {!error && statusInfo && (
        <p className={`mt-1 text-xs ${statusInfo.className}`}>{statusInfo.text}</p>
      )}
    </div>
  );
});

export default CnpjInput;
