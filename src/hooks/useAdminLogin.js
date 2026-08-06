"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminLoginSchema } from "@/lib/validations/adminLoginSchema";
import { loginAdmin } from "@/lib/api/authService";

export function useAdminLogin() {
  const [apiError, setApiError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", senha: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setApiError(null);
    setIsLoading(true);
    try {
      const data = await loginAdmin(values);
      // TODO: salvar token/usuário no AuthContext e redirecionar
      console.log("login admin ok", data);
    } catch (err) {
      setApiError("E-mail ou senha inválidos.");
    } finally {
      setIsLoading(false);
    }
  });

  return { ...form, onSubmit, apiError, isLoading };
}
