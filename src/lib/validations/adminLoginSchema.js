import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z
    .string()
    .min(1, "Informe o e-mail")
    .email("E-mail inválido"),
  senha: z
    .string()
    .min(6, "A senha deve ter no mínimo 6 caracteres"),
});
