"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { empresaLoginSchema } from "@/lib/validations/empresaLoginSchema";
import { useCnpjValidation } from "./useCnpjValidation";
import { loginEmpresa } from "@/lib/api/authService";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export function useEmpresaLogin() {
  const [erroApi, setErroApi] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const formulario = useForm({
    resolver: zodResolver(empresaLoginSchema),
    defaultValues: { cnpj: "", senha: "" },
  });
  const valorCnpj = formulario.watch("cnpj");
  const { status } = useCnpjValidation(valorCnpj);
  const enviarFormulario = formulario.handleSubmit(async (valores) => {
    setErroApi(null);
    if (status !== "valid") {
      setErroApi("Confirme um CNPJ de empresa beneficiária válido antes de continuar.");
      return;
    }
    setCarregando(true);
    try {
      const dados = await loginEmpresa(valores);
      login("empresa", dados.usuario);
      router.replace(ROUTES.EMPRESA_HOMEPAGE)
    } catch (erroCapturado) {
      setErroApi(erroCapturado.response?.data?.mensagem || "CNPJ ou senha inválidos.");
    } finally {
      setCarregando(false);
    }
  });
  return {
    ...formulario,
    onSubmit: enviarFormulario,
    apiError: erroApi,
    isLoading: carregando,
    cnpjStatus: status,
  };
}
