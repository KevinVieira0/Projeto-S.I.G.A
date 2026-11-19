import { prisma } from "../prisma";

// Somente o catálogo atual do banco; a lista antiga não alimenta as telas.
// O formulário de solicitações e seu backend usam exatamente a mesma lista.

export async function lerCursosParaSolicitacao() {
  const banco = await prisma.curso.findMany({ select: { nome: true } });
  const nomes = new Map();
  for (const nome of banco.map((curso) => curso.nome)) {
    const text = nome.trim();
    if (text) nomes.set(text.toLocaleLowerCase("pt-BR"), text);
  }
  return [...nomes.values()].sort((a, b) => a.localeCompare(b, "pt-BR"));
}
