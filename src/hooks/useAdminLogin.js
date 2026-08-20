"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminLoginSchema } from "@/lib/validations/adminLoginSchema";
import { loginAdmin } from "@/lib/api/authService";
import { useAuth } from "@/context/AuthContext";
import { redirect } from "next/dist/server/api-utils";

export function useAdminLogin() {
  const [apiError, setApiError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const form = useForm({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", senha: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setApiError(null);
    setIsLoading(true);
    try {
      const data = await loginAdmin(values);
      // A rota /api/auth/admin/login ainda não emite token (ver authService.js),
      // então guardamos a sessão sem token por enquanto. Quando a rota passar a
      // retornar um token, basta trocar `null` por `data.token` aqui.
      login(null, "admin", data.usuario);
      // TODO: redirecionar para ROUTES.ADMIN_DASHBOARD assim que a tela existir
    } catch (err) {
      setApiError("E-mail ou senha inválidos.");
    } finally {
      setIsLoading(false);
    }
  });

  return { ...form, onSubmit, apiError, isLoading };
}
