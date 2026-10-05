"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { adminLoginSchema } from "@/lib/validations/adminLoginSchema";
import { loginAdmin } from "@/lib/api/authService";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/constants/routes";

export function useAdminLogin() {
  const [erroApi, setErroApi] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const formulario = useForm({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", senha: "" },
  });
  const enviarFormulario = formulario.handleSubmit(async (valores) => {
    setErroApi(null);
    setCarregando(true);
    try {
      const dados = await loginAdmin(valores);
      login("admin", dados.usuario);
      router.push(ROUTES.ADMIN_DASHBOARD);
    } catch (erroCapturado) {
      setErroApi(erroCapturado.response?.data?.mensagem || "E-mail ou senha inválidos.");
    } finally {
      setCarregando(false);
    }
  });
  return {
    ...formulario,
    onSubmit: enviarFormulario,
    apiError: erroApi,
    isLoading: carregando,
  };
}
