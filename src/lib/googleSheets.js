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

function normalizarCabecalho(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export async function lerCursosDaPlanilha() {
  const caminhoCredenciais =
    process.env.GOOGLE_APPLICATION_CREDENTIALS;

  const spreadsheetId =
    process.env.GOOGLE_SHEETS_ID;

  const intervalo =
    process.env.GOOGLE_SHEETS_LISTAS_RANGE || "Listas!A:Z";

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

  const resposta = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: intervalo,
  });

  const linhas = resposta.data.values ?? [];

  if (linhas.length === 0) {
    return [];
  }

  const cabecalhos = linhas[0];

  const indiceCurso = cabecalhos.findIndex((cabecalho) => {
    const nome = normalizarCabecalho(cabecalho);
    return nome === "curso" || nome === "cursos";
  });

  if (indiceCurso === -1) {
    throw new Error(
      'A coluna "Curso" não foi encontrada na aba Listas.'
    );
  }

  const cursosSemDuplicidade = new Map();

  linhas.slice(1).forEach((linha) => {
    const curso = String(linha[indiceCurso] ?? "").trim();

    if (curso) {
      cursosSemDuplicidade.set(
        curso.toLocaleLowerCase("pt-BR"),
        curso
      );
    }
  });

  return Array.from(cursosSemDuplicidade.values()).sort(
    (cursoA, cursoB) =>
      cursoA.localeCompare(cursoB, "pt-BR")
  );
}