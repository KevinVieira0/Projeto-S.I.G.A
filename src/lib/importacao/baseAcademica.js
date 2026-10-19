// Contrato da planilha SIGA-nova-base-alunos.xlsx: cabeçalhos na linha 4.
// A prévia nunca altera dados. Histórico e status existentes pertencem ao sistema.

export const ABAS_ACADEMICAS = {
  Cursos: ["ID Curso", "Nome do curso", "Tipo de curso"],
  Turmas: [
    "ID Turma",
    "ID Curso",
    "Código da turma",
    "Turno",
    "Data de início",
    "Data de fim",
    "Quantidade total de termos",
  ],
  Alunos: [
    "ID Aluno",
    "Nome completo",
    "CPF",
    "Data de nascimento",
    "Gênero",
    "Telefone",
    "Celular",
    "E-mail",
    "Endereço do aluno",
    "CEP",
  ],
  Empresas: ["ID Empresa", "Nome da empresa", "CNPJ", "Contribuinte?"],
  Matriculas: [
    "ID Matrícula",
    "ID Aluno",
    "ID Turma",
    "Termo atual",
    "Status",
    "ID Empresa atual",
    "ID Origem",
  ],
};

export const LIMITE_LINHAS = 10000;

export const limpar = (valor) =>
  String(valor ?? "")
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ");

export const normalizar = (valor) => limpar(valor).toLocaleLowerCase("pt-BR");
// Nomes usados pelo legado e pelo novo formulário para os mesmos tipos de curso.

export const normalizarTipoCurso = (valor) =>
  ({
    técnico: "curso técnico",
    tecnico: "curso técnico",
    cai: "aprendizagem industrial",
  })[normalizar(valor)] || normalizar(valor);
