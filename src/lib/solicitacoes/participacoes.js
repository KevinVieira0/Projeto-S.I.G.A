import { z } from "zod";
import { camposComprovante } from "../contratos/comprovantes";

export const estadosEmAberto = [
  "INDICADO",
  "EM_PROCESSO",
  "APROVADO",
  "CONTRATADO",
];
export const estadosEncerrados = ["NAO_CONTRATADO", "DESISTIU", "CANCELADO"];
const rotulosAluno = {
  DISPONIVEL: "Disponível",
  INDICADO: "Indicado",
  EM_PROCESSO: "Em processo",
  CONTRATADO: "Contratado",
};

export async function registrarParticipacao(
  transacao,
  matricula,
  solicitacaoId,
  administradorId,
) {
  return transacao.participacaoSolicitacao.create({
    data: {
      solicitacaoId,
      matriculaId: matricula.id,
      alunoId: matricula.alunoId,
      eventos: {
        create: { novoStatus: "INDICADO", autor: "ADMIN", administradorId },
      },
    },
  });
}

export async function conciliarParticipacoesAluno(
  transacao,
  alunoId,
  administradorId,
) {
  const aluno = await transacao.aluno.findUnique({
    where: { id: alunoId },
    select: {
      arquivadoEm: true,
      empresaId: true,
      statusIndicacao: true,
      turma: true,
      curso: true,
      periodo: true,
    },
  });
  const participacoes = await transacao.participacaoSolicitacao.findMany({
    where: { alunoId, status: { in: estadosEmAberto } },
    include: {
      solicitacao: { select: { idEmpresa: true } },
      matricula: { include: { turma: { include: { curso: true } } } },
    },
  });
  for (const participacao of participacoes) {
    const matricula = participacao.matricula;
    const pertence =
      !aluno.arquivadoEm &&
      aluno.empresaId === participacao.solicitacao.idEmpresa &&
      matricula.empresaAtualId === aluno.empresaId &&
      matricula.turma.codigo === aluno.turma &&
      matricula.turma.curso.nome === aluno.curso &&
      matricula.turma.turno === aluno.periodo;
    let status =
      !pertence || aluno.statusIndicacao === "Disponível"
        ? "CANCELADO"
        : matricula.status;
    if (status === "DISPONIVEL") status = "CANCELADO";
    if (status === "EM_PROCESSO" && participacao.status === "APROVADO")
      status = "APROVADO";
    if (status === participacao.status) continue;
    await transacao.participacaoSolicitacao.update({
      where: { id: participacao.id },
      data: {
        status,
        motivo:
          status === "CANCELADO"
            ? "Vínculo atualizado pela coordenação."
            : null,
        encerradoEm: status === "CANCELADO" ? new Date() : null,
        contratadoEm: status === "CONTRATADO" ? new Date() : null,
        eventos: {
          create: {
            statusAnterior: participacao.status,
            novoStatus: status,
            autor: "ADMIN",
            administradorId,
          },
        },
      },
    });
  }
}

export class ErroParticipacao extends Error {
  constructor(mensagem, status = 400) {
    super(mensagem);
    this.status = status;
  }
}
export function conferirUuid(valor) {
  if (!z.string().uuid().safeParse(valor).success)
    throw new ErroParticipacao("Identificador inválido.");
}
export function resumoParticipacoes(participacoes, vagas) {
  const contagem = Object.fromEntries(
    [...estadosEmAberto, ...estadosEncerrados].map((status) => [status, 0]),
  );
  for (const item of participacoes) contagem[item.status]++;
  return {
    indicados: contagem.INDICADO,
    emProcesso: contagem.EM_PROCESSO + contagem.APROVADO,
    aprovados: contagem.APROVADO,
    contratados: contagem.CONTRATADO,
    encerrados:
      contagem.NAO_CONTRATADO + contagem.DESISTIU + contagem.CANCELADO,
    total: participacoes.length,
    vagasPreenchidas: contagem.CONTRATADO >= vagas,
  };
}

export const camposPedido = {
  id: true,
  cursos: true,
  idadeMinima: true,
  idadeMaxima: true,
  sexo: true,
  pratica: true,
  periodoPratica: true,
  inicio: true,
  fim: true,
  quantidadeVagas: true,
  observacoes: true,
  ativa: true,
  criadoEm: true,
};
const vinculo = {
  select: {
    aluno: { select: { nome: true, arquivadoEm: true } },
    turma: {
      select: { codigo: true, turno: true, curso: { select: { nome: true } } },
    },
  },
};

