import { z } from "zod";
import { documentoValido } from "../importacao/baseAcademica";
import { todayInSaoPaulo } from "../validations/solicitacaoSchema";
import { calcularIdade } from "./dadosPessoais";

export const STATUS_ALUNOS = {
  DISPONIVEL: "Disponível",
  INDICADO: "Indicado",
  EM_PROCESSO: "Em processo",
  CONTRATADO: "Contratado",
};

export class ErroGestaoAluno extends Error {
  constructor(mensagem, status = 400) {
    super(mensagem);
    this.status = status;
  }
}
const textoOpcional = (maximo) => z.string().trim().max(maximo).optional().default("");
const documento = (tipo, maximo) =>
  z
    .string()
    .transform((valor) => valor.replace(/\D/g, ""))
    .refine(
      (valor) => valor.length === maximo && documentoValido(valor, tipo),
      "CPF inválido.",
    );

export const alunoSchema = z
  .object({
    nome: z.string().trim().min(2, "Informe o nome.").max(150),
    cpf: documento("CPF", 11),
    dataNascimento: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((valor) => {
        const nascimento = new Date(valor);
        return (
          !Number.isNaN(nascimento.getTime()) &&
          nascimento.toISOString().slice(0, 10) === valor &&
          valor <= todayInSaoPaulo()
        );
      }, "Nascimento inválido."),
    email: z.string().trim().email("E-mail inválido.").max(255),
    celular: z
      .string()
      .transform((valor) => valor.replace(/\D/g, ""))
      .refine((valor) => /^\d{10,13}$/.test(valor), "Celular inválido."),
    genero: z
      .enum(["", "Masculino", "Feminino", "Outro", "Prefiro não informar"])
      .default(""),
    telefone: textoOpcional(30)
      .transform((valor) => valor.replace(/\D/g, ""))
      .refine((valor) => !valor || /^\d{10,13}$/.test(valor), "Telefone inválido."),
    endereco: textoOpcional(300),
    cep: textoOpcional(10)
      .transform((valor) => valor.replace(/\D/g, ""))
      .refine((valor) => !valor || /^\d{8}$/.test(valor), "CEP inválido."),
    turmaId: z.string().uuid(),
    termo: z.number().int().min(1).max(100),
    status: z.enum(["DISPONIVEL", "INDICADO", "EM_PROCESSO", "CONTRATADO"]),
    empresaId: z.string().uuid().nullable().default(null),
  })
  .strict()
  .superRefine((dados, contexto) => {
    if (dados.status === "DISPONIVEL" && dados.empresaId)
      contexto.addIssue({
        code: "custom",
        message: "Aluno disponível não possui empresa vinculada.",
        path: ["empresaId"],
      });
    if (dados.status !== "DISPONIVEL" && !dados.empresaId)
      contexto.addIssue({
        code: "custom",
        message: "Selecione a empresa para este status.",
        path: ["empresaId"],
      });
  });
const copiarParaAuditoria = (dados) => JSON.parse(JSON.stringify(dados));

export const selectAluno = {
  id: true,
  nome: true,
  cpf: true,
  dataNascimento: true,
  email: true,
  celular: true,
  genero: true,
  telefone: true,
  endereco: true,
  cep: true,
  idade: true,
  modalidade: true,
  curso: true,
  turma: true,
  periodo: true,
  termo: true,
  statusIndicacao: true,
  empresaId: true,
  empregado: true,
  ultimaAtualizacao: true,
  arquivadoEm: true,
};

async function iniciarOperacao(transacao, administradorId) {
  // Mesmo bloqueio das entradas por formulário: leitura, comparação e escrita são atômicas.
  await transacao.$executeRaw`SELECT pg_advisory_xact_lock(741004)`;
  const administrador = await transacao.administrador.findUnique({
    where: { id: administradorId },
    select: { ativo: true },
  });
  if (!administrador?.ativo)
    throw new ErroGestaoAluno("Acesso administrativo inválido.", 403);
}

function conferirVersao(atual, versao) {
  if (!atual || atual.arquivadoEm)
    throw new ErroGestaoAluno("Aluno não encontrado.", 404);
  if (versao !== atual.ultimaAtualizacao.toISOString())
    throw new ErroGestaoAluno(
      "O aluno mudou após abrir a tela. Reabra a edição para conferir os dados atuais.",
      409,
    );
}

async function conferirTurma(transacao, dados) {
  const turma = await transacao.turma.findUnique({
    where: { id: dados.turmaId },
    include: { curso: true },
  });
  if (!turma?.quantidadeTermos || !turma.dataInicio || !turma.dataFim) {
    throw new ErroGestaoAluno("Selecione uma turma válida do catálogo.");
  }
  if (dados.termo > turma.quantidadeTermos) {
    throw new ErroGestaoAluno("Termo maior que a duração da turma.");
  }
  return turma;
}

async function conferirEmpresa(transacao, empresaId, anterior) {
  if (!empresaId) return;
  const empresa = await transacao.empresa.findUnique({
    where: { id: empresaId },
    select: { ativa: true },
  });
  // A inativação da empresa não desfaz um vínculo já registrado.
  const vinculoExistente = anterior?.empresaId === empresaId;
  if (!empresa || (!empresa.ativa && !vinculoExistente)) {
    throw new ErroGestaoAluno("Escolha uma empresa beneficiária ativa.");
  }
}

