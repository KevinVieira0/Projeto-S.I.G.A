import { google } from "googleapis";

const ESCOPO_LEITURA =
  "https://www.googleapis.com/auth/spreadsheets.readonly";

export async function lerAlunosDaPlanilha() {
  const caminhoCredenciais =
    process.env.GOOGLE_APPLICATION_CREDENTIALS;

  const spreadsheetId =
    process.env.GOOGLE_SHEETS_ID;

  const intervalo =
    process.env.GOOGLE_SHEETS_ALUNOS_RANGE;

  if (!caminhoCredenciais) {
    throw new Error(
      "GOOGLE_APPLICATION_CREDENTIALS não foi configurado."
    );
  }

  if (!spreadsheetId) {
    throw new Error(
      "GOOGLE_SHEETS_ID não foi configurado."
    );
  }

  if (!intervalo) {
    throw new Error(
      "GOOGLE_SHEETS_ALUNOS_RANGE não foi configurado."
    );
  }

  const autenticacao = new google.auth.GoogleAuth({
    keyFile: caminhoCredenciais,
    scopes: [ESCOPO_LEITURA],
  });

  const clienteAutenticado =
    await autenticacao.getClient();

  const sheets = google.sheets({
    version: "v4",
    auth: clienteAutenticado,
  });

  const resposta =
    await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: intervalo,
    });

  return resposta.data.values ?? [];
}