export async function listarPedidosEmpresa(prisma, empresaId) {
  const pedidos = await prisma.solicitacao.findMany({
    where: { idEmpresa: empresaId },
    orderBy: [{ criadoEm: "desc" }, { id: "asc" }],
    select: { ...camposPedido, participacoes: { select: { status: true } } },
  });
  return pedidos.map(({ participacoes, ...pedido }) => ({
    ...pedido,
    resumo: resumoParticipacoes(participacoes, pedido.quantidadeVagas),
  }));
}
export async function obterPedidoEmpresa(prisma, empresaId, id, pagina = 1) {
  conferirUuid(id);
  const validacaoPagina = z.coerce
    .number()
    .int()
    .min(1)
    .max(100000)
    .safeParse(pagina);
  if (!validacaoPagina.success) throw new ErroParticipacao("Página inválida.");
  pagina = validacaoPagina.data;
  const pedido = await prisma.solicitacao.findFirst({
    where: { id, idEmpresa: empresaId },
    select: { ...camposPedido, participacoes: { select: { status: true } } },
  });
  if (!pedido) throw new ErroParticipacao("Solicitação não encontrada.", 404);
  const { participacoes: estados, ...dados } = pedido;
  const participacoes = await prisma.participacaoSolicitacao.findMany({
    where: { solicitacaoId: id },
    orderBy: [{ criadoEm: "desc" }, { id: "asc" }],
    take: 20,
    skip: (pagina - 1) * 20,
    include: { matricula: vinculo },
  });
  return {
    ...dados,
    pagina,
    tamanhoPagina: 20,
    totalParticipacoes: estados.length,
    resumo: resumoParticipacoes(estados, pedido.quantidadeVagas),
    participacoes: participacoes.map((p) => ({
      id: p.id,
      status: p.status,
      nome: p.matricula.aluno.nome,
      arquivado: Boolean(p.matricula.aluno.arquivadoEm),
      curso: p.matricula.turma.curso.nome,
      turma: p.matricula.turma.codigo,
      turno: p.matricula.turma.turno,
      indicadoEm: p.criadoEm,
      atualizadoEm: p.atualizadoEm,
    })),
  };
}

function vinculoAtual(participacao) {
  const matricula = participacao.matricula;
  const aluno = matricula.aluno;
  const esperado =
    participacao.status === "APROVADO" ? "EM_PROCESSO" : participacao.status;
  return (
    !aluno.arquivadoEm &&
    estadosEmAberto.includes(participacao.status) &&
    matricula.empresaAtualId === participacao.solicitacao.idEmpresa &&
    aluno.empresaId === participacao.solicitacao.idEmpresa &&
    matricula.status === esperado &&
    aluno.statusIndicacao === rotulosAluno[esperado]
  );
}
async function carregarParticipacao(prisma, empresaId, pedidoId, id) {
  conferirUuid(pedidoId);
  conferirUuid(id);
  const participacao = await prisma.participacaoSolicitacao.findFirst({
    where: {
      id,
      solicitacaoId: pedidoId,
      solicitacao: { idEmpresa: empresaId },
    },
    include: {
      solicitacao: true,
      matricula: {
        include: { aluno: true, turma: { include: { curso: true } } },
      },
    },
  });
  if (!participacao)
    throw new ErroParticipacao("Participação não encontrada.", 404);
  return participacao;
}
export async function obterParticipacaoEmpresa(
  prisma,
  empresaId,
  pedidoId,
  id,
) {
  const p = await carregarParticipacao(prisma, empresaId, pedidoId, id);
  const aluno = p.matricula.aluno;
  const atual = vinculoAtual(p);
  const eventos = await prisma.eventoParticipacao.findMany({
    where: { participacaoId: id },
    orderBy: [{ registradoEm: "asc" }, { id: "asc" }],
    select: {
      id: true,
      novoStatus: true,
      autor: true,
      registradoEm: true,
      descricao: true,
    },
  });
  return {
    id: p.id,
    solicitacaoId: p.solicitacaoId,
    status: p.status,
    motivo: p.motivo,
    versao: p.atualizadoEm.toISOString(),
    podeAlterar: atual && p.solicitacao.ativa && p.status !== "CONTRATADO",
    podeEnviarContrato:
      atual &&
      (p.status === "CONTRATADO" ||
        (p.solicitacao.ativa &&
          ["EM_PROCESSO", "APROVADO"].includes(p.status))),
    comprovantes: await prisma.comprovanteContrato.findMany({
      where: { participacaoId: id },
      orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
      take: 30,
      select: camposComprovante,
    }),
    contratoRecebido:
      atual && p.status === "CONTRATADO"
        ? p.matricula.contratoConfirmado
        : null,
    aluno: {
      nome: aluno.nome,
      curso: p.matricula.turma.curso.nome,
      turma: p.matricula.turma.codigo,
      turno: p.matricula.turma.turno,
      termo: p.matricula.termoAtual,
      email: atual ? aluno.email : null,
      celular: atual ? aluno.celular : null,
      telefone: atual ? aluno.telefone : null,
    },
    eventos,
  };
}

