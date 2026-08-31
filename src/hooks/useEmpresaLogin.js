"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { empresaLoginSchema } from "@/lib/validations/empresaLoginSchema";
import { useCnpjValidation } from "./useCnpjValidation";
import { loginEmpresa } from "@/lib/api/authService";
import { useAuth } from "@/context/AuthContext";

export function useEmpresaLogin() {
  const [apiError, setApiError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const form = useForm({
    resolver: zodResolver(empresaLoginSchema),
    defaultValues: {
      cnpj: "",
      senha: "",
    },
  });

  const cnpjValue = form.watch("cnpj");
  const { status } = useCnpjValidation(cnpjValue);

  const onSubmit = form.handleSubmit(async (values) => {
    setApiError(null);

    if (status !== "valid") {
      setApiError(
        "Confirme um CNPJ de empresa beneficiária válido antes de continuar."
      );
      return;
    }

    setIsLoading(true);

    try {
      const data = await loginEmpresa(values);
      login("empresa", data.usuario);
    } catch (error) {
      setApiError(
        error.response?.data?.mensagem || "CNPJ ou senha inválidos."
      );
    } finally {
      setIsLoading(false);
    }
  });

  return {
    ...form,
    onSubmit,
    apiError,
    isLoading,
    cnpjStatus: status,
  };
}