async function atualizarMatricula(transacao, alunoId, turmaId, dados, administradorId) {
  const existentes = await transacao.matricula.findMany({ where: { alunoId, turmaId } });
  if (existentes.length > 1) {
    throw new ErroGestaoAluno(
      "Há matrículas duplicadas nesta turma. Concilie antes de editar.",
      409,
    );
  }

  const anterior = existentes[0];
  const dadosMatricula = {
    termoAtual: dados.termo,
    status: dados.status,
    classificacaoPendente: false,
    empresaAtualId: dados.empresaId,
  };
  const matricula = anterior
    ? await transacao.matricula.update({
        where: { id: anterior.id },
        data: dadosMatricula,
      })
    : await transacao.matricula.create({ data: { ...dadosMatricula, alunoId, turmaId } });

  const mudouSituacao =
    !anterior ||
    anterior.status !== dados.status ||
    anterior.empresaAtualId !== dados.empresaId;
  if (mudouSituacao) {
    await transacao.historicoAcompanhamento.create({
      data: {
        matriculaId: matricula.id,
        tipo: anterior ? "ALTERACAO_STATUS" : "CARGA_INICIAL",
        statusAnterior: anterior?.status || null,
        novoStatus: dados.status,
        empresaId: dados.empresaId,
        responsavelId: administradorId,
        origem: "CADASTRO_INTERNO",
      },
    });
  }
}

export async function salvarAluno(
  prisma,
  administradorId,
  entrada,
  id = null,
  versao = null,
) {
  const validacao = alunoSchema.safeParse(entrada);
  if (!validacao.success) throw new ErroGestaoAluno(validacao.error.issues[0].message);
  const dados = validacao.data;
  try {
    return await prisma.$transaction(
      async (transacao) => {
        await iniciarOperacao(transacao, administradorId);
        const anterior = id
          ? await transacao.aluno.findUnique({ where: { id }, select: selectAluno })
          : null;
        if (id) conferirVersao(anterior, versao);
        const duplicado = await transacao.aluno.findUnique({
          where: { cpf: dados.cpf },
          select: { id: true, arquivadoEm: true },
        });
        if (duplicado && duplicado.id !== id)
          throw new ErroGestaoAluno(
            duplicado.arquivadoEm
              ? "Este CPF pertence a um cadastro excluído. Não é possível duplicá-lo."
              : "CPF já cadastrado. Abra o aluno existente para editar.",
            409,
          );
        const turma = await conferirTurma(transacao, dados);
        await conferirEmpresa(transacao, dados.empresaId, anterior);
        const idade = calcularIdade(dados.dataNascimento);
        const dadosPersistencia = {
          nome: dados.nome,
          cpf: dados.cpf,
          dataNascimento: new Date(dados.dataNascimento),
          idade,
          email: dados.email,
          celular: dados.celular,
          genero: dados.genero || null,
          telefone: dados.telefone || null,
          endereco: dados.endereco || null,
          cep: dados.cep || null,
          modalidade: turma.curso.tipoCurso,
          curso: turma.curso.nome,
          turma: turma.codigo,
          periodo: turma.turno,
          termo: dados.termo,
          statusIndicacao: STATUS_ALUNOS[dados.status],
          empresaId: dados.empresaId,
          empregado: dados.status === "CONTRATADO",
        };
        const aluno = id
          ? await transacao.aluno.update({ where: { id }, data: dadosPersistencia })
          : await transacao.aluno.create({
              data: { ...dadosPersistencia, origemCadastro: "CADASTRO_INTERNO" },
            });
        await atualizarMatricula(transacao, aluno.id, turma.id, dados, administradorId);
        const depois = await transacao.aluno.findUnique({
          where: { id: aluno.id },
          select: selectAluno,
        });
        await transacao.auditoriaAluno.create({
          data: {
            alunoId: aluno.id,
            responsavelId: administradorId,
            acao: id ? "EDITAR" : "CRIAR",
            dados: copiarParaAuditoria({ antes: anterior, depois }),
          },
        });
        return { id: aluno.id };
      },
      { timeout: 30000, maxWait: 10000 },
    );
  } catch (erroCapturado) {
    if (erroCapturado.code === "P2002")
      throw new ErroGestaoAluno("CPF já cadastrado.", 409);
    throw erroCapturado;
  }
}

export async function excluirAluno(prisma, administradorId, id, versao) {
  return prisma.$transaction(
    async (transacao) => {
      await iniciarOperacao(transacao, administradorId);
      const anterior = await transacao.aluno.findUnique({
        where: { id },
        select: selectAluno,
      });
      conferirVersao(anterior, versao);
      const depois = await transacao.aluno.update({
        where: { id },
        data: { arquivadoEm: new Date() },
        select: selectAluno,
      });
      await transacao.auditoriaAluno.create({
        data: {
          alunoId: id,
          responsavelId: administradorId,
          acao: "EXCLUIR",
          dados: copiarParaAuditoria({ antes: anterior, depois }),
        },
      });
      return { id };
    },
    { timeout: 30000, maxWait: 10000 },
  );
}
