import { createHash } from "node:crypto";
import { z } from "zod";

export const LIMITE_COMPROVANTE = 5 * 1024 * 1024;
export const camposComprovante = {
  id: true,
  nome: true,
  tipo: true,
  tamanho: true,
  criadoEm: true,
  matriculaId: true,
  empresaId: true,
  empresa: { select: { razaoSocial: true, nomeFantasia: true } },
};
export class ErroComprovante extends Error {
  constructor(mensagem, status = 400) {
    super(mensagem);
    this.status = status;
  }
}

export function validarArquivoContrato({ nome, tipo, conteudo }) {
  const bytes = Buffer.from(conteudo);
  if (!bytes.length || bytes.length > LIMITE_COMPROVANTE)
    throw new ErroComprovante("Envie um arquivo de até 5 MB.", 413);
  const detectado =
    bytes.subarray(0, 5).toString() === "%PDF-"
      ? "application/pdf"
      : bytes
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        ? "image/png"
        : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
          ? "image/jpeg"
          : null;
  const extensoes = {
    "application/pdf": /\.pdf$/i,
    "image/png": /\.png$/i,
    "image/jpeg": /\.jpe?g$/i,
  };
  if (!detectado || tipo !== detectado || !extensoes[detectado].test(nome))
    throw new ErroComprovante(
      "Envie um PDF, JPG ou PNG com formato e extensão correspondentes.",
      415,
    );
  const nomeSeguro = nome
    .replace(/\\/g, "/")
    .split("/")
    .pop()
    .replace(/[\x00-\x1f\x7f]/g, "")
    .slice(-160);
  return {
    nome: nomeSeguro,
    tipo: detectado,
    tamanho: bytes.length,
    hash: createHash("sha256").update(bytes).digest("hex"),
    conteudo: bytes,
  };
}

export async function lerEnvioContrato(requisicao) {
  const limiteCorpo = LIMITE_COMPROVANTE + 64 * 1024;
  if (Number(requisicao.headers.get("content-length")) > limiteCorpo)
    throw new ErroComprovante("Envie um arquivo de até 5 MB.", 413);
  const leitor = requisicao.body?.getReader();
  if (!leitor) throw new ErroComprovante("Selecione o comprovante.");
  const partes = [];
  let tamanho = 0;
  try {
    while (true) {
      const { done, value } = await leitor.read();
      if (done) break;
      tamanho += value.byteLength;
      if (tamanho > limiteCorpo) {
        await leitor.cancel();
        throw new ErroComprovante("Envie um arquivo de até 5 MB.", 413);
      }
      partes.push(Buffer.from(value));
    }
  } finally {
    leitor.releaseLock();
  }
  let formulario;
  try {
    formulario = await new Response(Buffer.concat(partes), {
      headers: { "Content-Type": requisicao.headers.get("content-type") },
    }).formData();
  } catch {
    throw new ErroComprovante("Formulário de arquivo inválido.");
  }
  const campos = ["arquivo", "versao", "envioId", "confirmado"];
  if (
    [...formulario.keys()].some((chave) => !campos.includes(chave)) ||
    campos.some((chave) => formulario.getAll(chave).length !== 1)
  )
    throw new ErroComprovante("Revise os dados do envio.");
  const dados = z
    .object({
      versao: z.string().datetime(),
      envioId: z.string().uuid(),
      confirmado: z.literal("true"),
    })
    .safeParse(
      Object.fromEntries(campos.slice(1).map((c) => [c, formulario.get(c)])),
    );
  if (!dados.success)
    throw new ErroComprovante(
      "Confirme o envio e atualize os detalhes antes de continuar.",
    );
  const arquivo = formulario.get("arquivo");
  if (!arquivo || typeof arquivo.arrayBuffer !== "function")
    throw new ErroComprovante("Selecione o comprovante.");
  return {
    ...dados.data,
    comprovante: {
      id: dados.data.envioId,
      ...validarArquivoContrato({
        nome: arquivo.name,
        tipo: arquivo.type,
        conteudo: await arquivo.arrayBuffer(),
      }),
    },
  };
}
