"use client";

import { Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Controller } from "react-hook-form";
import { useEmpresaLogin } from "@/hooks/useEmpresaLogin";
import CnpjInput from "../ui/CnpjInput";
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
    <form onSubmit={onSubmit} noValidate className="mt-2">
      <Controller
        name="cnpj"
        control={control}
        render={({ field }) => (
          <CnpjInput
            label="CNPJ da empresa"
            name="cnpj"
            ref={field.ref}
            value={field.value}
            onChange={field.onChange}
            error={errors.cnpj?.message}
            status={cnpjStatus}
          />
        )}
      />
      <Input
        name="senha"
        type={showPassword ? "text" : "password"}
        placeholder="••••••••"
        icon={Lock}
        color="amber"
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
      
      {apiError && <p className="mb-4 mt-3 text-sm text-red-500">{apiError}</p>}

      <Button
        type="submit"
        isLoading={isLoading}
        disabled={cnpjStatus !== "valid"}
        color="amber"
        icon={<ArrowRight className="h-4 w-4" />}
        className={apiError ? "" : "mt-4"}
      >
        Entrar como empresa
      </Button>
    </form>
  );
}
