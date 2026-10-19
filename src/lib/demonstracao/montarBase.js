import { normalizar, documentoValido } from "../importacao/baseAcademica";
import { hashDados } from "../importacao/recebimentos";

const rotulos = {
  DISPONIVEL: "Disponível",
  INDICADO: "Indicado",
  EM_PROCESSO: "Em processo",
  CONTRATADO: "Contratado",
};

export const contarBase = async (transacao) => ({
  alunos: await transacao.aluno.count(),
  empresas: await transacao.empresa.count(),
  matriculas: await transacao.matricula.count(),
  historico: await transacao.historicoAcompanhamento.count(),
  auditoria: await transacao.auditoriaAluno.count(),
  pendencias: await transacao.pendenciaMigracao.count(),
  cursos: await transacao.curso.count(),
  turmas: await transacao.turma.count(),
  recebimentos: await transacao.recebimentoCadastro.count(),
  solicitacoes: await transacao.solicitacao.count(),
  administradores: await transacao.administrador.count(),
});

function documento(base, tipo) {
  const digito = (s) => {
    const pesos =
      tipo === "CPF"
        ? Array.from({ length: s.length }, (_, indice) => s.length + 1 - indice)
        : s.length === 12
          ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
          : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const registro =
      s
        .split("")
        .reduce((a, dados, indice) => a + Number(dados) * pesos[indice], 0) %
      11;
    return String(registro < 2 ? 0 : 11 - registro);
  };
  const saida = base + digito(base) + digito(base + digito(base));
  if (!documentoValido(saida, tipo))
    throw new Error("Documento fictício inválido.");
  return saida;
}

export async function montarDemonstracao(transacao, catalogo) {
  const antigos = await contarBase(transacao);
  // IDs/hashes retidos impedem reaparecimento das respostas antigas na releitura.
  // Dados pessoais, vínculos e auditorias antigos são removidos deste ambiente.
  await transacao.recebimentoCadastro.updateMany({
    data: {
      dados: { removidoParaDemonstracao: true },
      erros: [],
      estado: "IGNORADO",
      entidadeId: null,
      auditoria: {
        motivo: "Base substituída por demonstração a pedido do usuário",
      },
      processadoEm: new Date(),
    },
  });
  await transacao.pendenciaMigracao.deleteMany();
  await transacao.auditoriaAluno.deleteMany();
  await transacao.historicoAcompanhamento.deleteMany();
  await transacao.matricula.deleteMany();
  await transacao.aluno.deleteMany();
  await transacao.solicitacao.deleteMany();
  await transacao.empresa.deleteMany();
  await transacao.turma.deleteMany();
  await transacao.curso.deleteMany();
  const cursos = new Map();
  const turmas = [];
  for (const c of catalogo.registros.Cursos.filter((c) => c.valido)) {
    const nome = c["Nome do curso"];
    const tipoCurso = c["Tipo de curso"];
    const saida = await transacao.curso.create({
      data: {
        nome,
        tipoCurso,
        chave: hashDados([normalizar(nome), normalizar(tipoCurso)]),
      },
    });
    cursos.set(c["ID Curso"], saida);
  }
  for (const t of catalogo.registros.Turmas.filter((t) => t.valido)) {
    const curso = cursos.get(t["ID Curso"]);
    if (!curso) continue;
    const saida = await transacao.turma.create({
      data: {
        cursoId: curso.id,
        codigo: t["Código da turma"],
        turno: t.Turno,
        dataInicio: new Date(t["Data de início"]),
        dataFim: new Date(t["Data de fim"]),
        quantidadeTermos: t["Quantidade total de termos"],
        origem: "CATALOGO_V2",
        chave: hashDados([
          "OFERTA_V2",
          curso.chave,
          normalizar(t["Código da turma"]),
          normalizar(t.Turno),
          t["Data de início"],
          t["Data de fim"],
        ]),
      },
    });
    turmas.push({ ...saida, curso: curso });
  }
  const empresas = [];
  const nomes = [
    "Horizonte Tecnologia — Demonstração",
    "Oficina Aurora — Demonstração",
    "Indústria Delta — Demonstração",
    "Serviços Prisma — Demonstração",
    "Grupo Atlas — Demonstração",
    "Fábrica Sol — Demonstração",
  ];
  for (let indice = 0; indice < 6; indice++)
    empresas.push(
      await transacao.empresa.create({
        data: {
          razaoSocial: nomes[indice],
          nomeFantasia: nomes[indice],
          cnpj: documento(String(900000000000 + indice), "CNPJ"),
          email: `empresa-demo-${indice + 1}@example.invalid`,
          telefone: `6199000000${indice}`,
          contribuinte: indice % 2 === 0,
          autorizada: indice < 2,
          ativa: indice < 4,
        },
      }),
    );
  const nomesCurso = [...new Set(turmas.map((t) => t.curso.nome))].slice(0, 5);
  if (nomesCurso.length < 3)
    throw new Error("Catálogo insuficiente para demonstrar os gráficos.");
  const candidatas = turmas.filter((t) => nomesCurso.includes(t.curso.nome));
  for (let indice = 0; indice < 36; indice++) {
    const ofertas = candidatas.filter(
      (t) => t.curso.nome === nomesCurso[indice % nomesCurso.length],
    );
    const turma =
      ofertas[Math.floor(indice / nomesCurso.length) % ofertas.length];
    const status = [
      "DISPONIVEL",
      "INDICADO",
      "EM_PROCESSO",
      "CONTRATADO",
      "DISPONIVEL",
    ][indice % 5];
    const empresaId =
      status && status !== "DISPONIVEL"
        ? empresas[Math.floor(indice / 5) % 4].id
        : null;
    const nascimento = new Date(`${2006 + (indice % 4)}-03-15T00:00:00Z`);
    const agora = new Date();
    const dataCadastro = new Date(agora);
    dataCadastro.setUTCDate(
      dataCadastro.getUTCDate() - [0, 3, 12, 45, 100][indice % 5],
    );
    const a = await transacao.aluno.create({
      data: {
        nome: `Aluno Demonstração ${String(indice + 1).padStart(2, "0")}`,
        cpf: documento(String(800000000 + indice), "CPF"),
        email: `aluno-demo-${indice + 1}@example.invalid`,
        celular: `6199000${String(indice).padStart(4, "0")}`,
        genero: indice % 2 ? "Feminino" : "Masculino",
        idade:
          agora.getUTCFullYear() -
          nascimento.getUTCFullYear() -
          (agora.getUTCMonth() < 2 ? 1 : 0),
        dataNascimento: nascimento,
        modalidade: turma.curso.tipoCurso,
        curso: turma.curso.nome,
        turma: turma.codigo,
        periodo: turma.turno,
        termo: 1 + (indice % turma.quantidadeTermos),
        statusIndicacao: status ? rotulos[status] : "Sem classificação",
        empregado: status === "CONTRATADO",
        empresaId,
        origemCadastro: "DEMONSTRACAO",
        dataCadastro,
        ultimaAtualizacao: dataCadastro,
      },
    });
    const m = await transacao.matricula.create({
      data: {
        alunoId: a.id,
        turmaId: turma.id,
        termoAtual: a.termo,
        status,
        classificacaoPendente: !status,
        empresaAtualId: empresaId,
      },
    });
    await transacao.historicoAcompanhamento.create({
      data: {
        matriculaId: m.id,
        tipo: "CARGA_INICIAL",
        novoStatus: status,
        empresaId,
        origem: "DEMONSTRACAO",
      },
    });
  }
  return { antes: antigos, depois: await contarBase(transacao) };
}
