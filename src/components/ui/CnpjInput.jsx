"use client";

import { forwardRef } from "react";
import { Building2 } from "lucide-react";
import { maskCnpj } from "@/lib/validations/cnpjUtils";

const MENSAGENS_STATUS = {
  checking: { text: "Verificando CNPJ...", className: "text-slate-500" },
  valid: { text: "Empresa beneficiária confirmada.", className: "text-green-600" },
  invalid: { text: "CNPJ não encontrado como beneficiária.", className: "text-red-600" },
  error: {
    text: "Não foi possível validar agora. Tente novamente.",
    className: "text-red-600",
  },
};
const CnpjInput = forwardRef(function CnpjInput(
  {
    label: rotulo,
    name: nomeCampo,
    error: erroCapturado,
    value: valor,
    onChange,
    status,
    ...rest
  },
  ref,
) {
  const informacaoStatus = MENSAGENS_STATUS[status];
  return (
    <div className="mb-1">
      {rotulo && (
        <label
          htmlFor={nomeCampo}
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          {rotulo}
        </label>
      )}

      <div className="relative">
        <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <input
          id={nomeCampo}
          name={nomeCampo}
          ref={ref}
          value={valor}
          onChange={(evento) => onChange(maskCnpj(evento.target.value))}
          placeholder="00.000.000/0000-00"
          inputMode="numeric"
          aria-invalid={Boolean(erroCapturado)}
          aria-describedby={`${nomeCampo}-help ${nomeCampo}-status`}
          className={`
            w-full rounded-xl border bg-white py-3 pl-10 pr-3.5
            text-sm text-slate-900 outline-none
            transition-colors placeholder:text-slate-400
            focus:ring-4
            ${erroCapturado ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "border-orange-200 focus:border-orange-500 focus:ring-orange-100"}
          `}
          {...rest}
        />
      </div>

      {erroCapturado ? (
        <p id={`${nomeCampo}-help`} className="mt-1.5 text-xs text-red-600">
          {erroCapturado}
        </p>
      ) : (
        <p id={`${nomeCampo}-help`} className="mt-1.5 text-xs text-slate-500">
          Informe o CNPJ cadastrado para sua empresa.
        </p>
      )}

      <p
        id={`${nomeCampo}-status`}
        role="status"
        className={`mt-1 text-xs ${!erroCapturado && informacaoStatus ? informacaoStatus.className : ""}`}
      >
        {!erroCapturado && informacaoStatus ? informacaoStatus.text : ""}
      </p>
    </div>
  );
});

export default CnpjInput;
