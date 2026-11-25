import { z } from "zod";
import { hash } from "bcryptjs";
import { isValidCnpjFormat, onlyDigits } from "@/lib/validations/cnpjUtils";

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

const cadastroEmpresaSchema = z
  .object({
    razaoSocial: z.string().trim().min(1, "Informe a razão social.").max(255),
    nomeFantasia: z
      .string()
      .trim()
      .max(255)
      .optional()
      .transform((valor) => valor || null),
    cnpj: z
      .string()
      .trim()
      .max(18)
      .refine(
        (valor) => /^[\d.\/\-]+$/.test(valor) && isValidCnpjFormat(valor),
        "Informe um CNPJ válido.",
      )
      .transform(onlyDigits),
    email: z
      .string()
      .trim()
      .max(255)
      .email("Informe um e-mail válido.")
      .toLowerCase(),
    telefone: z
      .string()
      .trim()
      .max(20)
      .refine(
        (valor) =>
          /^[+\d\s().-]+$/.test(valor) && /^\d{10,13}$/.test(onlyDigits(valor)),
        "Informe um telefone com DDD.",
      )
      .transform(onlyDigits),
    contribuinte: z
      .enum(["Sim", "Não", "Não informado"])
      .transform((valor) =>
        valor === "Não informado" ? null : valor === "Sim",
      ),
  })
  .strict();

async function iniciarCadastro(transacao, administradorId) {
  // Compartilhado com a entrada por formulário e o espelho da planilha.
  await transacao.$executeRaw`SELECT pg_advisory_xact_lock(741004)`;
  const administrador = await transacao.administrador.findUnique({
    where: { id: administradorId },
    select: { ativo: true },
  });
  if (!administrador?.ativo)
    throw new ErroGestaoEmpresa("Acesso administrativo inválido.", 403);
}

export async function criarEmpresa(prisma, administradorId, entrada) {
  const validacao = cadastroEmpresaSchema.safeParse(entrada);
  if (!validacao.success)
    throw new ErroGestaoEmpresa(validacao.error.issues[0].message);
  try {
    return await prisma.$transaction(
      async (transacao) => {
        await iniciarCadastro(transacao, administradorId);
        return transacao.empresa.create({
          data: { ...validacao.data, ativa: true, autorizada: false },
          select: camposEmpresa,
        });
      },
      { timeout: 30000, maxWait: 10000 },
    );
  } catch (erro) {
    if (erro.code === "P2002")
      throw new ErroGestaoEmpresa("Já existe uma empresa com este CNPJ.", 409);
    throw erro;
  }
}

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
      await iniciarCadastro(transacao, administradorId);
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
