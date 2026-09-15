"use client";

import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAdminLogin } from "@/hooks/useAdminLogin";

export default function AdminLoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    onSubmit,
    formState: { errors },
    apiError,
    isLoading,
  } = useAdminLogin();

  return (
    <form onSubmit={onSubmit} noValidate className="mt-2">
      <Input
        label="E-mail institucional"
        name="email"
        type="email"
        autoComplete="username"
        placeholder="voce@docente.senai.br"
        icon={Mail}
        color="blue"
        error={errors.email?.message}
        {...register("email")}
      />

      <Input
        label="Senha"
        name="senha"
        autoComplete="current-password"
        type={showPassword ? "text" : "password"}
        placeholder="••••••••"
        icon={Lock}
        color="blue"
        error={errors.senha?.message}
        rightElement={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="rounded-md p-2 text-gray-400 outline-none hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
        {...register("senha")}
      />

      {apiError && <p role="alert" className="mb-4 text-sm text-red-500">{apiError}</p>}

      <Button
        type="submit"
        isLoading={isLoading}
        color="blue"
        icon={<ArrowRight className="h-4 w-4" />}
        className="mt-2"
      >
        Entrar como administrador
      </Button>
    </form>
  );
}
