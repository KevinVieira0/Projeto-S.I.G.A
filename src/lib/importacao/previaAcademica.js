import {
  limpar,
  normalizar,
  normalizarTipoCurso,
  validarBaseAcademica,
} from "./baseAcademica";

const dia = (valor) => (valor ? new Date(valor).toISOString().slice(0, 10) : null);
const iguais = (a, b) => limpar(a) === limpar(b);
const chaveCurso = (nome, tipo) =>
  JSON.stringify([normalizar(nome), normalizarTipoCurso(tipo)]);

async function buscarEmLotes(modelo, campo, valores, camposSelecionados) {
  const unicos = [...new Set(valores.filter(Boolean))];
  const linhas = [];
  for (let indice = 0; indice < unicos.length; indice += 200)
    linhas.push(
      ...(await modelo.findMany({
        where: { [campo]: { in: unicos.slice(indice, indice + 200) } },
        select: camposSelecionados,
      })),
    );
  return linhas;
}

export async function gerarPreviaAcademica(prisma, abas, opcoes = {}) {
  const validacao = validarBaseAcademica(abas, opcoes);
  return prisma.$transaction(
    async (transacao) => {
      await transacao.$executeRaw`SET TRANSACTION READ ONLY`;
      const linhas = Object.fromEntries(
        Object.entries(validacao.registros).map(([aba, registros]) => [
          aba,
          registros.filter((registro) => registro.valido),
        ]),
      );
      const alunos = await buscarEmLotes(
        transacao.aluno,
        "cpf",
        linhas.Alunos.map((registro) => registro.CPF),
        {
          id: true,
          cpf: true,
          nome: true,
          dataNascimento: true,
          genero: true,
          telefone: true,
          celular: true,
          email: true,
          endereco: true,
          cep: true,
        },
      );
      const empresas = await buscarEmLotes(
        transacao.empresa,
        "cnpj",
        linhas.Empresas.map((registro) => registro.CNPJ),
        { id: true, cnpj: true, razaoSocial: true, contribuinte: true, ativa: true },
      );
      const cursos = await transacao.curso.findMany({
        select: { id: true, nome: true, tipoCurso: true },
      });
      const turmas = await transacao.turma.findMany({
        select: {
          id: true,
          cursoId: true,
          codigo: true,
          turno: true,
          dataInicio: true,
          dataFim: true,
          quantidadeTermos: true,
        },
      });
      const matriculas = await buscarEmLotes(
        transacao.matricula,
        "alunoId",
        alunos.map((registro) => registro.id),
        {
          id: true,
          alunoId: true,
          turmaId: true,
          termoAtual: true,
          status: true,
          empresaAtualId: true,
          classificacaoPendente: true,
        },
      );
      const porCpf = new Map(alunos.map((registro) => [registro.cpf, registro]));
      const porCnpj = new Map(empresas.map((registro) => [registro.cnpj, registro]));
      const porCurso = new Map();
      for (const curso of cursos) {
        const chave = chaveCurso(curso.nome, curso.tipoCurso);
        porCurso.set(chave, [...(porCurso.get(chave) || []), curso]);
      }
      const cursoRefs = new Map();
      const turmaRefs = new Map();
      const alunoRefs = new Map();
      const empresaRefs = new Map();
      const alunosComMatricula = new Set(
        linhas.Matriculas.map((registro) => registro["ID Aluno"]),
      );
      const conciliacao = Object.fromEntries(
        Object.keys(linhas).map((aba) => [aba, { novos: 0, existentes: 0, revisar: 0 }]),
      );
      const revisoes = [];
      let totalRevisoes = 0;
      const revisar = (aba, linha, codigo) => {
        conciliacao[aba].revisar++;
        totalRevisoes++;
        if (revisoes.length < 200) revisoes.push({ aba, linha: linha.linha, codigo });
      };
      const uuid = (valor) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          valor || "",
        );
      for (const linha of linhas.Cursos) {
        const correspondentes =
          porCurso.get(chaveCurso(linha["Nome do curso"], linha["Tipo de curso"])) || [];
        if (
          !correspondentes.length &&
          cursos.some(
            (curso) => normalizar(curso.nome) === normalizar(linha["Nome do curso"]),
          )
        ) {
          revisar("Cursos", linha, "TIPO_CURSO_DIVERGENTE");
          continue;
        }
        if (
          correspondentes.length > 1 ||
          (uuid(linha["ID Curso"]) && linha["ID Curso"] !== correspondentes[0]?.id)
        ) {
          revisar("Cursos", linha, "IDENTIDADE_CURSO_DIVERGENTE");
          continue;
        }
        const existente = correspondentes[0];
        cursoRefs.set(linha["ID Curso"], existente || { novo: true });
        conciliacao.Cursos[existente ? "existentes" : "novos"]++;
      }
      for (const linha of linhas.Turmas) {
        const curso = cursoRefs.get(linha["ID Curso"]);
        if (!curso) {
          revisar("Turmas", linha, "CURSO_EM_REVISAO");
          continue;
        }
        const candidatos = curso.novo
          ? []
          : turmas.filter(
              (turma) =>
                turma.cursoId === curso.id &&
                normalizar(turma.codigo) === normalizar(linha["Código da turma"]) &&
                normalizar(turma.turno) === normalizar(linha.Turno),
            );
        const correspondenteExato = candidatos.filter(
          (t) =>
            dia(t.dataInicio) === linha["Data de início"] &&
            dia(t.dataFim) === linha["Data de fim"],
        );
        if (
          correspondenteExato.length > 1 ||
          (!correspondenteExato.length &&
            candidatos.some((t) => !t.dataInicio || !t.dataFim))
        ) {
          revisar("Turmas", linha, "OFERTA_LEGADA_OU_AMBIGUA");
          continue;
        }
        const existente = correspondenteExato[0];
        if (
          (uuid(linha["ID Turma"]) && linha["ID Turma"] !== existente?.id) ||
          (existente &&
            existente.quantidadeTermos !== linha["Quantidade total de termos"])
        ) {
          revisar("Turmas", linha, "TURMA_DIVERGENTE");
          continue;
        }
        turmaRefs.set(linha["ID Turma"], existente || { novo: true });
        conciliacao.Turmas[existente ? "existentes" : "novos"]++;
      }
      const camposAluno = {
        "Nome completo": "nome",
        Gênero: "genero",
        Telefone: "telefone",
        Celular: "celular",
        "E-mail": "email",
        "Endereço do aluno": "endereco",
        CEP: "cep",
      };
      for (const linha of linhas.Alunos) {
        const existente = porCpf.get(linha.CPF);
        if (uuid(linha["ID Aluno"]) && linha["ID Aluno"] !== existente?.id) {
          revisar("Alunos", linha, "IDENTIDADE_ALUNO_DIVERGENTE");
          continue;
        }
        if (!existente && !alunosComMatricula.has(linha["ID Aluno"])) {
          revisar("Alunos", linha, "NOVO_ALUNO_SEM_MATRICULA_VALIDA");
          continue;
        }
        alunoRefs.set(linha["ID Aluno"], existente || { novo: true });
        if (
          existente &&
          (dia(existente.dataNascimento) !== linha["Data de nascimento"] ||
            Object.entries(camposAluno).some(
              ([campo, chave]) => !iguais(linha[campo], existente[chave]),
            ))
        )
          revisar("Alunos", linha, "CADASTRO_EXISTENTE_PRESERVADO");
        else conciliacao.Alunos[existente ? "existentes" : "novos"]++;
      }
      for (const linha of linhas.Empresas) {
        const existente = porCnpj.get(linha.CNPJ);
        if (uuid(linha["ID Empresa"]) && linha["ID Empresa"] !== existente?.id) {
          revisar("Empresas", linha, "IDENTIDADE_EMPRESA_DIVERGENTE");
          continue;
        }
        if (
          existente &&
          (!existente.ativa ||
            !iguais(existente.razaoSocial, linha["Nome da empresa"]) ||
            existente.contribuinte !== linha["Contribuinte?"])
        ) {
          revisar("Empresas", linha, "EMPRESA_EXISTENTE_PRESERVADA");
          continue;
        }
        empresaRefs.set(linha["ID Empresa"], existente || { novo: true });
        conciliacao.Empresas[existente ? "existentes" : "novos"]++;
      }
      for (const linha of linhas.Matriculas) {
        const aluno = alunoRefs.get(linha["ID Aluno"]);
        const turma = turmaRefs.get(linha["ID Turma"]);
        const empresa = linha["ID Empresa atual"]
          ? empresaRefs.get(linha["ID Empresa atual"])
          : null;
        if (!aluno || !turma || (linha["ID Empresa atual"] && !empresa)) {
          revisar("Matriculas", linha, "VINCULO_EM_REVISAO");
          continue;
        }
        const candidatos =
          aluno.novo || turma.novo
            ? []
            : matriculas.filter(
                (matricula) =>
                  matricula.alunoId === aluno.id && matricula.turmaId === turma.id,
              );
        if (candidatos.length > 1) {
          revisar("Matriculas", linha, "MATRICULAS_MULTIPLAS");
          continue;
        }
        const existente = candidatos[0];
        if (uuid(linha["ID Matrícula"]) && linha["ID Matrícula"] !== existente?.id) {
          revisar("Matriculas", linha, "IDENTIDADE_MATRICULA_DIVERGENTE");
          continue;
        }
        if (
          existente &&
          (existente.classificacaoPendente ||
            existente.status !== linha.Status ||
            existente.termoAtual !== linha["Termo atual"] ||
            (existente.empresaAtualId || null) !== (empresa?.id || null) ||
            empresa?.novo)
        )
          revisar("Matriculas", linha, "ACOMPANHAMENTO_DO_SISTEMA_PRESERVADO");
        else conciliacao.Matriculas[existente ? "existentes" : "novos"]++;
      }
      return {
        modo: "PREVIA_SEM_GRAVACAO",
        gravacaoHabilitada: false,
        contagens: validacao.contagens,
        conciliacao,
        totalProblemas: validacao.totalProblemas,
        problemas: validacao.problemas,
        problemasOmitidos: validacao.problemasOmitidos,
        totalRevisoes,
        revisoes,
        revisoesOmitidas: Math.max(0, totalRevisoes - revisoes.length),
        observacoes: [
          "Nenhum dado foi gravado; linhas de Preparacao e Historico não são importadas.",
          "Status, vínculos e cadastros existentes não são sobrescritos. Divergências exigem revisão.",
          "Novos significa candidato à inclusão, não registro já criado ou autorização de acesso.",
          "Confirmar datas acadêmicas, matrícula usada nos indicadores e regras de edição antes da carga definitiva.",
        ],
      };
    },
    { isolationLevel: "RepeatableRead", timeout: 60000, maxWait: 10000 },
  );
}
