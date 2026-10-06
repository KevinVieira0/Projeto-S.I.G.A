import { google } from "googleapis";
import {
  normalizar,
  normalizarTipoCurso,
  dataAcademica,
} from "./baseAcademica";
import { lerBaseAcademicaDaPlanilha } from "./googleSheetsAcademico";

const dia = (valor) =>
  valor ? new Date(valor).toISOString().slice(0, 10) : "";
const instante = (valor) => (valor ? new Date(valor).toISOString() : "");
const rotuloStatus = {
  DISPONIVEL: "Disponível",
  INDICADO: "Indicado",
  EM_PROCESSO: "Em processo",
  CONTRATADO: "Empregado",
};
const cabecalhos = {
  Alunos: [
    "ID Aluno",
    "Nome completo",
    "CPF",
    "Data de nascimento",
    "Idade",
    "Gênero",
    "Telefone",
    "Celular",
    "E-mail",
    "Endereço do aluno",
    "CEP",
    "Origem do cadastro",
    "Criado em",
    "Atualizado em",
    "Última sincronização",
  ],
  Empresas: [
    "ID Empresa",
    "Nome da empresa",
    "CNPJ",
    "Contribuinte?",
    "Criado em",
    "Atualizado em",
    "Nome fantasia",
    "E-mail",
    "Telefone",
    "Situação cadastral",
  ],
  Matriculas: [
    "ID Matrícula",
    "ID Aluno",
    "ID Turma",
    "Termo atual",
    "Status",
    "ID Empresa atual",
    "ID Origem",
    "Criado em",
    "Atualizado em",
    "Última sincronização",
  ],
  Historico: [
    "ID Evento",
    "ID Matrícula",
    "ID Empresa",
    "ID Solicitação",
    "Status anterior",
    "Novo status",
    "Data da alteração",
    "ID Responsável",
  ],
};

export function montarEspelho(base, catalogo) {
  const cursos = new Map();
  const turmas = new Map();
  // Os IDs CUR/TUR usados nas respostas do Forms precisam continuar estáveis.
  for (const curso of base.cursos) {
    const correspondentes = catalogo.Cursos.slice(1).filter(
      (linha) =>
        normalizar(linha[1]) === normalizar(curso.nome) &&
        normalizarTipoCurso(linha[2]) === normalizarTipoCurso(curso.tipoCurso),
    );
    if (correspondentes.length !== 1)
      throw new Error("Curso sem correspondência única na planilha.");
    cursos.set(curso.id, correspondentes[0][0]);
  }
  for (const turma of base.turmas) {
    const correspondentes = catalogo.Turmas.slice(1).filter(
      (linha) =>
        linha[1] === cursos.get(turma.cursoId) &&
        normalizar(linha[2]) === normalizar(turma.codigo) &&
        normalizar(linha[3]) === normalizar(turma.turno) &&
        dataAcademica(linha[4]) === dia(turma.dataInicio) &&
        dataAcademica(linha[5]) === dia(turma.dataFim),
    );
    if (
      correspondentes.length !== 1 ||
      Number(correspondentes[0][6]) !== turma.quantidadeTermos
    )
      throw new Error(
        "Turma sem correspondência única ou com duração divergente.",
      );
    turmas.set(turma.id, correspondentes[0][0]);
  }
  const linhas = {
    Alunos: base.alunos.map((a) => [
      a.id,
      a.nome,
      a.cpf,
      a.dataNascimento,
      a.idade,
      a.genero,
      a.telefone,
      a.celular,
      a.email,
      a.endereco,
      a.cep,
      a.origemCadastro,
      instante(a.dataCadastro),
      instante(a.ultimaAtualizacao),
      instante(a.ultimaSincronizacao),
    ]),
    Empresas: base.empresas.map((e) => [
      e.id,
      e.razaoSocial,
      e.cnpj,
      e.contribuinte === null
        ? "Não informado"
        : e.contribuinte
          ? "Sim"
          : "Não",
      instante(e.criadoEm),
      instante(e.atualizadoEm),
      e.nomeFantasia,
      e.email,
      e.telefone,
      e.ativa ? "Ativa" : "Inativa",
    ]),
    Matriculas: base.matriculas.map((m) => [
      m.id,
      m.alunoId,
      turmas.get(m.turmaId),
      m.termoAtual,
      rotuloStatus[m.status],
      m.empresaAtualId,
      m.chaveLegado,
      instante(m.criadoEm),
      instante(m.atualizadoEm),
      instante(m.ultimaSincronizacao),
    ]),
    Historico: base.historico.map((h) => [
      h.id,
      h.matriculaId,
      h.empresaId,
      h.solicitacaoId,
      rotuloStatus[h.statusAnterior],
      rotuloStatus[h.novoStatus],
      instante(h.registradoEm),
      h.responsavelId,
    ]),
  };
  return { linhas, catalogo: { cursos: cursos.size, turmas: turmas.size } };
}

