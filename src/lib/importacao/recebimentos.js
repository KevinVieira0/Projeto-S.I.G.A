import { createHash } from "node:crypto";
import {
  ABAS_ACADEMICAS,
  validarBaseAcademica,
  documentoValido,
  dataAcademica,
  limpar,
} from "./baseAcademica";
import { todayInSaoPaulo } from "../validations/solicitacaoSchema";

export const CABECALHOS_RECEBIMENTOS = {
  ALUNO: [
    "ID Envio",
    "Recebido em",
    "Nome completo",
    "CPF",
    "Data de nascimento",
    "Gênero",
    "Telefone",
    "Celular",
    "E-mail",
    "Endereço do aluno",
    "CEP",
    "ID Curso",
    "ID Turma",
    "Termo atual",
    "Situação profissional informada",
    "Empresa informada",
    "CNPJ informado",
    "Processamento",
    "Erros",
  ],
  EMPRESA: [
    "ID Envio",
    "Recebido em",
    "Razão social",
    "Nome fantasia",
    "CNPJ",
    "E-mail",
    "Telefone",
    "Contribuinte?",
    "Processamento",
    "Erros",
  ],
};

export const hashDados = (valor) =>
  createHash("sha256").update(JSON.stringify(valor)).digest("hex");

export class ErroRecebimento extends Error {
  constructor(mensagem, status = 400) {
    super(mensagem);
    this.status = status;
  }
}

export function prepararRecebimentos(abas, tipo, hoje = todayInSaoPaulo()) {
  const nome =
    tipo === "ALUNO" ? "Recebimentos Alunos" : "Recebimentos Empresas";
  const linhasOriginais = abas[nome];
  // Aceita o cabeçalho anterior enquanto o Apps Script recebe a atualização.
  const linhas = Array.isArray(linhasOriginais)
    ? [
        linhasOriginais[0]?.map(
          (campo) =>
            ({ Conferência: "Processamento", Pendências: "Erros" })[campo] ||
            campo,
        ),
        ...linhasOriginais.slice(1),
      ]
    : linhasOriginais;
  const campos = CABECALHOS_RECEBIMENTOS[tipo];
  if (
    !campos ||
    !Array.isArray(linhas?.[0]) ||
    campos.some((c) => linhas[0].filter((h) => h === c).length !== 1)
  )
    throw new ErroRecebimento(`Cabeçalhos incompatíveis na aba ${nome}.`);
  if (linhas.length > 10001)
    throw new ErroRecebimento("Limite de 10.000 recebimentos excedido.");
  const catalogo = validarBaseAcademica({
    ...Object.fromEntries(
      Object.entries(ABAS_ACADEMICAS).map(([chave, h]) => [chave, [h]]),
    ),
    Cursos: abas.Cursos,
    Turmas: abas.Turmas,
  });
  const cursos = new Map(
    catalogo.registros.Cursos.filter((registro) => registro.valido).map(
      (registro) => [registro["ID Curso"], registro],
    ),
  );
  const turmas = new Map(
    catalogo.registros.Turmas.filter((registro) => registro.valido).map(
      (registro) => [registro["ID Turma"], registro],
    ),
  );
  const vistos = new Set();
  return linhas
    .slice(1)
    .map((linha, indice) => ({ row: linha, linha: indice + 5 }))
    .filter(
      ({ row: linha }) =>
        Array.isArray(linha) && linha.some((valor) => limpar(valor)),
    )
    .map(({ row, linha }) => {
      const camposInformados = Object.fromEntries(
        campos.map((c) => [c, limpar(row[linhas[0].indexOf(c)])]),
      );
      const envioId = camposInformados["ID Envio"];
      const recebidoEm = camposInformados["Recebido em"];
      if (!envioId || envioId.length > 200 || vistos.has(envioId))
        throw new ErroRecebimento(
          `ID ausente ou repetido na aba ${nome}, linha ${linha}.`,
        );
      vistos.add(envioId);
      if (
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(
          recebidoEm,
        ) ||
        Number.isNaN(Date.parse(recebidoEm)) ||
        new Date(recebidoEm).toISOString().slice(0, 19) !==
          recebidoEm.slice(0, 19)
      )
        throw new ErroRecebimento(
          `Data de recebimento inválida na linha ${linha}.`,
        );
      const erros = [];
      const texto = (campo, maximo, obrigatorio = false) => {
        const valor = camposInformados[campo];
        if (valor.length > maximo || (obrigatorio && !valor))
          erros.push(`${campo}: preenchimento inválido`);
        return valor;
      };
      const documento = tipo === "ALUNO" ? "CPF" : "CNPJ";
      if (!documentoValido(camposInformados[documento], documento))
        erros.push(`${documento} inválido`);
      const dados = {
        documento: camposInformados[documento].replace(/\D/g, ""),
        nome: texto(
          tipo === "ALUNO" ? "Nome completo" : "Razão social",
          tipo === "ALUNO" ? 150 : 255,
          true,
        ),
        email: texto("E-mail", 255, true),
      };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email))
        erros.push("E-mail inválido");
      if (tipo === "EMPRESA") {
        dados.nomeFantasia = texto("Nome fantasia", 255);
        dados.telefone = texto("Telefone", 20, true);
        if (!/^\d{10,13}$/.test(dados.telefone))
          erros.push("Telefone inválido");
        if (
          !["Sim", "Não", "Não informado"].includes(
            camposInformados["Contribuinte?"],
          )
        )
          erros.push("Contribuinte inválido");
        dados.contribuinte =
          camposInformados["Contribuinte?"] === "Sim"
            ? true
            : camposInformados["Contribuinte?"] === "Não"
              ? false
              : null;
      } else {
        try {
          dados.nascimento = dataAcademica(
            camposInformados["Data de nascimento"],
          );
        } catch {
          dados.nascimento = null;
        }
        if (!dados.nascimento || dados.nascimento > hoje)
          erros.push("Nascimento inválido");
        for (const [chave, campo, maximo] of [
          ["genero", "Gênero", 30],
          ["telefone", "Telefone", 30],
          ["celular", "Celular", 20],
          ["endereco", "Endereço do aluno", 300],
          ["cep", "CEP", 8],
          ["situacao", "Situação profissional informada", 30],
          ["empresaInformada", "Empresa informada", 255],
          ["cnpjInformado", "CNPJ informado", 14],
        ])
          dados[chave] = texto(campo, maximo);
        if (
          !/^\d{10,13}$/.test(dados.celular) ||
          (dados.telefone && !/^\d{10,13}$/.test(dados.telefone))
        )
          erros.push("Contato inválido");
        if (dados.cep && !/^\d{8}$/.test(dados.cep)) erros.push("CEP inválido");
        if (
          ![
            "",
            "Masculino",
            "Feminino",
            "Outro",
            "Prefiro não informar",
          ].includes(dados.genero)
        )
          erros.push("Gênero inválido");
        if (
          !["", "Sim", "Não", "Prefiro não informar"].includes(dados.situacao)
        )
          erros.push("Situação profissional inválida");
        if (
          dados.cnpjInformado &&
          !documentoValido(dados.cnpjInformado, "CNPJ")
        )
          erros.push("CNPJ informado inválido");
        if (
          (dados.empresaInformada || dados.cnpjInformado) &&
          dados.situacao !== "Sim"
        )
          erros.push("Empresa declarada incoerente");
        const t = turmas.get(camposInformados["ID Turma"]);
        const c = t && cursos.get(t["ID Curso"]);
        dados.termo = Number.isSafeInteger(
          Number(camposInformados["Termo atual"]),
        )
          ? Number(camposInformados["Termo atual"])
          : null;
        if (!t || !c || t["ID Curso"] !== camposInformados["ID Curso"])
          erros.push("Curso/turma pendente ou inválido");
        if (
          !/^\d+$/.test(camposInformados["Termo atual"]) ||
          dados.termo < 1 ||
          !t ||
          dados.termo > t["Quantidade total de termos"]
        )
          erros.push("Termo fora da duração da turma");
        dados.oferta =
          t && c
            ? {
                nome: c["Nome do curso"],
                tipo: c["Tipo de curso"],
                codigo: t["Código da turma"],
                turno: t.Turno,
                inicio: t["Data de início"],
                fim: t["Data de fim"],
                termos: t["Quantidade total de termos"],
              }
            : null;
      }
      return {
        tipo,
        envioId,
        recebidoEm: new Date(recebidoEm),
        dados,
        erros,
        hash: hashDados({ dados, recebidoEm }),
      };
    });
}

