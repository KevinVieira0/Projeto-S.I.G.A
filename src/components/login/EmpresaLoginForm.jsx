"use client";

import { useState } from "react";
import { Controller } from "react-hook-form";
import { Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useEmpresaLogin } from "@/hooks/useEmpresaLogin";
import CnpjInput from "@/components/ui/CnpjInput";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function EmpresaLoginForm() {
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const {
    control,
    register,
    onSubmit: enviarFormulario,
    formState: { errors: errosCampos },
    apiError: erroApi,
    isLoading: carregando,
    cnpjStatus,
  } = useEmpresaLogin();
  return (
    <form onSubmit={enviarFormulario} noValidate className="mt-5">
      <Controller
        name="cnpj"
        control={control}
        render={({ field: campo }) => (
          <CnpjInput
            label="CNPJ da empresa"
            name="cnpj"
            autoComplete="username"
            ref={campo.ref}
            value={campo.value}
            onChange={campo.onChange}
            error={errosCampos.cnpj?.message}
            status={cnpjStatus}
          />
        )}
      />

      <div className="mt-4">
        <Input
          label="Senha"
          name="senha"
          autoComplete="current-password"
          type={mostrarSenha ? "text" : "password"}
          placeholder="••••••••"
          icon={Lock}
          color="amber"
          error={errosCampos.senha?.message}
          rightElement={
            <button
              type="button"
              onClick={() => setMostrarSenha((valorAtual) => !valorAtual)}
              className="rounded-md p-2 text-slate-400 outline-none hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-orange-500"
              aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
            >
              {mostrarSenha ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
          {...register("senha")}
        />
      </div>

      {erroApi && (
        <p role="alert" className="mb-4 text-sm text-red-600">
          {erroApi}
        </p>
      )}

      <Button
        type="submit"
        isLoading={carregando}
        disabled={cnpjStatus !== "valid"}
        color="orange"
        icon={<ArrowRight className="h-4 w-4" />}
        className="mt-2"
      >
        Entrar como empresa
      </Button>
    </form>
  );
}
