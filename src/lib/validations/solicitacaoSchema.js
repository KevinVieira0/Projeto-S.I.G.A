import {z} from "zod";

export const solicitacaoSchema = z.object({
  idadeMinima: z.coerce.number().int().min(0),
  sexo: z.string.nonempty(),
  pratica: z.string().max(1000),
  cursos: z.string().nonempty(),
  inicio: z.coerce.date({message: "Data de início inválida"}),
  fim: z.coerce.date({ message: "Data de fim inválida"}),
  quantidadeAlunos: z.number().int().min(1),
  observacoes: z.string().optional()
});
 .refine((data) => data.fim >= data.inicio, {
    message: "A data de fim deve ser igual ou posterior à data de início",
    path: ["fim"],
 });