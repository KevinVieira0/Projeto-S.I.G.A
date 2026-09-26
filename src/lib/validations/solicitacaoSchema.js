import { z } from "zod";

export const SEXOS = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
  { value: "todos", label: "Todos" },
];
export const PRATICAS = [
  { value: "com", label: "Com prática" },
  { value: "sem", label: "Sem prática" },
];

// Datas civis YYYY-MM-DD no calendário do SENAI (America/Sao_Paulo).
// Persistência em meia-noite UTC evita depender do fuso do servidor.
export function parseCivilDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
}

export function todayInSaoPaulo(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (type) => parts.find((item) => item.type === type).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

const integer = (min, max, message) => z.preprocess(
  (value) => typeof value === "string" && value.trim() !== "" ? Number(value) : value,
  z.number({ invalid_type_error: message, required_error: message }).int(message).min(min, message).max(max, message)
);

export function createSolicitacaoSchema(cursosDisponiveis, hoje = todayInSaoPaulo()) {
  return z.object({
    idadeMinima: integer(16, 24, "A idade mínima deve ser um número inteiro entre 16 e 24."),
    idadeMaxima: integer(16, 24, "A idade máxima deve ser um número inteiro entre 16 e 24."),
    sexo: z.string().refine((value) => SEXOS.some((item) => item.value === value), "Selecione uma opção de sexo válida."),
    pratica: z.string().refine((value) => PRATICAS.some((item) => item.value === value), "Selecione uma opção de prática válida."),
    cursos: z.string().trim().min(1, "Selecione um curso."),
    inicio: z.string().refine((value) => Boolean(parseCivilDate(value)), "Informe uma data de início válida."),
    fim: z.string().refine((value) => Boolean(parseCivilDate(value)), "Informe uma data de fim válida."),
    quantidadeAlunos: integer(1, 5, "A quantidade deve ser um número inteiro entre 1 e 5."),
    observacoes: z.string().trim().optional(),
  }).strict().superRefine((data, ctx) => {
    const issue = (path, message) => ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
    if (data.idadeMinima > data.idadeMaxima) {
      issue("idadeMinima", "A idade mínima não pode ser maior que a idade máxima.");
      issue("idadeMaxima", "A idade máxima não pode ser menor que a idade mínima.");
    }
    if (cursosDisponiveis && !cursosDisponiveis.includes(data.cursos)) issue("cursos", "O curso selecionado não está mais disponível.");
    const inicio = parseCivilDate(data.inicio);
    const fim = parseCivilDate(data.fim);
    if (inicio && data.inicio < hoje) issue("inicio", "A data de início não pode ser uma data passada.");
    if (fim && data.fim < hoje) issue("fim", "A data de fim não pode ser uma data passada.");
    if (inicio && fim) {
      if (data.inicio > data.fim) {
        issue("inicio", "A data de início não pode ser depois da data de fim.");
        issue("fim", "A data de fim não pode ser antes da data de início.");
      }
      const limite = new Date(inicio);
      limite.setUTCFullYear(limite.getUTCFullYear() + 2);
      if (limite.getUTCMonth() !== inicio.getUTCMonth()) limite.setUTCDate(0);
      if (fim > limite) issue("fim", "A data de fim não pode exceder 2 anos após a data de início.");
    }
  });
}

export const solicitacaoSchema = z.lazy(() => createSolicitacaoSchema());
