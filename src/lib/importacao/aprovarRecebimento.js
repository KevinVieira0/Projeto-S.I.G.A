import { normalizar, normalizarTipoCurso } from "./baseAcademica";
import { hashDados, ErroRecebimento } from "./recebimentos";
import { calcularIdade } from "../alunos/dadosPessoais";

const dia = (valor) => (valor ? new Date(valor).toISOString().slice(0, 10) : null);
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
  return { atual, matriculas, versao: hashDados({ atual, matriculas }) };
}

async function obterTurma(transacao, oferta) {
  const chave = hashDados([normalizar(oferta.nome), normalizar(oferta.tipo)]);
  const cursos = await transacao.curso.findMany({
    where: {},
    select: { id: true, chave: true, nome: true, tipoCurso: true },
  });
  const equivalentes = cursos.filter(
    (cursoCandidato) =>
      normalizar(cursoCandidato.nome) === normalizar(oferta.nome) &&
      normalizarTipoCurso(cursoCandidato.tipoCurso) === normalizarTipoCurso(oferta.tipo),
  );
  if (equivalentes.length > 1)
    throw new ErroRecebimento(
      "Curso duplicado ou ambíguo; concilie o catálogo antes de aprovar.",
      409,
    );
  let curso = equivalentes[0];
  if (!curso)
    curso = await transacao.curso.create({
      data: { chave, nome: oferta.nome, tipoCurso: oferta.tipo },
    });
  const candidatas = await transacao.turma.findMany({ where: { cursoId: curso.id } });
  const correspondentes = candidatas.filter(
    (turma) =>
      normalizar(turma.codigo) === normalizar(oferta.codigo) &&
      normalizar(turma.turno) === normalizar(oferta.turno) &&
      dia(turma.dataInicio) === oferta.inicio &&
      dia(turma.dataFim) === oferta.fim,
  );
  if (correspondentes.length > 1)
    throw new ErroRecebimento(
      "Oferta acadêmica ambígua; concilie as turmas antes de aprovar.",
      409,
    );
  if (correspondentes[0]) {
    if (correspondentes[0].quantidadeTermos !== oferta.termos)
      throw new ErroRecebimento("Duração da turma diverge do banco.", 409);
    return correspondentes[0];
  }
  // Uma oferta com datas não substitui a oferta legada sem datas.
  return transacao.turma.create({
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
}

async function definirSituacaoInicial(transacao, contexto, opcoes, automatico) {
  if (automatico) {
    // O formulário atualiza dados acadêmicos, mas preserva a situação definida pela equipe.
    return {
      ...opcoes,
      status:
        Object.keys(rotulos).find(
          (chave) => rotulos[chave] === contexto.atual?.statusIndicacao,
        ) || "DISPONIVEL",
      empresaId: contexto.atual?.empresaId || null,
    };
  }
  if (!rotulos[opcoes.status]) {
    throw new ErroRecebimento(
      "Escolha explicitamente o status inicial da nova matrícula.",
    );
  }
  if (opcoes.status === "DISPONIVEL" && opcoes.empresaId) {
    throw new ErroRecebimento("Disponível não pode ter empresa vinculada.");
  }
  if (opcoes.status !== "DISPONIVEL") {
    const empresa =
      opcoes.empresaId &&
      (await transacao.empresa.findUnique({
        where: { id: opcoes.empresaId },
        select: { ativa: true },
      }));
    if (!empresa?.ativa)
      throw new ErroRecebimento("Escolha uma empresa ativa para este status.");
  }
  return opcoes;
}

async function salvarCadastroEmpresa(transacao, dados, contexto) {
  let entidade;
  const dadosPersistencia = {
    razaoSocial: dados.nome,
    email: dados.email,
    telefone: dados.telefone,
    ...(dados.nomeFantasia ? { nomeFantasia: dados.nomeFantasia } : {}),
    ...(dados.contribuinte !== null ? { contribuinte: dados.contribuinte } : {}),
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

async function salvarCadastroAluno(
  transacao,
  recebimento,
  contexto,
  opcoes,
  automatico,
  administradorId,
) {
  const dados = recebimento.dados;
  let entidade;
  let matriculaId = null;
  const idade = calcularIdade(dados.nascimento);
  const dadosPersistencia = {
    nome: dados.nome,
    email: dados.email,
    celular: dados.celular,
    dataNascimento: new Date(dados.nascimento),
    idade,
    origemCadastro: "FORMULARIO_V2",
    ultimaSincronizacao: new Date(),
  };
  // Campo opcional em branco não apaga informação administrativa existente.
  for (const chave of ["genero", "telefone", "endereco", "cep"])
    if (dados[chave]) dadosPersistencia[chave] = dados[chave];
  const academico = automatico || !contexto.atual || opcoes.atualizarAcademico === true;
  let turma;
  let matricula;
  if (academico) {
    turma = await obterTurma(transacao, dados.oferta);
    const mesmas = contexto.matriculas.filter(
      (matriculaCandidata) => matriculaCandidata.turmaId === turma.id,
    );
    if (mesmas.length > 1)
      throw new ErroRecebimento(
        "Mais de uma matrícula nesta turma. Resolva a duplicidade antes de aprovar.",
        409,
      );
    matricula = mesmas[0];
    if (!matricula) {
      opcoes = await definirSituacaoInicial(transacao, contexto, opcoes, automatico);
    }
    Object.assign(dadosPersistencia, {
      modalidade: dados.oferta.tipo,
      curso: dados.oferta.nome,
      turma: dados.oferta.codigo,
      periodo: dados.oferta.turno,
      termo: dados.termo,
    });
    const status = matricula?.status || (!matricula ? opcoes.status : null);
    if (!automatico && status)
      Object.assign(dadosPersistencia, {
        statusIndicacao: rotulos[status],
        empresaId: matricula ? matricula.empresaAtualId : opcoes.empresaId || null,
        empregado: status === "CONTRATADO",
      });
    if (automatico && !contexto.atual)
      Object.assign(dadosPersistencia, {
        statusIndicacao: "Disponível",
        empresaId: null,
        empregado: false,
      });
  }
  entidade = contexto.atual
    ? await transacao.aluno.update({
        where: { id: contexto.atual.id },
        data: dadosPersistencia,
      })
    : await transacao.aluno.create({
        data: { ...dadosPersistencia, cpf: dados.documento },
      });
  if (academico) {
    if (matricula)
      await transacao.matricula.update({
        where: { id: matricula.id },
        data: { termoAtual: dados.termo, ultimaSincronizacao: new Date() },
      });
    else {
      matricula = await transacao.matricula.create({
        data: {
          alunoId: entidade.id,
          turmaId: turma.id,
          termoAtual: dados.termo,
          status: opcoes.status || null,
          classificacaoPendente: !opcoes.status,
          empresaAtualId: opcoes.empresaId || null,
        },
      });
      await transacao.historicoAcompanhamento.create({
        data: {
          matriculaId: matricula.id,
          tipo: "CARGA_INICIAL",
          novoStatus: opcoes.status || null,
          empresaId: opcoes.empresaId || null,
          responsavelId: administradorId || null,
          origem: automatico ? "AUTOMATICO_CPF" : "FORMULARIO_V2",
          chaveMigracao: "recebimento:" + recebimento.id,
        },
      });
    }
    matriculaId = matricula.id;
  }
  return { entidade, matriculaId };
}

export async function revisarRecebimento(
  prisma,
  id,
  administradorId,
  opcoes,
  automatico = false,
) {
  return prisma.$transaction(
    async (transacao) => {
      // Compartilhado com a ingestão; evita duas aprovações simultâneas do mesmo documento.
      await transacao.$executeRaw`SELECT pg_advisory_xact_lock(741004)`;
      if (!automatico) {
        const administrador = await transacao.administrador.findUnique({
          where: { id: administradorId },
          select: { ativo: true },
        });
        if (!administrador?.ativo)
          throw new ErroRecebimento("Administrador inválido.", 403);
      }
      const recebimento = await transacao.recebimentoCadastro.findUnique({
        where: { id },
      });
      if (!recebimento) throw new ErroRecebimento("Recebimento não encontrado.", 404);
      if (automatico && recebimento.tipo !== "ALUNO")
        throw new ErroRecebimento("Empresas exigem conferência administrativa.", 403);
      if (recebimento.estado !== "PENDENTE")
        return {
          estado: recebimento.estado,
          entidadeId: recebimento.entidadeId,
          repetido: true,
        };
      if (!automatico && opcoes.hash !== recebimento.hash)
        throw new ErroRecebimento("Recarregue o recebimento antes de confirmar.", 409);
      if (opcoes.acao === "rejeitar") {
        await transacao.recebimentoCadastro.update({
          where: { id },
          data: {
            estado: "REJEITADO",
            responsavelId: administradorId,
            revisadoEm: new Date(),
          },
        });
        return { estado: "REJEITADO" };
      }
      if (opcoes.acao !== "aprovar" || recebimento.erros.length)
        throw new ErroRecebimento(
          "Corrija os dados na origem e envie uma nova resposta antes de aprovar.",
        );
      const dados = recebimento.dados;
      await transacao.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${recebimento.tipo + ":" + dados.documento}))`;
      const contexto = await contextoRecebimento(transacao, recebimento);
      if (recebimento.tipo === "ALUNO" && contexto.atual?.arquivadoEm) {
        await transacao.recebimentoCadastro.update({
          where: { id },
          data: {
            estado: "REJEITADO",
            revisadoEm: new Date(),
            auditoria: {
              origem: "AUTOMATICO_CPF",
              motivo:
                "Cadastro excluído pela administração; não reativar automaticamente",
            },
          },
        });
        return { estado: "REJEITADO", ignorado: true };
      }
      if (!automatico && opcoes.versao !== contexto.versao)
        throw new ErroRecebimento(
          "O cadastro mudou durante a conferência. Recarregue e revise novamente.",
          409,
        );
      const posterior = await transacao.recebimentoCadastro.findFirst({
        where: {
          tipo: recebimento.tipo,
          estado: "APROVADO",
          recebidoEm: { gt: recebimento.recebidoEm },
          dados: { path: ["documento"], equals: dados.documento },
        },
        select: { id: true },
      });
      if (posterior) {
        if (!automatico)
          throw new ErroRecebimento(
            "Há um envio mais recente já aprovado. Rejeite este envio antigo.",
            409,
          );
        await transacao.recebimentoCadastro.update({
          where: { id },
          data: {
            estado: "REJEITADO",
            revisadoEm: new Date(),
            auditoria: {
              origem: "AUTOMATICO_CPF",
              motivo: "Envio anterior a outro já processado",
            },
          },
        });
        return { estado: "REJEITADO", ignorado: true };
      }
      const { entidade, matriculaId } =
        recebimento.tipo === "EMPRESA"
          ? await salvarCadastroEmpresa(transacao, dados, contexto)
          : await salvarCadastroAluno(
              transacao,
              recebimento,
              contexto,
              opcoes,
              automatico,
              administradorId,
            );
      const depois = await contextoRecebimento(transacao, recebimento);
      await transacao.recebimentoCadastro.update({
        where: { id },
        data: {
          estado: "APROVADO",
          responsavelId: administradorId || null,
          revisadoEm: new Date(),
          entidadeId: entidade.id,
          auditoria: {
            origem: automatico ? "AUTOMATICO_CPF" : "REVISAO_ADMINISTRATIVA",
            antes: JSON.parse(JSON.stringify(contexto)),
            depois: JSON.parse(JSON.stringify(depois)),
            matriculaId,
          },
        },
      });
      return {
        estado: "APROVADO",
        entidadeId: entidade.id,
        matriculaId,
        operacao: contexto.atual ? "atualizado" : "criado",
      };
    },
    { timeout: 30000, maxWait: 10000 },
  );
}
