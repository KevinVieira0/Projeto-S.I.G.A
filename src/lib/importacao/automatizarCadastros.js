import { processarRecebimento } from "./processarRecebimento";

export async function automatizarCadastros(prisma, fonte, tipo) {
  const filtro = { fonte, tipo, estado: "PENDENTE" };
  const linhas = await prisma.recebimentoCadastro.findMany({
    where: filtro,
    orderBy: [{ recebidoEm: "asc" }, { id: "asc" }],
    take: 500,
    select: { id: true },
  });
  const resultado = {
    criados: 0,
    atualizados: 0,
    ignorados: 0,
    invalidos: await prisma.recebimentoCadastro.count({
      where: { fonte, tipo, estado: "INVALIDO" },
    }),
    falhas: 0,
    restantes: 0,
  };
  for (const registro of linhas) {
    try {
      const saida = await processarRecebimento(prisma, registro.id);
      if (saida.repetido || saida.ignorado) resultado.ignorados++;
      else if (saida.operacao === "criado") resultado.criados++;
      else if (saida.operacao === "atualizado") resultado.atualizados++;
    } catch {
      resultado.falhas++;
    }
  }
  resultado.restantes = await prisma.recebimentoCadastro.count({
    where: filtro,
  });
  return resultado;
}
