"use client";

import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAdminLogin } from "@/hooks/useAdminLogin";

export default function AdminLoginForm() {
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const {
    register,
    onSubmit: enviarFormulario,
    formState: { errors: errosCampos },
    apiError: erroApi,
    isLoading: carregando,
  } = useAdminLogin();
  return (
    <form onSubmit={enviarFormulario} noValidate className="mt-2">
      <Input
        label="E-mail institucional"
        name="email"
        type="email"
        autoComplete="username"
        placeholder="voce@docente.senai.br"
        icon={Mail}
        color="blue"
        error={errosCampos.email?.message}
        {...register("email")}
      />

      <Input
        label="Senha"
        name="senha"
        autoComplete="current-password"
        type={mostrarSenha ? "text" : "password"}
        placeholder="••••••••"
        icon={Lock}
        color="blue"
        error={errosCampos.senha?.message}
        rightElement={
          <button
            type="button"
            onClick={() => setMostrarSenha((valor) => !valor)}
            className="rounded-md p-2 text-gray-400 outline-none hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
          >
            {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
        {...register("senha")}
      />

      {erroApi && (
        <p role="alert" className="mb-4 text-sm text-red-500">
          {erroApi}
        </p>
      )}

      <Button
        type="submit"
        isLoading={carregando}
        color="blue"
        icon={<ArrowRight className="h-4 w-4" />}
        className="mt-2"
      >
        Entrar como administrador
      </Button>
    </form>
  );
}