const cabecalho = (valor) =>
  normalizar(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
const vazio = (valor) => valor === "" || valor === null || valor === undefined;

export function documentoValido(valor, tipo) {
  const text = limpar(valor);
  if (!/^[\d./\s-]+$/.test(text)) return false;
  const digitos = text.replace(/\D/g, "");
  const size = tipo === "CPF" ? 11 : 14;
  if (digitos.length !== size || /^(\d)\1+$/.test(digitos)) return false;
  const digito = (base) => {
    let peso = tipo === "CPF" ? base.length + 1 : base.length - 7;
    let soma = 0;
    for (const caractere of base) {
      soma += Number(caractere) * peso--;
      if (tipo !== "CPF" && peso < 2) peso = 9;
    }
    const resto = soma % 11;
    return String(resto < 2 ? 0 : 11 - resto);
  };
  const base = digitos.slice(0, -2);
  return digitos === base + digito(base) + digito(base + digito(base));
}

export function dataAcademica(valor) {
  if (vazio(valor)) return null;
  if (typeof valor === "number") {
    if (!Number.isInteger(valor) || valor < 1 || valor > 73415)
      throw new Error("Data serial inválida.");
    return dataAcademica(
      new Date(Date.UTC(1899, 11, 30) + valor * 86400000)
        .toISOString()
        .slice(0, 10),
    );
  }
  const text = limpar(valor);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  const [ano, mes, dia] = iso
    ? iso.slice(1).map(Number)
    : br
      ? [Number(br[3]), Number(br[2]), Number(br[1])]
      : [];
  const dataCivil = new Date(Date.UTC(ano, mes - 1, dia));
  if (
    !ano ||
    ano < 1900 ||
    ano > 2100 ||
    dataCivil.getUTCFullYear() !== ano ||
    dataCivil.getUTCMonth() !== mes - 1 ||
    dataCivil.getUTCDate() !== dia
  )
    throw new Error("Use data válida em dd/mm/aaaa ou aaaa-mm-dd.");
  return dataCivil.toISOString().slice(0, 10);
}
const STATUS = {
  disponível: "DISPONIVEL",
  indicado: "INDICADO",
  "em processo": "EM_PROCESSO",
  contratado: "CONTRATADO",
  empregado: "CONTRATADO",
};
const TURNOS = {
  manhã: "Manhã",
  matutino: "Manhã",
  tarde: "Tarde",
  vespertino: "Tarde",
  noite: "Noite",
  noturno: "Noite",
  integral: "Integral",
};
const numeroInteiro = (valor) =>
  /^\d+$/.test(limpar(valor)) &&
  Number.isSafeInteger(Number(valor)) &&
  Number(valor) > 0
    ? Number(valor)
    : null;

export function validarBaseAcademica(
  abas,
  { hoje = new Date().toISOString().slice(0, 10) } = {},
) {
  const registros = {};
  const problemas = [];
  const contagens = {};
  let totalProblemas = 0;
  const apontar = (aba, linha, campo, codigo) => {
    totalProblemas++;
    // Localização e código bastam para corrigir; não devolver valores pessoais.
    if (problemas.length < 200) problemas.push({ aba, linha, campo, codigo });
  };
  for (const [aba, campos] of Object.entries(ABAS_ACADEMICAS)) {
    registros[aba] = [];
    contagens[aba] = { recebidas: 0, vazias: 0, validas: 0, invalidas: 0 };
    const linhas = abas?.[aba];
    if (!Array.isArray(linhas) || !Array.isArray(linhas[0])) {
      apontar(aba, 4, "", "ABA_AUSENTE");
      continue;
    }
    // Entrada começa na linha 4, incluindo cabeçalho. Não aceitar leitura truncada.
    if (linhas.length > LIMITE_LINHAS + 1) {
      apontar(aba, 4, "", "LIMITE_EXCEDIDO");
      continue;
    }
    const indices = new Map();
    let cabecalhoInvalido = false;
    linhas[0].forEach((nome, indice) => {
      const chave = cabecalho(nome);
      if (!chave) return;
      if (indices.has(chave)) {
        apontar(aba, 4, "", "CABECALHO_DUPLICADO");
        cabecalhoInvalido = true;
      }
      indices.set(chave, indice);
    });
    for (const campo of campos)
      if (!indices.has(cabecalho(campo))) {
        apontar(aba, 4, campo, "COLUNA_AUSENTE");
        cabecalhoInvalido = true;
      }
    if (cabecalhoInvalido) continue;
    for (let indice = 1; indice < linhas.length; indice++) {
      const linha = indice + 4;
      const valorOriginal = linhas[indice];
      if (!Array.isArray(valorOriginal)) {
        apontar(aba, linha, "", "LINHA_INVALIDA");
        contagens[aba].invalidas++;
        continue;
      }
      const row = { linha, valido: true };
      for (const campo of campos)
        row[campo] = valorOriginal[indices.get(cabecalho(campo))] ?? "";
      // Idade/fórmulas e timestamps automáticos não criam pessoas em linhas vazias.
      if (campos.every((campo) => !limpar(row[campo]))) {
        contagens[aba].vazias++;
        continue;
      }
      contagens[aba].recebidas++;
      row.falhar = (campo, codigo) => {
        row.valido = false;
        apontar(aba, linha, campo, codigo);
      };
      const texto = (campo, maximo, obrigatorio = false) => {
        row[campo] = limpar(row[campo]);
        if ((obrigatorio && !row[campo]) || row[campo].length > maximo)
          row.falhar(campo, "TEXTO_INVALIDO");
      };
      const dados = (campo, obrigatorio = false) => {
        try {
          row[campo] = dataAcademica(row[campo]);
          if (obrigatorio && !row[campo]) row.falhar(campo, "DATA_OBRIGATORIA");
        } catch {
          row.falhar(campo, "DATA_INVALIDA");
        }
      };
      const documento = (campo, tipo) => {
        if (!documentoValido(row[campo], tipo))
          row.falhar(campo, "DOCUMENTO_INVALIDO");
        row[campo] = limpar(row[campo]).replace(/\D/g, "");
      };
      // Referências são estáveis; linha não é identificador. IDs de banco são conciliados depois.
      for (const campo of campos.filter((c) => c.startsWith("ID ")))
        texto(campo, 100);
      if (aba === "Cursos") {
        texto("ID Curso", 100, true);
        texto("Nome do curso", 150, true);
        texto("Tipo de curso", 50, true);
      }
      if (aba === "Turmas") {
        texto("ID Turma", 100, true);
        texto("ID Curso", 100, true);
        texto("Código da turma", 50, true);
        row.Turno = TURNOS[normalizar(row.Turno)] || null;
        if (!row.Turno) row.falhar("Turno", "TURNO_INVALIDO");
        dados("Data de início", true);
        dados("Data de fim", true);
        if (
          row["Data de início"] &&
          row["Data de fim"] &&
          row["Data de fim"] < row["Data de início"]
        )
          row.falhar("Data de fim", "DATAS_INVERTIDAS");
        row["Quantidade total de termos"] = numeroInteiro(
          row["Quantidade total de termos"],
        );
        if (!row["Quantidade total de termos"])
          row.falhar("Quantidade total de termos", "DURACAO_PENDENTE");
      }
      if (aba === "Alunos") {
        texto("ID Aluno", 100, true);
        texto("Nome completo", 150, true);
        documento("CPF", "CPF");
        dados("Data de nascimento", true);
        if (row["Data de nascimento"] > hoje)
          row.falhar("Data de nascimento", "NASCIMENTO_FUTURO");
        for (const [campo, maximo] of [
          ["Gênero", 30],
          ["Telefone", 30],
          ["Celular", 20],
          ["E-mail", 255],
          ["Endereço do aluno", 300],
        ])
          texto(campo, maximo);
        if (row["E-mail"] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row["E-mail"]))
          row.falhar("E-mail", "EMAIL_INVALIDO");
        if (row.CEP && !/^\d{5}-?\d{3}$/.test(limpar(row.CEP)))
          row.falhar("CEP", "CEP_INVALIDO");
        row.CEP = limpar(row.CEP).replace(/\D/g, "");
      }
      if (aba === "Empresas") {
        texto("ID Empresa", 100, true);
        texto("Nome da empresa", 255, true);
        documento("CNPJ", "CNPJ");
        const contribuinte = normalizar(row["Contribuinte?"]);
        if (!["", "sim", "não", "não informado"].includes(contribuinte))
          row.falhar("Contribuinte?", "CONTRIBUINTE_INVALIDO");
        row["Contribuinte?"] =
          contribuinte === "sim" ? true : contribuinte === "não" ? false : null;
      }
      if (aba === "Matriculas") {
        // ID Origem é aceito como referência estável na primeira carga, antes de existir UUID.
        if (!row["ID Matrícula"] && !row["ID Origem"])
          row.falhar("ID Matrícula", "REFERENCIA_OBRIGATORIA");
        texto("ID Aluno", 100, true);
        texto("ID Turma", 100, true);
        row["Termo atual"] = numeroInteiro(row["Termo atual"]);
        if (!row["Termo atual"]) row.falhar("Termo atual", "TERMO_INVALIDO");
        row.Status = STATUS[normalizar(row.Status)] || null;
        if (!row.Status) row.falhar("Status", "STATUS_OBRIGATORIO_OU_INVALIDO");
        if (
          (row.Status === "DISPONIVEL" && row["ID Empresa atual"]) ||
          (row.Status &&
            row.Status !== "DISPONIVEL" &&
            !row["ID Empresa atual"])
        )
          row.falhar("ID Empresa atual", "EMPRESA_STATUS_INCOERENTE");
      }
      registros[aba].push(row);
    }
  }
  const duplicados = (aba, chave) => {
    const vistos = new Map();
    for (const linha of registros[aba]) {
      const key = chave(linha);
      if (!key) continue;
      if (vistos.has(key)) {
        linha.falhar("", "REFERENCIA_DUPLICADA");
        vistos.get(key).falhar("", "REFERENCIA_DUPLICADA");
      } else vistos.set(key, linha);
    }
  };
  for (const [aba, campo] of [
    ["Cursos", "ID Curso"],
    ["Turmas", "ID Turma"],
    ["Alunos", "ID Aluno"],
    ["Alunos", "CPF"],
    ["Empresas", "ID Empresa"],
    ["Empresas", "CNPJ"],
    ["Matriculas", "ID Matrícula"],
    ["Matriculas", "ID Origem"],
  ])
    duplicados(aba, (linha) => linha[campo]);
  duplicados("Cursos", (linha) =>
    JSON.stringify([
      normalizar(linha["Nome do curso"]),
      normalizarTipoCurso(linha["Tipo de curso"]),
    ]),
  );
  duplicados("Turmas", (linha) =>
    JSON.stringify([
      linha["ID Curso"],
      normalizar(linha["Código da turma"]),
      linha.Turno,
      linha["Data de início"],
      linha["Data de fim"],
    ]),
  );
  // Mesmo par aluno/turma precisa de revisão, não de fusão automática nem duplicação silenciosa.
  duplicados("Matriculas", (linha) =>
    JSON.stringify([linha["ID Aluno"], linha["ID Turma"]]),
  );
  const mapas = Object.fromEntries(
    [
      ["Cursos", "ID Curso"],
      ["Turmas", "ID Turma"],
      ["Alunos", "ID Aluno"],
      ["Empresas", "ID Empresa"],
    ].map(([aba, campo]) => [
      aba,
      new Map(registros[aba].map((linha) => [linha[campo], linha])),
    ]),
  );
  const referencia = (linha, campo, aba) => {
    const target = mapas[aba].get(linha[campo]);
    if (!target?.valido) linha.falhar(campo, "REFERENCIA_AUSENTE_OU_INVALIDA");
    return target;
  };
  for (const linha of registros.Turmas) referencia(linha, "ID Curso", "Cursos");
  for (const linha of registros.Matriculas) {
    referencia(linha, "ID Aluno", "Alunos");
    const turma = referencia(linha, "ID Turma", "Turmas");
    if (linha["ID Empresa atual"])
      referencia(linha, "ID Empresa atual", "Empresas");
    if (
      turma?.valido &&
      linha["Termo atual"] > turma["Quantidade total de termos"]
    )
      linha.falhar("Termo atual", "TERMO_ACIMA_DURACAO");
  }
  for (const [aba, linhas] of Object.entries(registros)) {
    contagens[aba].validas = linhas.filter(
      (registro) => registro.valido,
    ).length;
    contagens[aba].invalidas += linhas.filter(
      (registro) => !registro.valido,
    ).length;
    for (const linha of linhas) delete linha.falhar;
  }
  return {
    registros,
    contagens,
    problemas,
    totalProblemas,
    problemasOmitidos: Math.max(0, totalProblemas - problemas.length),
  };
}
