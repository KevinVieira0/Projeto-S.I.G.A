import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";

export class ErroAutenticacaoGoogle extends Error {}

export function criarAutenticacaoGoogle(escopos) {
  const configuracao = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (!configuracao)
    throw new ErroAutenticacaoGoogle(
      "Configure GOOGLE_APPLICATION_CREDENTIALS para conectar a planilha.",
    );
  if (configuracao.startsWith("{")) {
    let credenciais;
    try {
      credenciais = JSON.parse(configuracao);
    } catch {
      throw new ErroAutenticacaoGoogle(
        "O JSON das credenciais do Google está inválido.",
      );
    }
    if (
      credenciais.type !== "service_account" ||
      !credenciais.client_email ||
      !credenciais.private_key
    )
      throw new ErroAutenticacaoGoogle(
        "Informe uma credencial de conta de serviço válida do Google.",
      );
    return new google.auth.GoogleAuth({
      credentials: credenciais,
      scopes: escopos,
    });
  }
  const arquivo = path.resolve(configuracao);
  if (!fs.existsSync(arquivo))
    throw new ErroAutenticacaoGoogle(
      "Arquivo de credenciais do Google não encontrado. Confira GOOGLE_APPLICATION_CREDENTIALS.",
    );
  return new google.auth.GoogleAuth({ keyFile: arquivo, scopes: escopos });
}

export function mensagemErroGoogle(erro) {
  if (erro instanceof ErroAutenticacaoGoogle) return erro.message;
  const codigo = erro?.response?.status || erro?.code;
  if (codigo === 401 || codigo === "invalid_grant")
    return "A credencial do Google não pôde ser autenticada. Confira a chave da conta de serviço.";
  if (codigo === 403)
    return "O Google recusou o acesso. Confira a API Google Sheets e o compartilhamento da planilha com a conta de serviço como Editor.";
  if (codigo === 404)
    return "Planilha não encontrada ou sem acesso. Confira GOOGLE_SHEETS_ACADEMICO_ID e o compartilhamento.";
  if (["ENOTFOUND", "ETIMEDOUT", "ECONNRESET", "EAI_AGAIN"].includes(codigo))
    return "Não foi possível conectar ao Google Sheets. Confira a conexão e tente novamente.";
  return null;
}
