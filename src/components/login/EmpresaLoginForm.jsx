"use client";

import { useState } from "react";
import { Controller } from "react-hook-form";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

import { useEmpresaLogin } from "@/hooks/useEmpresaLogin";
import CnpjInput from "@/components/ui/CnpjInput";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function EmpresaLoginForm() {
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    register,
    onSubmit,
    formState: { errors },
    apiError,
    isLoading,
    cnpjStatus,
  } = useEmpresaLogin();

  return (
    <form onSubmit={onSubmit} noValidate className="mt-5">
      <Controller
        name="cnpj"
        control={control}
        render={({ field }) => (
          <CnpjInput
            label="CNPJ da empresa"
            name="cnpj"
            autoComplete="username"
            ref={field.ref}
            value={field.value}
            onChange={field.onChange}
            error={errors.cnpj?.message}
            status={cnpjStatus}
          />
        )}
      />

      <div className="mt-4">
        <Input
          label="Senha"
          name="senha"
          autoComplete="current-password"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          icon={Lock}
          color="amber"
          error={errors.senha?.message}
          rightElement={
            <button
              type="button"
              onClick={() =>
                setShowPassword((currentValue) => !currentValue)
              }
              className="rounded-md p-2 text-slate-400 outline-none hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-orange-500"
              aria-label={
                showPassword
                  ? "Ocultar senha"
                  : "Mostrar senha"
              }
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
          {...register("senha")}
        />
      </div>

      {apiError && (
        <p role="alert" className="mb-4 text-sm text-red-600">
          {apiError}
        </p>
      )}

      <Button
        type="submit"
        isLoading={isLoading}
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
