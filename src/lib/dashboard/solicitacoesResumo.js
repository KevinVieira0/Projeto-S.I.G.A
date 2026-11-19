import { PRATICAS, SEXOS } from "@/lib/validations/solicitacaoSchema";

const FUSO = "America/Sao_Paulo";
const MS_POR_DIA = 24 * 60 * 60 * 1000;

// A coordenação controla a finalização pelo campo `ativa`, independentemente do período.
export const SITUACOES = [
  {
    id: "ativa",
    label: "Ativa",
    cor: "#16a36a",
    pontoClasse: "bg-emerald-600",
    seloClasse: "border-emerald-200 bg-emerald-50 text-emerald-700",
    bordaClasse: "border-t-emerald-600",
  },
  {
    id: "finalizada",
    label: "Finalizada",
    cor: "#9ca3af",
    pontoClasse: "bg-gray-400",
    seloClasse: "border-gray-200 bg-gray-100 text-gray-600",
    bordaClasse: "border-t-gray-400",
  },
];

export function obterSituacao(id) {
  return SITUACOES.find((situacao) => situacao.id === id) ?? SITUACOES[0];
}

// `inicio` e `fim` são datas civis gravadas à meia-noite UTC. Ler como YYYY-MM-DD
// evita o deslocamento de um dia que o fuso de São Paulo causaria.
export function dataCivil(valor) {
  if (!valor) return null;
  if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}/.test(valor)) {
    return valor.slice(0, 10);
  }
  const data = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data.toISOString().slice(0, 10);
}

function partesEmSaoPaulo(valor) {
  if (valor == null || valor === "") return null;
  const data = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(data.getTime())) return null;
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(data);
  const pegar = (tipo) =>
    Number(partes.find((parte) => parte.type === tipo).value);
  return { ano: pegar("year"), mes: pegar("month"), dia: pegar("day") };
}

export function situacaoSolicitacao(solicitacao) {
  return solicitacao.ativa === false ? "finalizada" : "ativa";
}

export function contarPorSituacao(solicitacoes) {
  const contagem = Object.fromEntries(SITUACOES.map(({ id }) => [id, 0]));
  for (const solicitacao of solicitacoes) {
    contagem[situacaoSolicitacao(solicitacao)] += 1;
  }
  return {
    total: solicitacoes.length,
    categorias: SITUACOES.map((situacao) => ({
      ...situacao,
      valor: contagem[situacao.id],
    })),
  };
}

export function vagasPorCurso(solicitacoes, limite = 6) {
  const porCurso = new Map();
  for (const solicitacao of solicitacoes) {
    const curso =
      String(solicitacao.cursos ?? "").trim() || "Curso não informado";
    const item = porCurso.get(curso) ?? { curso, vagas: 0, solicitacoes: 0 };
    item.vagas += Number(solicitacao.quantidadeVagas) || 0;
    item.solicitacoes += 1;
    porCurso.set(curso, item);
  }
  const todos = [...porCurso.values()].sort(
    (a, b) =>
      b.vagas - a.vagas ||
      b.solicitacoes - a.solicitacoes ||
      a.curso.localeCompare(b.curso, "pt-BR"),
  );
  return { cursos: todos.slice(0, limite), totalCursos: todos.length };
}

function nomeDoMes(ano, mes, formato) {
  const nome = new Intl.DateTimeFormat("pt-BR", {
    month: formato,
    timeZone: "UTC",
  }).format(new Date(Date.UTC(ano, mes - 1, 1)));
  return nome.replace(".", "");
}

// Agrupa pelo mês de criação (calendário de São Paulo), incluindo meses sem pedidos.
export function solicitacoesPorMes(
  solicitacoes,
  { meses = 6, agora = new Date() } = {},
) {
  const atual = partesEmSaoPaulo(agora);
  const chaveDe = (ano, mes) => `${ano}-${String(mes).padStart(2, "0")}`;
  const baldes = [];
  for (let recuo = meses - 1; recuo >= 0; recuo -= 1) {
    const indice = atual.ano * 12 + (atual.mes - 1) - recuo;
    const ano = Math.floor(indice / 12);
    const mes = (indice % 12) + 1;
    baldes.push({
      chave: chaveDe(ano, mes),
      rotulo: `${nomeDoMes(ano, mes, "short")}/${String(ano).slice(2)}`,
      rotuloCompleto: `${nomeDoMes(ano, mes, "long")} de ${ano}`,
      solicitacoes: 0,
      vagas: 0,
    });
  }
  const porChave = new Map(baldes.map((balde) => [balde.chave, balde]));
  for (const solicitacao of solicitacoes) {
    const partes = partesEmSaoPaulo(solicitacao.criadoEm);
    const balde = partes && porChave.get(chaveDe(partes.ano, partes.mes));
    if (!balde) continue;
    balde.solicitacoes += 1;
    balde.vagas += Number(solicitacao.quantidadeVagas) || 0;
  }
  return baldes;
}

export function formatarDataCivil(valor) {
  const civil = dataCivil(valor);
  if (!civil) return "—";
  const [ano, mes, dia] = civil.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function formatarDataCriacao(valor) {
  const partes = partesEmSaoPaulo(valor);
  if (!partes) return "—";
  const dois = (numero) => String(numero).padStart(2, "0");
  return `${dois(partes.dia)}/${dois(partes.mes)}/${partes.ano}`;
}

export function formatarDuracao(inicio, fim) {
  const de = dataCivil(inicio);
  const ate = dataCivil(fim);
  if (!de || !ate) return "";
  const dias =
    Math.round(
      (Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) /
        MS_POR_DIA,
    ) + 1;
  if (dias < 1) return "";
  if (dias < 60) return `${dias} ${dias === 1 ? "dia" : "dias"}`;
  const meses = Math.round(dias / 30.4375);
  if (meses >= 12 && meses % 12 === 0) {
    const anos = meses / 12;
    return `${anos} ${anos === 1 ? "ano" : "anos"}`;
  }
  return `${meses} meses`;
}

export function formatarFaixaEtaria(idadeMinima, idadeMaxima) {
  if (idadeMinima == null || idadeMaxima == null) return "—";
  return idadeMinima === idadeMaxima
    ? `${idadeMinima} anos`
    : `${idadeMinima} a ${idadeMaxima} anos`;
}

export function formatarCnpj(cnpj) {
  const digitos = String(cnpj ?? "").replace(/\D/g, "");
  return digitos.length === 14
    ? digitos.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
    : digitos;
}

export const rotuloSexo = (valor) =>
  SEXOS.find((item) => item.value === valor)?.label ?? (valor || "—");

export const rotuloPratica = (valor) =>
  PRATICAS.find((item) => item.value === valor)?.label ?? (valor || "—");
