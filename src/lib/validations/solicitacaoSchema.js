import {z} from "zod";

export const solicitacaoSchema = z.object({
  idEmpresa: z.coerce.string().min(1, { message: "ID da empresa é obrigatório" }),
  idadeMinima: z.coerce.number().int().min(16, { message: "Idade mínima é 16 anos" }),
  idadeMaxima: z.coerce.number().int().max(24, { message: "Idade máxima é 24 anos" }),
  sexo: z.string().min(1, { message: "Sexo é obrigatório" }),
  pratica: z.string().max(1000, { message: "O texto da prática deve ter no máximo 1000 caracteres" }),
  cursos: z.string().min(1, { message: "Cursos são obrigatórios" }),
  inicio: z.coerce.date({ invalid_type_error: "Data de início inválida" }),
  fim: z.coerce.date({ invalid_type_error: "Data de fim inválida" }),
  quantidadeAlunos: z.number().int().min(1, { message: "A quantidade de alunos deve ser pelo menos 1" }),
  observacoes: z.string().optional()
});
