import {z} from "zod";

const cursosTecnicosPrincipais = [
    "Técnico em Administração",
    "Técnico em Alimentos",
    "Técnico em Automação Industrial",
    "Técnico em Desenvolvimento de Sistemas",
    "Técnico em Edificações",
    "Técnico em Eletroeletrônica",
    "Técnico em Eletromecânica",
    "Técnico em Eletrônica",
    "Técnico em Eletrotécnica",
    "Técnico em Logística",
    "Técnico em Manutenção Automotiva",
    "Técnico em Mecânica",
    "Técnico em Mecatrônica",
    "Técnico em Metalurgia",
    "Técnico em Planejamento e Controle da Produção (PCP)",
    "Técnico em Plásticos",
    "Técnico em Qualidade",
    "Técnico em Redes de Computadores",
    "Técnico em Refrigeração e Climatização",
    "Técnico em Têxtil e Vestuário"
]

export const solicitacaoSchema = z.object({
  idadeMinima: z.number().int().min(0),
  sexo: z.array(z.enum(['MASCULINO','FEMININO','OUTRO'])).nonempty(),
  pratica: z.string().max(1000),
  cursos: z.string().nonempty(),
  inicio: z.Date().refine((s) => !Number.isNaN(Date.parse(s)), { message: 'Data de início inválida' }),
  fim: z.Date().refine((s) => !Number.isNaN(Date.parse(s)), { message: 'Data de fim inválida' }),
  quantidadeAlunos: z.number().int().min(1),
  observacoes: z.string().optional()
});