export async function importarRecebimentos(prisma, fonte, abas) {
  if (!fonte || fonte.length > 100)
    throw new ErroRecebimento("Fonte inválida.");
  const linhas = ["ALUNO", "EMPRESA"].flatMap((tipo) =>
    prepararRecebimentos(abas, tipo),
  );
  return prisma.$transaction(
    async (transacao) => {
      await transacao.$executeRaw`SELECT pg_advisory_xact_lock(741004)`;
      const existentes = new Map(
        (
          await transacao.recebimentoCadastro.findMany({
            where: { fonte },
            select: { tipo: true, envioId: true, hash: true },
          })
        ).map((recebimento) => [
          recebimento.tipo + ":" + recebimento.envioId,
          recebimento,
        ]),
      );
      const novos = [];
      let repetidos = 0;
      let alterados = 0;
      for (const recebimento of linhas) {
        const anterior = existentes.get(
          recebimento.tipo + ":" + recebimento.envioId,
        );
        if (anterior) {
          if (anterior.hash === recebimento.hash) repetidos++;
          else alterados++;
        } else
          novos.push({
            ...recebimento,
            fonte,
            estado: recebimento.erros.length ? "INVALIDO" : "PENDENTE",
          });
      }
      // Uma resposta já recebida é imutável; correções devem ter outro ID de envio.
      for (let indice = 0; indice < novos.length; indice += 200)
        await transacao.recebimentoCadastro.createMany({
          data: novos.slice(indice, indice + 200),
        });
      return {
        recebidos: linhas.length,
        novos: novos.length,
        repetidos,
        alterados,
        invalidos: linhas.filter((recebimento) => recebimento.erros.length)
          .length,
      };
    },
    { timeout: 60000, maxWait: 10000 },
  );
}
