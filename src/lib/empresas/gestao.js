import { z } from "zod";
import { hash } from "bcryptjs";

export class ErroGestaoEmpresa extends Error {
  constructor(mensagem, status = 400) {
    super(mensagem);
    this.status = status;
  }
}

export const camposEmpresa = {
  id: true,
  cnpj: true,
  razaoSocial: true,
  nomeFantasia: true,
  email: true,
  telefone: true,
  contribuinte: true,
  ativa: true,
  criadoEm: true,
  atualizadoEm: true,
};

const empresaSchema = z
  .object({
    razaoSocial: z.string().trim().min(2, "Informe a razão social.").max(255),
    nomeFantasia: z
      .string()
      .trim()
      .max(255)
      .transform((valor) => valor || null),
    email: z
      .union([
        z.literal(""),
        z.string().trim().max(255).email("Informe um e-mail válido."),
      ])
      .transform((valor) => valor.toLowerCase() || null),
    telefone: z
      .string()
      .trim()
      .max(20)
      .refine(
        (valor) =>
          !valor ||
          (/^[+\d\s().-]+$/.test(valor) &&
            /^\d{10,13}$/.test(valor.replace(/\D/g, ""))),
        "Informe um telefone com DDD.",
      )
      .transform((valor) => valor || null),
    ativa: z.boolean(),
    senhaAcesso: z
      .string()
      .refine(
        (valor) =>
          valor === "" ||
          (valor.trim().length >= 8 && Buffer.byteLength(valor, "utf8") <= 72),
        "A senha deve ter pelo menos 8 caracteres e no máximo 72 bytes.",
      )
      .optional(),
    versao: z.string().datetime(),
  })
  .strict();

export function conferirIdEmpresa(id) {
  if (!z.string().uuid().safeParse(id).success)
    throw new ErroGestaoEmpresa("Identificador de empresa inválido.");
}

export async function editarEmpresa(prisma, administradorId, id, entrada) {
  conferirIdEmpresa(id);
  const validacao = empresaSchema.safeParse(entrada);
  if (!validacao.success)
    throw new ErroGestaoEmpresa(validacao.error.issues[0].message);
  const { versao, senhaAcesso, ...dados } = validacao.data;
  if (senhaAcesso && !dados.ativa)
    throw new ErroGestaoEmpresa(
      "Ative a empresa antes de configurar o acesso.",
    );
  const senhaHash = senhaAcesso ? await hash(senhaAcesso, 12) : null;
  return prisma.$transaction(
    async (transacao) => {
      // Compartilhado com a entrada por formulário e o espelho da planilha.
      await transacao.$executeRaw`SELECT pg_advisory_xact_lock(741004)`;
      const administrador = await transacao.administrador.findUnique({
        where: { id: administradorId },
        select: { ativo: true },
      });
      if (!administrador?.ativo)
        throw new ErroGestaoEmpresa("Acesso administrativo inválido.", 403);
      const empresa = await transacao.empresa.findUnique({
        where: { id },
        select: { atualizadoEm: true },
      });
      if (!empresa) throw new ErroGestaoEmpresa("Empresa não encontrada.", 404);
      if (empresa.atualizadoEm.toISOString() !== versao)
        throw new ErroGestaoEmpresa(
          "A empresa mudou após abrir a tela. Recarregue o cadastro antes de editar novamente.",
          409,
        );
      return transacao.empresa.update({
        where: { id },
        data: {
          ...dados,
          ...(senhaHash ? { senhaHash, autorizada: true } : {}),
        },
        select: camposEmpresa,
      });
    },
    { timeout: 30000, maxWait: 10000 },
  );
}
