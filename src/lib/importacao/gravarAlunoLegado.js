// O sincronizador antigo não pode desfazer cadastros já conferidos pelo fluxo V2.

export async function gravarAlunoLegado(prisma, cpf, dadosAluno, dataCadastro) {
  return prisma.$transaction(async (transacao) => {
    await transacao.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"ALUNO:" + cpf}))`;
    const atual = await transacao.aluno.findUnique({
      where: { cpf },
      select: { id: true, origemCadastro: true, arquivadoEm: true },
    });
    if (
      atual?.arquivadoEm ||
      ["FORMULARIO_V2", "CADASTRO_INTERNO"].includes(atual?.origemCadastro)
    )
      return "preservado";
    await transacao.aluno.upsert({
      where: { cpf },
      update: dadosAluno,
      create: { cpf, ...dadosAluno, dataCadastro },
    });
    return atual ? "atualizado" : "criado";
  });
}
