import { google } from "googleapis";
import { LIMITE_LINHAS } from "./baseAcademica";

const COLUNAS = {
  Cursos: "C",
  Turmas: "G",
  Alunos: "O",
  Empresas: "F",
  Matriculas: "J",
};

export class ErroFonteAcademica extends Error {}

export async function lerBaseAcademicaDaPlanilha(colunas = COLUNAS) {
  const idPlanilha = process.env.GOOGLE_SHEETS_ACADEMICO_ID;
  const arquivoCredenciais = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!idPlanilha)
    throw new ErroFonteAcademica(
      "Configure GOOGLE_SHEETS_ACADEMICO_ID com a planilha acadêmica.",
    );
  if (!arquivoCredenciais)
    throw new ErroFonteAcademica(
      "Credenciais de leitura do Google Sheets não configuradas.",
    );
  const autenticacao = new google.auth.GoogleAuth({
    keyFile: arquivoCredenciais,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const planilhas = google.sheets({
    version: "v4",
    auth: await autenticacao.getClient(),
  });
  const metadados = await planilhas.spreadsheets.get({
    spreadsheetId: idPlanilha,
    fields: "sheets(properties(title,gridProperties(rowCount,columnCount)))",
  });
  const abas = new Map(
    (metadados.data.sheets || []).map((s) => [
      s.properties.title,
      s.properties,
    ]),
  );
  const nomes = Object.keys(colunas);
  const intervalos = nomes.map((nome) => {
    const propriedade = abas.get(nome);
    if (
      !propriedade ||
      propriedade.gridProperties.rowCount < 4 ||
      propriedade.gridProperties.columnCount < colunas[nome].charCodeAt(0) - 64
    )
      throw new ErroFonteAcademica(
        `Aba ${nome} ausente ou incompatível com o modelo acadêmico.`,
      );
    // Recusar grades maiores evita ignorar dados depois de um intervalo de linhas vazias.
    if (propriedade.gridProperties.rowCount > LIMITE_LINHAS + 4)
      throw new ErroFonteAcademica(
        `Aba ${nome} excede o limite de 10.004 linhas da prévia. Revise o tamanho da grade antes de continuar.`,
      );
    return `'${nome}'!A4:${colunas[nome]}${propriedade.gridProperties.rowCount}`;
  });
  const resposta = await planilhas.spreadsheets.values.batchGet({
    spreadsheetId: idPlanilha,
    ranges: intervalos,
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "SERIAL_NUMBER",
  });
  if (resposta.data.valueRanges?.length !== nomes.length)
    throw new ErroFonteAcademica("Leitura incompleta das abas acadêmicas.");
  return Object.fromEntries(
    nomes.map((nome, indice) => [
      nome,
      resposta.data.valueRanges[indice].values || [],
    ]),
  );
}

export const lerRecebimentosDaPlanilha = () =>
  lerBaseAcademicaDaPlanilha({
    Cursos: "C",
    Turmas: "G",
    "Recebimentos Alunos": "S",
    "Recebimentos Empresas": "J",
  });
