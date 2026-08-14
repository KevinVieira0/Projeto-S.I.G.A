import { z } from "zod";
import { isValidCnpjFormat, onlyDigits } from "./cnpjUtils";

export const empresaLoginSchema = z.object({
  cnpj: z
    .string()
    .min(1, "Informe o CNPJ")
    .refine(
      (value) => onlyDigits(value).length === 14,
      "CNPJ incompleto"
    )
    .refine(isValidCnpjFormat, "CNPJ inválido"),

  senha: z
    .string()
    .min(1, "Informe a senha")
    .min(6, "A senha deve ter no mínimo 6 caracteres"),
});