function celula(valor) {
  if (valor instanceof Date)
    return {
      userEnteredValue: {
        numberValue: (valor.getTime() - Date.UTC(1899, 11, 30)) / 86400000,
      },
      userEnteredFormat: {
        numberFormat: { type: "DATE", pattern: "dd/mm/yyyy" },
      },
    };
  if (typeof valor === "number")
    return { userEnteredValue: { numberValue: valor } };
  // stringValue evita executar nomes/contatos que comecem com = como fórmulas.
  return { userEnteredValue: { stringValue: String(valor ?? "") } };
}

export async function espelharBase(prisma) {
  if (process.env.GOOGLE_SHEETS_ESPELHO_AUTO !== "true")
    return { desativado: true };
  const idPlanilha = process.env.GOOGLE_SHEETS_ACADEMICO_ID;
  const autenticacao = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const planilhas = google.sheets({
    version: "v4",
    auth: await autenticacao.getClient(),
  });
  return prisma.$transaction(
    async (transacao) => {
      // Serializa espelhos e edições, impedindo que uma fotografia antiga substitua a atual.
      await transacao.$executeRaw`SELECT pg_advisory_xact_lock(741004)`;
      const catalogo = await lerBaseAcademicaDaPlanilha({
        Cursos: "C",
        Turmas: "G",
      });
      const [
        alunos,
        empresas,
        cursos,
        turmas,
        matriculas,
        historico,
        recebimentos,
      ] = await Promise.all([
        transacao.aluno.findMany({
          where: { arquivadoEm: null },
          orderBy: [{ nome: "asc" }, { id: "asc" }],
        }),
        transacao.empresa.findMany({
          orderBy: [{ razaoSocial: "asc" }, { id: "asc" }],
          select: {
            id: true,
            razaoSocial: true,
            cnpj: true,
            contribuinte: true,
            criadoEm: true,
            atualizadoEm: true,
            nomeFantasia: true,
            email: true,
            telefone: true,
            ativa: true,
          },
        }),
        transacao.curso.findMany(),
        transacao.turma.findMany(),
        transacao.matricula.findMany({
          where: { aluno: { arquivadoEm: null } },
          orderBy: { id: "asc" },
        }),
        transacao.historicoAcompanhamento.findMany({
          where: { matricula: { aluno: { arquivadoEm: null } } },
          orderBy: [{ registradoEm: "asc" }, { id: "asc" }],
        }),
        transacao.recebimentoCadastro.findMany({
          where: { fonte: idPlanilha },
          select: {
            envioId: true,
            tipo: true,
            estado: true,
            erros: true,
            auditoria: true,
          },
        }),
      ]);
      const espelho = montarEspelho(
        { alunos, empresas, cursos, turmas, matriculas, historico },
        catalogo,
      );
      const resposta = await planilhas.spreadsheets.get({
        spreadsheetId: idPlanilha,
        fields: "sheets(properties,tables)",
      });
      const abas = new Map(
        resposta.data.sheets.map((aba) => [
          aba.properties.title,
          aba.properties,
        ]),
      );
      const tabelas = new Map(
        resposta.data.sheets.map((aba) => [
          aba.properties.title,
          aba.tables || [],
        ]),
      );
      const pedidos = [];
      for (const [nome, linhas] of Object.entries(espelho.linhas)) {
        const aba = abas.get(nome);
        if (!aba || aba.gridProperties.columnCount < cabecalhos[nome].length)
          throw new Error("Estrutura de espelho incompleta.");
        if (linhas.length > 10000)
          throw new Error(
            "Espelho excede o limite de 10.000 registros por aba.",
          );
        if (aba.gridProperties.rowCount < linhas.length + 4)
          pedidos.push({
            appendDimension: {
              sheetId: aba.sheetId,
              dimension: "ROWS",
              length: linhas.length + 4 - aba.gridProperties.rowCount,
            },
          });
        for (const tabela of tabelas.get(nome)) {
          if (
            tabela.range.startRowIndex === 3 &&
            !tabela.range.startColumnIndex
          )
            pedidos.push({
              updateTable: {
                table: {
                  tableId: tabela.tableId,
                  range: {
                    sheetId: aba.sheetId,
                    startRowIndex: 3,
                    endRowIndex: Math.max(5, linhas.length + 4),
                    startColumnIndex: 0,
                    endColumnIndex: cabecalhos[nome].length,
                  },
                },
                fields: "range",
              },
            });
        }
        pedidos.push({
          updateCells: {
            range: {
              sheetId: aba.sheetId,
              startRowIndex: 3,
              endRowIndex: Math.max(
                aba.gridProperties.rowCount,
                linhas.length + 4,
              ),
              startColumnIndex: 0,
              endColumnIndex: cabecalhos[nome].length,
            },
            rows: [cabecalhos[nome], ...linhas].map((linha) => ({
              values: linha.map(celula),
            })),
            fields: "userEnteredValue",
          },
        });
        if (nome === "Alunos")
          pedidos.push({
            repeatCell: {
              range: {
                sheetId: aba.sheetId,
                startRowIndex: 4,
                startColumnIndex: 3,
                endColumnIndex: 4,
              },
              cell: {
                userEnteredFormat: {
                  numberFormat: { type: "DATE", pattern: "dd/mm/yyyy" },
                },
              },
              fields: "userEnteredFormat.numberFormat",
            },
          });
      }
      const estados = {
        PROCESSADO: "Processado",
        INVALIDO: "Dados a corrigir",
        IGNORADO: "Ignorado",
        PENDENTE: "Aguardando processamento automático",
      };
      for (const [nome, coluna, tipo] of [
        ["Recebimentos Alunos", 17, "ALUNO"],
        ["Recebimentos Empresas", 8, "EMPRESA"],
      ]) {
        const aba = abas.get(nome);
        if (!aba) throw new Error("Aba de recebimentos ausente.");
        const leitura = await planilhas.spreadsheets.values.get({
          spreadsheetId: idPlanilha,
          range: `'${nome}'!A5:A${aba.gridProperties.rowCount}`,
        });
        const porEnvio = new Map(
          recebimentos
            .filter((r) => r.tipo === tipo)
            .map((r) => [r.envioId, r]),
        );
        const linhas = leitura.data.values || [];
        let grupo;
        linhas.forEach((linha, indice) => {
          const r = porEnvio.get(linha[0]);
          if (!r) {
            grupo = null;
            return;
          }
          if (!grupo) {
            grupo = {
              updateCells: {
                start: {
                  sheetId: aba.sheetId,
                  rowIndex: indice + 4,
                  columnIndex: coluna,
                },
                rows: [],
                fields: "userEnteredValue",
              },
            };
            pedidos.push(grupo);
          }
          grupo.updateCells.rows.push({
            values: [
              celula(estados[r.estado] || r.estado),
              celula(r.erros.join("; ") || r.auditoria?.motivo || ""),
            ],
          });
        });
      }
      await planilhas.spreadsheets.batchUpdate(
        { spreadsheetId: idPlanilha, requestBody: { requests: pedidos } },
        { timeout: 45000 },
      );
      return {
        atualizadoEm: new Date().toISOString(),
        ...espelho.catalogo,
        ...Object.fromEntries(
          Object.entries(espelho.linhas).map(([nome, linhas]) => [
            nome,
            linhas.length,
          ]),
        ),
      };
    },
    { timeout: 90000, maxWait: 10000 },
  );
}

export async function tentarEspelharBase(prisma) {
  try {
    return await espelharBase(prisma);
  } catch {
    return {
      falha: true,
      mensagem:
        "Cadastro salvo no banco. Não foi possível atualizar o espelho da planilha; a próxima sincronização tentará novamente.",
    };
  }
}
