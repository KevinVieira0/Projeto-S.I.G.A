import {z} from "zod";
const cursos = ["mecanica "]

export const solicitacaoSchema = z.object({
  idadeMinima: z.number().int().min(0),
  sexo: z.array(z.enum(['MASCULINO','FEMININO','OUTRO'])).nonempty(),
  pratica: z.string().max(1000),
  cursos: z.array(z.string()).nonempty(),
  inicio: z.Date().refine((s) => !Number.isNaN(Date.parse(s)), { message: 'Data de início inválida' }),
  fim: z.Date().refine((s) => !Number.isNaN(Date.parse(s)), { message: 'Data de fim inválida' }),
  quantidadeAlunos: z.number().int().min(1),
  observacoes: z.string().optional()
});