import { revisarRecebimento } from "./aprovarRecebimento";

// CPF é o identificador autorizado pelo cliente. Não há confirmação de identidade.

export async function automatizarAlunos(prisma, fonte) {
  const where = { fonte, tipo: "ALUNO", estado: "PENDENTE" };
  const validos = { ...where, erros: { equals: [] } };
  const linhas = await prisma.recebimentoCadastro.findMany({
    where: validos,
    orderBy: [{ recebidoEm: "asc" }, { id: "asc" }],
    take: 500,
    select: { id: true },
  });
  const resultado = {
    criados: 0,
    atualizados: 0,
    ignorados: 0,
    invalidos: await prisma.recebimentoCadastro.count({
      where: { ...where, NOT: { erros: { equals: [] } } },
    }),
    falhas: 0,
    restantes: 0,
  };
  for (const registro of linhas) {
    try {
      const saida = await revisarRecebimento(
        prisma,
        registro.id,
        null,
        { acao: "aprovar" },
        true,
      );
      if (saida.repetido || saida.ignorado) resultado.ignorados++;
      else if (saida.operacao === "criado") resultado.criados++;
      else if (saida.operacao === "atualizado") resultado.atualizados++;
    } catch {
      resultado.falhas++;
    }
  }
  resultado.restantes = await prisma.recebimentoCadastro.count({ where: validos });
  return resultado;
}
