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
        label="E-mail"
        name="email"
        type="email"
        placeholder="voce@docente.senai.br"
        icon={Mail}
        color="blue"
        error={errors.email?.message}
        {...register("email")}
      />

      <div className="mb-1 flex items-center justify-between">
        <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
          Senha
        </label>
        <a href="#" className="text-xs font-medium text-blue-600 hover:text-blue-700">
          Esqueceu a senha?
        </a>
      </div>
      <Input
        name="senha"
        type={showPassword ? "text" : "password"}
        placeholder="••••••••"
        icon={Lock}
        color="blue"
        error={errors.senha?.message}
        rightElement={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-gray-400 hover:text-gray-600"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
        {...register("senha")}
      />

      {apiError && <p className="mb-4 text-sm text-red-500">{apiError}</p>}

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
