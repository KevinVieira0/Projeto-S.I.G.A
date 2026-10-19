"use client";

import { useEffect, useRef, useState } from "react";
import { validarCnpjBeneficiaria } from "@/lib/api/cnpjService";
import { isValidCnpjFormat, onlyDigits } from "@/lib/validations/cnpjUtils";

const DEBOUNCE_MS = 500;

export function useCnpjValidation(valorCnpj) {
  const [status, setStatus] = useState("idle");
  const temporizadorRef = useRef(null);
  useEffect(() => {
    let ativo = true;
    clearTimeout(temporizadorRef.current);
    const digitos = onlyDigits(valorCnpj);
    if (digitos.length < 14 || !isValidCnpjFormat(valorCnpj)) {
      setStatus("idle");
      return () => {
        ativo = false;
      };
    }
    temporizadorRef.current = setTimeout(async () => {
      setStatus("checking");
      try {
        const resultado = await validarCnpjBeneficiaria(valorCnpj);
        if (ativo) {
          setStatus(resultado.beneficiaria ? "valid" : "invalid");
        }
      } catch {
        if (ativo) {
          setStatus("error");
        }
      }
    }, DEBOUNCE_MS);
    return () => {
      ativo = false;
      clearTimeout(temporizadorRef.current);
    };
  }, [valorCnpj]);
  return { status };
}
