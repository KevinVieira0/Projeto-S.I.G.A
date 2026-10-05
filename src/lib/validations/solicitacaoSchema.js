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

export function parseCivilDate(valor) {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  const [ano, mes, dia] = valor.split("-").map(Number);
  if (ano < 1) return null;
  const dataCivil = new Date(`${valor}T00:00:00.000Z`);
  return !Number.isNaN(dataCivil.getTime()) &&
    dataCivil.getUTCFullYear() === ano &&
    dataCivil.getUTCMonth() === mes - 1 &&
    dataCivil.getUTCDate() === dia
    ? dataCivil
    : null;
}

export function todayInSaoPaulo(agora = new Date()) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(agora);
  const parte = (tipo) => partes.find((item) => item.type === tipo).value;
  return `${parte("year")}-${parte("month")}-${parte("day")}`;
}
const numeroInteiro = (minimo, maximo, mensagem) =>
  z.preprocess(
    (valor) => (typeof valor === "string" && valor.trim() !== "" ? Number(valor) : valor),
    z
      .number({ invalid_type_error: mensagem, required_error: mensagem })
      .int(mensagem)
      .min(minimo, mensagem)
      .max(maximo, mensagem),
  );

export function createSolicitacaoSchema(cursosDisponiveis, hoje = todayInSaoPaulo()) {
  return z
    .object({
      idadeMinima: numeroInteiro(
        16,
        24,
        "A idade mínima deve ser um número inteiro entre 16 e 24.",
      ),
      idadeMaxima: numeroInteiro(
        16,
        24,
        "A idade máxima deve ser um número inteiro entre 16 e 24.",
      ),
      sexo: z
        .string()
        .refine(
          (valor) => SEXOS.some((item) => item.value === valor),
          "Selecione uma opção de sexo válida.",
        ),
      pratica: z
        .string()
        .refine(
          (valor) => PRATICAS.some((item) => item.value === valor),
          "Selecione uma opção de prática válida.",
        ),
      cursos: z.string().trim().min(1, "Selecione um curso."),
      inicio: z
        .string()
        .refine(
          (valor) => Boolean(parseCivilDate(valor)),
          "Informe uma data de início válida.",
        ),
      fim: z
        .string()
        .refine(
          (valor) => Boolean(parseCivilDate(valor)),
          "Informe uma data de fim válida.",
        ),
      quantidadeAlunos: numeroInteiro(
        1,
        5,
        "A quantidade deve ser um número inteiro entre 1 e 5.",
      ),
      observacoes: z.string().trim().optional(),
    })
    .strict()
    .superRefine((dados, contexto) => {
      const adicionarErro = (caminho, mensagem) =>
        contexto.addIssue({
          code: z.ZodIssueCode.custom,
          path: [caminho],
          message: mensagem,
        });
      if (dados.idadeMinima > dados.idadeMaxima) {
        adicionarErro(
          "idadeMinima",
          "A idade mínima não pode ser maior que a idade máxima.",
        );
        adicionarErro(
          "idadeMaxima",
          "A idade máxima não pode ser menor que a idade mínima.",
        );
      }
      if (cursosDisponiveis && !cursosDisponiveis.includes(dados.cursos))
        adicionarErro("cursos", "O curso selecionado não está mais disponível.");
      const inicio = parseCivilDate(dados.inicio);
      const fim = parseCivilDate(dados.fim);
      if (inicio && dados.inicio < hoje)
        adicionarErro("inicio", "A data de início não pode ser uma data passada.");
      if (fim && dados.fim < hoje)
        adicionarErro("fim", "A data de fim não pode ser uma data passada.");
      if (inicio && fim) {
        if (dados.inicio > dados.fim) {
          adicionarErro("inicio", "A data de início não pode ser depois da data de fim.");
          adicionarErro("fim", "A data de fim não pode ser antes da data de início.");
        }
        const limite = new Date(inicio);
        limite.setUTCFullYear(limite.getUTCFullYear() + 2);
        if (limite.getUTCMonth() !== inicio.getUTCMonth()) limite.setUTCDate(0);
        if (fim > limite)
          adicionarErro(
            "fim",
            "A data de fim não pode exceder 2 anos após a data de início.",
          );
      }
    });
}

export const solicitacaoSchema = z.lazy(() => createSolicitacaoSchema());
