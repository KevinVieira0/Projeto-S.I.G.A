"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { empresaLoginSchema } from "@/lib/validations/empresaLoginSchema";
import { useCnpjValidation } from "./useCnpjValidation";
import { loginEmpresa } from "@/lib/api/authService";

/**
 * Mesmo padrão do useAdminLogin: RHF + zod cuidam da validação do
 * formulário, e este hook cuida do envio pra API. A diferença é que
 * o campo de CNPJ é controlado (Controller) porque precisa de máscara
 * enquanto o usuário digita, então aqui expomos `control` em vez de
 * `register`.
 */
export function useEmpresaLogin() {
  const [apiError, setApiError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(empresaLoginSchema),
    defaultValues: { cnpj: "" },
  });

  const cnpjValue = form.watch("cnpj");
  const { status, razaoSocial } = useCnpjValidation(cnpjValue);

  const onSubmit = form.handleSubmit(async ({ cnpj }) => {
    setApiError(null);

    if (status !== "valid") {
      setApiError("Confirme um CNPJ de empresa beneficiária válido antes de continuar.");
      return;
    }

    setIsLoading(true);
    try {
      // ATENÇÃO: /api/auth/empresa/login ainda não existe (ver authService.js),
      // então esta chamada retorna 404 até essa rota ser implementada.
      const data = await loginEmpresa({ cnpj });
      // TODO: salvar empresa no AuthContext (useAuth().login) e redirecionar
      console.log("login empresa ok", data, razaoSocial);
    } catch (err) {
      setApiError("Não foi possível entrar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  });

  return { ...form, onSubmit, apiError, isLoading, cnpjStatus: status };
}
