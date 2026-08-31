"use client";

import { useEffect, useRef, useState } from "react";
import { validarCnpjBeneficiaria } from "@/lib/api/cnpjService";
import { isValidCnpjFormat, onlyDigits } from "@/lib/validations/cnpjUtils";

const DEBOUNCE_MS = 500;

export function useCnpjValidation(cnpjValue) {
  const [status, setStatus] = useState("idle");
  const timeoutRef = useRef(null);

  useEffect(() => {
    let active = true;
    clearTimeout(timeoutRef.current);

    const digits = onlyDigits(cnpjValue);

    if (digits.length < 14 || !isValidCnpjFormat(cnpjValue)) {
      setStatus("idle");
      return () => {
        active = false;
      };
    }

    timeoutRef.current = setTimeout(async () => {
      setStatus("checking");

      try {
        const resultado = await validarCnpjBeneficiaria(cnpjValue);

        if (active) {
          setStatus(resultado.beneficiaria ? "valid" : "invalid");
        }
      } catch {
        if (active) {
          setStatus("error");
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      active = false;
      clearTimeout(timeoutRef.current);
    };
  }, [cnpjValue]);

  return { status };
}
