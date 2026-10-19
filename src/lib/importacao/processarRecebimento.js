import { normalizar, normalizarTipoCurso } from "./baseAcademica";
import { hashDados, ErroRecebimento } from "./recebimentos";
import { calcularIdade } from "../alunos/dadosPessoais";

const dia = (valor) =>
  valor ? new Date(valor).toISOString().slice(0, 10) : null;
const rotulos = {
  DISPONIVEL: "Disponível",
  INDICADO: "Indicado",
  EM_PROCESSO: "Em processo",
  CONTRATADO: "Contratado",
};
const camposAluno = {
  nome: true,
  cpf: true,
  celular: true,
  email: true,
  genero: true,
  dataNascimento: true,
  telefone: true,
  endereco: true,
  cep: true,
  curso: true,
  modalidade: true,
  turma: true,
  periodo: true,
  termo: true,
  statusIndicacao: true,
  empresaId: true,
  empregado: true,
  ultimaAtualizacao: true,
  id: true,
  arquivadoEm: true,
};
const camposEmpresa = {
  id: true,
  cnpj: true,
  razaoSocial: true,
  nomeFantasia: true,
  email: true,
  telefone: true,
  contribuinte: true,
  ativa: true,
  autorizada: true,
  atualizadoEm: true,
};

export async function contextoRecebimento(transacao, recebimento) {
  const atual =
    recebimento.tipo === "ALUNO"
      ? await transacao.aluno.findUnique({
          where: { cpf: recebimento.dados.documento },
          select: camposAluno,
        })
      : await transacao.empresa.findUnique({
          where: { cnpj: recebimento.dados.documento },
          select: camposEmpresa,
        });
  const matriculas =
    recebimento.tipo === "ALUNO" && atual
      ? await transacao.matricula.findMany({
          where: { alunoId: atual.id },
          orderBy: { id: "asc" },
          include: { turma: true },
        })
      : [];
  return { atual, matriculas };
}

export async function obterTurma(transacao, oferta, catalogo = null) {
  const chave = hashDados([normalizar(oferta.nome), normalizar(oferta.tipo)]);
  const cursos =
    catalogo?.cursos ||
    (await transacao.curso.findMany({
      where: {},
      select: { id: true, chave: true, nome: true, tipoCurso: true },
    }));
  const equivalentes = cursos.filter(
    (cursoCandidato) =>
      normalizar(cursoCandidato.nome) === normalizar(oferta.nome) &&
      normalizarTipoCurso(cursoCandidato.tipoCurso) ===
        normalizarTipoCurso(oferta.tipo),
  );
  if (equivalentes.length > 1)
    throw new ErroRecebimento(
      "Curso duplicado ou ambíguo; concilie o catálogo antes de processar.",
      409,
    );
  let curso = equivalentes[0];
  if (!curso) {
    curso = await transacao.curso.create({
      data: { chave, nome: oferta.nome, tipoCurso: oferta.tipo },
    });
    catalogo?.cursos.push(curso);
  }
  const candidatas = catalogo
    ? catalogo.turmas.filter((t) => t.cursoId === curso.id)
    : await transacao.turma.findMany({ where: { cursoId: curso.id } });
  const correspondentes = candidatas.filter(
    (turma) =>
      normalizar(turma.codigo) === normalizar(oferta.codigo) &&
      normalizar(turma.turno) === normalizar(oferta.turno) &&
      dia(turma.dataInicio) === oferta.inicio &&
      dia(turma.dataFim) === oferta.fim,
  );
  if (correspondentes.length > 1)
    throw new ErroRecebimento(
      "Oferta acadêmica ambígua; concilie as turmas antes de processar.",
      409,
    );
  if (correspondentes[0]) {
    if (correspondentes[0].quantidadeTermos !== oferta.termos)
      throw new ErroRecebimento("Duração da turma diverge do banco.", 409);
    return correspondentes[0];
  }
  // Uma oferta com datas não substitui a oferta legada sem datas.
  const turma = await transacao.turma.create({
    data: {
      chave: hashDados([
        "OFERTA_V2",
        curso.chave,
        normalizar(oferta.codigo),
        normalizar(oferta.turno),
        oferta.inicio,
        oferta.fim,
      ]),
      cursoId: curso.id,
      codigo: oferta.codigo,
      turno: oferta.turno,
      dataInicio: new Date(oferta.inicio),
      dataFim: new Date(oferta.fim),
      quantidadeTermos: oferta.termos,
      origem: "FORMULARIO_V2",
    },
  });
  catalogo?.turmas.push(turma);
  return turma;
}

async function salvarCadastroEmpresa(transacao, dados, contexto) {
  let entidade;
  const dadosPersistencia = {
    razaoSocial: dados.nome,
    email: dados.email,
    telefone: dados.telefone,
    ...(dados.nomeFantasia ? { nomeFantasia: dados.nomeFantasia } : {}),
    ...(dados.contribuinte !== null
      ? { contribuinte: dados.contribuinte }
      : {}),
  };
  entidade = contexto.atual
    ? await transacao.empresa.update({
        where: { id: contexto.atual.id },
        data: dadosPersistencia,
      })
    : await transacao.empresa.create({
        data: {
          ...dadosPersistencia,
          cnpj: dados.documento,
          autorizada: false,
          ativa: true,
        },
      });
  return { entidade, matriculaId: null };
}

