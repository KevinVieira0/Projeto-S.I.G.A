"use client";

import { Controller } from "react-hook-form";
import { ArrowRight } from "lucide-react";
import { useEmpresaLogin } from "@/hooks/useEmpresaLogin";
import CnpjInput from "./CnpjInput";
import Button from "@/components/ui/Button";

export default function EmpresaLoginForm() {
  const {
    control,
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
