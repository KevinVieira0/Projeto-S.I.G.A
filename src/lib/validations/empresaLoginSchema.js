import { z } from "zod";
import { isValidCnpjFormat, onlyDigits } from "./cnpjUtils";

export const empresaLoginSchema = z.object({
  cnpj: z
    .string()
    .min(1, "Informe o CNPJ")
    .refine((value) => onlyDigits(value).length === 14, "CNPJ incompleto")
    .refine(isValidCnpjFormat, "CNPJ inválido"),
});