async function salvarCadastroAluno(transacao, recebimento, contexto) {
  const dados = recebimento.dados;
  const dadosPersistencia = {
    nome: dados.nome,
    email: dados.email,
    celular: dados.celular,
    dataNascimento: new Date(dados.nascimento),
    idade: calcularIdade(dados.nascimento),
    origemCadastro: "FORMULARIO_V2",
    ultimaSincronizacao: new Date(),
    modalidade: dados.oferta.tipo,
    curso: dados.oferta.nome,
    turma: dados.oferta.codigo,
    periodo: dados.oferta.turno,
    termo: dados.termo,
  };
  // Campo opcional em branco não apaga informação administrativa existente.
  for (const chave of ["genero", "telefone", "endereco", "cep"])
    if (dados[chave]) dadosPersistencia[chave] = dados[chave];
  if (!contexto.atual)
    Object.assign(dadosPersistencia, {
      statusIndicacao: "Disponível",
      empresaId: null,
      empregado: false,
    });
  const turma = await obterTurma(transacao, dados.oferta);
  const mesmas = contexto.matriculas.filter((m) => m.turmaId === turma.id);
  if (mesmas.length > 1)
    throw new ErroRecebimento(
      "Mais de uma matrícula nesta turma. Resolva a duplicidade antes de processar.",
      409,
    );
  const entidade = contexto.atual
    ? await transacao.aluno.update({
        where: { id: contexto.atual.id },
        data: dadosPersistencia,
      })
    : await transacao.aluno.create({
        data: { ...dadosPersistencia, cpf: dados.documento },
      });
  let matricula = mesmas[0];
  if (matricula)
    matricula = await transacao.matricula.update({
      where: { id: matricula.id },
      data: { termoAtual: dados.termo, ultimaSincronizacao: new Date() },
    });
  else {
    // Nova turma preserva a situação profissional definida pela equipe.
    matricula = await transacao.matricula.create({
      data: {
        alunoId: entidade.id,
        turmaId: turma.id,
        termoAtual: dados.termo,
        status:
          Object.keys(rotulos).find(
            (chave) => rotulos[chave] === contexto.atual?.statusIndicacao,
          ) || "DISPONIVEL",
        classificacaoPendente: false,
        empresaAtualId: contexto.atual?.empresaId || null,
        ultimaSincronizacao: new Date(),
      },
    });
    await transacao.historicoAcompanhamento.create({
      data: {
        matriculaId: matricula.id,
        tipo: "CARGA_INICIAL",
        novoStatus: matricula.status,
        empresaId: matricula.empresaAtualId,
        origem: "AUTOMATICO_CPF",
        chaveMigracao: "recebimento:" + recebimento.id,
      },
    });
  }
  return { entidade, matriculaId: matricula.id };
}

export async function processarRecebimento(prisma, id) {
  return prisma.$transaction(
    async (transacao) => {
      await transacao.$executeRaw`SELECT pg_advisory_xact_lock(741004)`;
      const recebimento = await transacao.recebimentoCadastro.findUnique({
        where: { id },
      });
      if (!recebimento)
        throw new ErroRecebimento("Recebimento não encontrado.", 404);
      if (recebimento.estado !== "PENDENTE")
        return {
          estado: recebimento.estado,
          entidadeId: recebimento.entidadeId,
          repetido: true,
        };
      if (
        !["ALUNO", "EMPRESA"].includes(recebimento.tipo) ||
        recebimento.erros.length
      )
        throw new ErroRecebimento("Recebimento inválido para processamento.");
      const contexto = await contextoRecebimento(transacao, recebimento);
      const posterior = await transacao.recebimentoCadastro.findFirst({
        where: {
          fonte: recebimento.fonte,
          tipo: recebimento.tipo,
          estado: "PROCESSADO",
          recebidoEm: { gt: recebimento.recebidoEm },
          dados: { path: ["documento"], equals: recebimento.dados.documento },
        },
        select: { id: true },
      });
      const motivo = contexto.atual?.arquivadoEm
        ? "Cadastro excluído pela administração; não reativar automaticamente"
        : posterior
          ? "Envio anterior a outro já processado"
          : null;
      const origem =
        recebimento.tipo === "ALUNO" ? "AUTOMATICO_CPF" : "AUTOMATICO_CNPJ";
      if (motivo) {
        await transacao.recebimentoCadastro.update({
          where: { id },
          data: {
            estado: "IGNORADO",
            processadoEm: new Date(),
            auditoria: { origem, motivo },
          },
        });
        return { estado: "IGNORADO", ignorado: true };
      }
      const { entidade, matriculaId } =
        recebimento.tipo === "EMPRESA"
          ? await salvarCadastroEmpresa(transacao, recebimento.dados, contexto)
          : await salvarCadastroAluno(transacao, recebimento, contexto);
      const depois = await contextoRecebimento(transacao, recebimento);
      await transacao.recebimentoCadastro.update({
        where: { id },
        data: {
          estado: "PROCESSADO",
          processadoEm: new Date(),
          entidadeId: entidade.id,
          auditoria: {
            origem,
            antes: JSON.parse(JSON.stringify(contexto)),
            depois: JSON.parse(JSON.stringify(depois)),
            matriculaId,
          },
        },
      });
      return {
        estado: "PROCESSADO",
        entidadeId: entidade.id,
        matriculaId,
        operacao: contexto.atual ? "atualizado" : "criado",
      };
    },
    { timeout: 30000, maxWait: 10000 },
  );
}
