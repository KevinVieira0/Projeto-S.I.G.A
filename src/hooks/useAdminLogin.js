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
  const [apiError, setApiError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", senha: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setApiError(null);
    setIsLoading(true);

    try {
      const data = await loginAdmin(values);
      login("admin", data.usuario);
      router.push(ROUTES.ADMIN_DASHBOARD);
    } catch (error) {
      setApiError(
        error.response?.data?.mensagem || "E-mail ou senha inválidos."
      );
    } finally {
      setIsLoading(false);
    }
  });

  return { ...form, onSubmit, apiError, isLoading };
}
