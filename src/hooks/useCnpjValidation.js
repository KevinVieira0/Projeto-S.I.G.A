"use client";

import { useEffect, useRef, useState } from "react";
import { validarCnpjBeneficiaria } from "@/lib/api/cnpjService";
import { isValidCnpjFormat, onlyDigits } from "@/lib/validations/cnpjUtils";

const DEBOUNCE_MS = 500;

/**
 * Recebe o valor atual do campo CNPJ e dispara a checagem na API
 * (com debounce) assim que o formato estiver completo/válido.
 *
 * Retorna:
 *  - status: "idle" | "checking" | "valid" | "invalid" | "error"
 *  - razaoSocial: preenchido quando status === "valid"
 */
export function useCnpjValidation(cnpjValue) {
  const [status, setStatus] = useState("idle");
  const [razaoSocial, setRazaoSocial] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    clearTimeout(timeoutRef.current);
    setRazaoSocial(null);

    const digits = onlyDigits(cnpjValue);

    if (digits.length === 0) {
      setStatus("idle");
      return;
    }

    if (digits.length < 14 || !isValidCnpjFormat(cnpjValue)) {
      setStatus("idle"); // ainda digitando ou formato errado -> não chama a API
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      setStatus("checking");
      try {
        const resultado = await validarCnpjBeneficiaria(cnpjValue);
        if (resultado.beneficiaria) {
          setStatus("valid");
          setRazaoSocial(resultado.razaoSocial);
        } else {
          setStatus("invalid");
        }
      } catch (err) {
        setStatus("error");
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeoutRef.current);
  }, [cnpjValue]);

  return { status, razaoSocial };
}