const acaoSchema = z
  .object({
    acao: z.enum(["INICIAR", "APROVAR", "CONTRATAR", "ENCERRAR"]),
    versao: z.string().datetime(),
    confirmado: z.boolean().optional(),
    motivo: z.enum(["NAO_SELECIONADO", "DESISTENCIA"]).optional(),
  })
  .strict();
export async function alterarParticipacaoEmpresa(
  prisma,
  empresaId,
  pedidoId,
  id,
  entrada,
  comprovante = null,
) {
  const validacao = acaoSchema.safeParse(entrada);
  if (!validacao.success)
    throw new ErroParticipacao("Revise os dados da atualização.");
  const dados = validacao.data;
  if (dados.acao === "CONTRATAR" && !comprovante)
    throw new ErroParticipacao(
      "Anexe o contrato ou comprovante para concluir a contratação.",
      409,
    );
  if (
    ["CONTRATAR", "ENCERRAR"].includes(dados.acao) &&
    dados.confirmado !== true
  )
    throw new ErroParticipacao("Confirme a operação antes de continuar.");
  if (dados.acao === "ENCERRAR" && !dados.motivo)
    throw new ErroParticipacao("Informe o motivo do encerramento.");
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(741004)`;
      const empresa = await tx.empresa.findUnique({
        where: { id: empresaId },
        select: { ativa: true, autorizada: true },
      });
      if (!empresa?.ativa || !empresa.autorizada)
        throw new ErroParticipacao("Acesso da empresa inválido.", 403);
      const p = await carregarParticipacao(tx, empresaId, pedidoId, id);
      if (comprovante) {
        const anterior = await tx.comprovanteContrato.findUnique({
          where: { id: comprovante.id },
          select: { participacaoId: true, empresaId: true, hash: true },
        });
        if (anterior) {
          if (
            anterior.participacaoId !== id ||
            anterior.empresaId !== empresaId ||
            anterior.hash !== comprovante.hash
          )
            throw new ErroParticipacao(
              "Este envio já foi utilizado. Selecione o arquivo novamente.",
              409,
            );
          return { id, status: p.status, jaAplicado: true };
        }
      }
      const destino = {
        INICIAR: "EM_PROCESSO",
        APROVAR: "APROVADO",
        CONTRATAR: "CONTRATADO",
        ENCERRAR:
          dados.motivo === "DESISTENCIA" ? "DESISTIU" : "NAO_CONTRATADO",
      }[dados.acao];
      if (p.status === destino && !comprovante)
        return { id, status: p.status, jaAplicado: true };
      if (p.atualizadoEm.toISOString() !== dados.versao)
        throw new ErroParticipacao(
          "O acompanhamento mudou. Recarregue os detalhes antes de continuar.",
          409,
        );
      if (!p.solicitacao.ativa && !(comprovante && p.status === "CONTRATADO"))
        throw new ErroParticipacao(
          "Esta solicitação está finalizada. Procure a coordenação.",
          409,
        );
      if (!vinculoAtual(p))
        throw new ErroParticipacao(
          "O vínculo do aluno mudou. Atualize os dados ou procure a coordenação.",
          409,
        );
      const permitidos = {
        INICIAR: ["INDICADO"],
        APROVAR: ["EM_PROCESSO"],
        CONTRATAR: ["EM_PROCESSO", "APROVADO", "CONTRATADO"],
        ENCERRAR: ["INDICADO", "EM_PROCESSO", "APROVADO"],
      }[dados.acao];
      if (!permitidos.includes(p.status))
        throw new ErroParticipacao(
          "Esta ação não está disponível na etapa atual.",
          409,
        );
      if (destino === "CONTRATADO" && p.status !== "CONTRATADO") {
        const ocupadas = await tx.participacaoSolicitacao.count({
          where: { solicitacaoId: pedidoId, status: "CONTRATADO" },
        });
        if (ocupadas >= p.solicitacao.quantidadeVagas)
          throw new ErroParticipacao(
            "Todas as vagas desta solicitação já foram preenchidas.",
            409,
          );
        const outroContrato = await tx.matricula.count({
          where: {
            alunoId: p.alunoId,
            id: { not: p.matriculaId },
            status: "CONTRATADO",
            empresaAtualId: { not: null },
          },
        });
        if (outroContrato)
          throw new ErroParticipacao(
            "Este aluno já possui outro vínculo contratado. Procure a coordenação.",
            409,
          );
      }
      const encerrada = estadosEncerrados.includes(destino);
      const restantes = await tx.participacaoSolicitacao.count({
        where: {
          alunoId: p.alunoId,
          id: { not: id },
          status: { in: estadosEmAberto },
        },
      });
      const outrosVinculos = encerrada
        ? await tx.matricula.count({
            where: {
              alunoId: p.alunoId,
              id: { not: p.matriculaId },
              status: { in: ["INDICADO", "EM_PROCESSO", "CONTRATADO"] },
              empresaAtualId: { not: null },
            },
          })
        : 0;
      if (encerrada && (restantes || outrosVinculos))
        throw new ErroParticipacao(
          "Há outro acompanhamento ativo. Procure a coordenação para conciliar os vínculos.",
          409,
        );
      const agora = new Date(
        Math.max(Date.now(), p.atualizadoEm.getTime() + 1),
      );
      const novoStatus = encerrada
        ? "DISPONIVEL"
        : destino === "APROVADO"
          ? "EM_PROCESSO"
          : destino;
      if (comprovante)
        await tx.comprovanteContrato.create({
          data: {
            ...comprovante,
            alunoId: p.alunoId,
            matriculaId: p.matriculaId,
            empresaId,
            participacaoId: id,
            criadoEm: agora,
          },
        });
      await tx.participacaoSolicitacao.update({
        where: { id },
        data: {
          status: destino,
          motivo: encerrada
            ? dados.motivo === "DESISTENCIA"
              ? "Desistência do aluno."
              : "Não selecionado pela empresa."
            : null,
          atualizadoEm: agora,
          ...(destino === "EM_PROCESSO" ? { iniciadoEm: agora } : {}),
          ...(destino === "APROVADO" ? { aprovadoEm: agora } : {}),
          ...(destino === "CONTRATADO" && p.status !== "CONTRATADO"
            ? { contratadoEm: agora }
            : {}),
          ...(encerrada ? { encerradoEm: agora } : {}),
          eventos: {
            create: {
              statusAnterior: p.status,
              novoStatus: destino,
              autor: "EMPRESA",
              empresaId,
              descricao: comprovante
                ? p.status === "CONTRATADO"
                  ? "Comprovante de contrato substituído"
                  : "Contrato anexado · contratação concluída"
                : null,
              registradoEm: agora,
            },
          },
        },
      });
      const empresaAtualId = encerrada ? null : empresaId;
      await tx.matricula.update({
        where: { id: p.matriculaId },
        data: {
          status: novoStatus,
          empresaAtualId,
          ...(comprovante
            ? { contratoConfirmado: true, contratoAtualizadoEm: agora }
            : {}),
          ...(encerrada
            ? { contratoConfirmado: false, contratoAtualizadoEm: null }
            : {}),
        },
      });
      await tx.aluno.update({
        where: { id: p.alunoId },
        data: {
          statusIndicacao: rotulosAluno[novoStatus],
          empregado: novoStatus === "CONTRATADO",
          empresaId: empresaAtualId,
        },
      });
      if (novoStatus !== p.matricula.status)
        await tx.historicoAcompanhamento.create({
          data: {
            matriculaId: p.matriculaId,
            solicitacaoId: pedidoId,
            empresaId,
            tipo: "ALTERACAO_STATUS",
            statusAnterior: p.matricula.status,
            novoStatus,
            origem: "PORTAL_EMPRESA",
            registradoEm: agora,
          },
        });
      return { id, status: destino, jaAplicado: false };
    },
    { timeout: 30000, maxWait: 10000 },
  );
}
