/** S.I.G.A. V2 — projeto NOVO e planilha de homologação. Não colar no script antigo. */
const SIGA_V2 = {
  PLANILHA: "1UqoayqnZTjNH6jaCmoMMcz5bgz_hQ2ysH2oAWH1W4Ms",
  PLANILHA_ANTIGA: "1MdoPEiTLZ3axcvvWLDdFqqocgCgl8CBvFM4gaqoBh5U",
  RECEBIMENTOS: "Recebimentos Alunos",
  CABECALHOS: [
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
    "Conferência",
    "Pendências",
  ],
};

function instalarFormularioAlunosV2() {
  const bloqueio = LockService.getScriptLock();
  bloqueio.waitLock(30000);
  try {
    const propriedades = PropertiesService.getScriptProperties();
    const existente = propriedades.getProperty("SIGA_V2_FORM_ID");
    if (existente) {
      if (propriedades.getProperty("SIGA_V2_INSTALADO") !== "SIM")
        throw new Error(
          "Instalação anterior incompleta. Revisar o projeto existente; não criar formulários duplicados.",
        );
      console.log(FormApp.openById(existente).getEditUrl());
      return;
    }
    const planilha = abrirPlanilhaV2_();
    const ofertas = ofertasV2_(planilha);
    if (!ofertas.length)
      throw new Error("Nenhuma turma com datas e duração confirmadas.");
    prepararRecebimentosV2_(planilha);
    // Nasce como rascunho. Publicação será feita depois da conferência do coordenador.
    const formulario = FormApp.create(
      "S.I.G.A. | Cadastro de alunos — Nova estrutura",
      false,
    );
    propriedades.setProperty("SIGA_V2_FORM_ID", formulario.getId());
    formulario.setDescription(
      "Preencha seus dados para cadastro ou atualização automática pelo CPF. Confira o CPF, o curso e a turma antes de enviar. Status de indicação, contratação e vínculos com empresas são administrados pela coordenação.",
    );
    formulario.setConfirmationMessage(
      "Recebemos suas informações. Os dados válidos serão processados automaticamente na próxima sincronização do sistema. Respostas inválidas precisam ser corrigidas e enviadas novamente.",
    );
    formulario
      .setProgressBar(true)
      .setPublishingSummary(false)
      .setCollectEmail(false)
      .setAllowResponseEdits(false);
    const ids = {};
    const texto = (chave, titulo, obrigatorio, ajuda, validacao) => {
      const item = formulario.addTextItem().setTitle(titulo).setRequired(obrigatorio);
      if (ajuda) item.setHelpText(ajuda);
      if (validacao) item.setValidation(validacao);
      ids[chave] = String(item.getId());
      return item;
    };
    const lista = (chave, titulo, opcoes, obrigatorio) => {
      const item = formulario
        .addListItem()
        .setTitle(titulo)
        .setChoiceValues(opcoes)
        .setRequired(obrigatorio);
      ids[chave] = String(item.getId());
      return item;
    };
    const padrao = (regex, ajuda) =>
      FormApp.createTextValidation()
        .requireTextMatchesPattern(regex)
        .setHelpText(ajuda)
        .build();
    formulario.addSectionHeaderItem().setTitle("Seus dados");
    texto(
      "nome",
      "Nome completo",
      true,
      "Informe seu nome completo, sem abreviações.",
      FormApp.createTextValidation().requireTextLengthLessThanOrEqualTo(150).build(),
    );
    texto(
      "cpf",
      "CPF",
      true,
      "Digite os 11 números, mantendo zeros à esquerda.",
      padrao("^[0-9]{11}$", "Use 11 números, sem pontos ou traço."),
    );
    const nascimento = formulario
      .addDateItem()
      .setTitle("Data de nascimento")
      .setIncludesYear(true)
      .setRequired(true);
    ids.nascimento = String(nascimento.getId());
    lista(
      "genero",
      "Gênero",
      ["Masculino", "Feminino", "Outro", "Prefiro não informar"],
      false,
    );
    formulario.addPageBreakItem().setTitle("Contato");
    texto(
      "celular",
      "Celular",
      true,
      "DDD e número. Exemplo: 61999999999.",
      padrao("^[0-9]{10,13}$", "Informe de 10 a 13 números, incluindo DDD."),
    );
    texto(
      "telefone",
      "Telefone alternativo",
      false,
      "Opcional. Informe outro contato, se houver.",
      padrao("^[0-9]{10,13}$", "Informe de 10 a 13 números, incluindo DDD."),
    );
    texto(
      "email",
      "E-mail",
      true,
      "Informe um e-mail que você acompanha.",
      FormApp.createTextValidation().requireTextIsEmail().build(),
    );
    texto(
      "endereco",
      "Endereço do aluno",
      false,
      "Opcional: logradouro, número e complemento.",
      FormApp.createTextValidation().requireTextLengthLessThanOrEqualTo(300).build(),
    );
    texto(
      "cep",
      "CEP",
      false,
      "Opcional. Digite os oito números.",
      padrao("^[0-9]{8}$", "Use oito números, sem traço."),
    );
    formulario.addPageBreakItem().setTitle("Dados acadêmicos");
    lista(
      "turma",
      "Curso e turma",
      ofertas.map((o) => o.rotulo),
      true,
    ).setHelpText(
      "A opção reúne curso, tipo, turma e turno. Se sua turma não aparecer, confirme com a coordenação.",
    );
    lista(
      "termo",
      "Termo atual",
      Array.from({ length: Math.max(...ofertas.map((o) => o.termos)) }, (_, indice) =>
        String(indice + 1),
      ),
      true,
    ).setHelpText(
      "Selecione o termo que está cursando; o sistema valida a duração da turma.",
    );
    formulario.addPageBreakItem().setTitle("Situação profissional");
    lista(
      "situacao",
      "Você está trabalhando atualmente?",
      ["Sim", "Não", "Prefiro não informar"],
      false,
    ).setHelpText(
      "Informação declarada por você para conferência. Não altera automaticamente seu acompanhamento no sistema.",
    );
    texto(
      "empresa",
      "Nome da empresa em que trabalha",
      false,
      "Preencha somente se estiver trabalhando. Não informe uma empresa apenas por ter sido indicado.",
      FormApp.createTextValidation().requireTextLengthLessThanOrEqualTo(255).build(),
    );
    texto(
      "cnpj",
      "CNPJ da empresa",
      false,
      "Opcional. Se souber, informe os 14 números.",
      padrao("^[0-9]{14}$", "Use 14 números, sem pontuação."),
    );
    propriedades.setProperty("SIGA_V2_ITENS", JSON.stringify(ids));
    formulario.setDestination(FormApp.DestinationType.SPREADSHEET, SIGA_V2.PLANILHA);
    const acionador = ScriptApp.newTrigger("receberAlunoV2")
      .forForm(formulario)
      .onFormSubmit()
      .create();
    propriedades.setProperty("SIGA_V2_TRIGGER_ID", acionador.getUniqueId());
    propriedades.setProperty("SIGA_V2_INSTALADO", "SIM");
    console.log("Formulário novo (edição): " + formulario.getEditUrl());
    console.log("Planilha nova: " + planilha.getUrl());
    console.log(
      "Rascunho criado. Alunos válidos serão processados automaticamente por CPF pelo sistema.",
    );
  } finally {
    bloqueio.releaseLock();
  }
}

function receberAlunoV2(evento) {
  const propriedades = PropertiesService.getScriptProperties();
  if (
    !evento ||
    !evento.response ||
    !evento.source ||
    evento.source.getId() !== propriedades.getProperty("SIGA_V2_FORM_ID")
  )
    throw new Error("Evento inválido. Use somente o gatilho do formulário V2.");
  const bloqueio = LockService.getScriptLock();
  bloqueio.waitLock(30000);
  try {
    const planilha = abrirPlanilhaV2_();
    const aba = prepararRecebimentosV2_(planilha);
    const envio = evento.response.getId();
    if (!envio) throw new Error("Envio sem identificador.");
    if (
      aba.getLastRow() > 4 &&
      aba
        .getRange(5, 1, aba.getLastRow() - 4, 1)
        .getDisplayValues()
        .some((registro) => registro[0] === envio)
    )
      return;
    const ids = JSON.parse(propriedades.getProperty("SIGA_V2_ITENS") || "{}");
    const respostas = {};
    const itens = new Map(
      evento.response
        .getItemResponses()
        .map((registro) => [String(registro.getItem().getId()), registro.getResponse()]),
    );
    Object.keys(ids).forEach((chave) => (respostas[chave] = itens.get(ids[chave]) || ""));
    const dados = validarRespostaV2_(respostas, ofertasV2_(planilha));
    const linha = [
      envio,
      evento.response.getTimestamp().toISOString(),
      dados.nome,
      dados.cpf,
      dados.nascimento,
      dados.genero,
      dados.telefone,
      dados.celular,
      dados.email,
      dados.endereco,
      dados.cep,
      dados.curso,
      dados.turma,
      dados.termo,
      dados.situacao,
      dados.empresa,
      dados.cnpj,
      dados.erros.length ? "Dados a corrigir" : "Aguardando processamento automático",
      dados.erros.join("; "),
    ];
    const numeroLinha = Math.max(5, aba.getLastRow() + 1);
    if (numeroLinha > aba.getMaxRows()) aba.insertRowsAfter(aba.getMaxRows(), 100);
    // Texto explícito e neutralização de fórmulas fornecidas pelo respondente.
    aba
      .getRange(numeroLinha, 1, 1, linha.length)
      .setNumberFormat("@")
      .setValues([linha.map(textoSeguroV2_)]);
    // O sistema lê esta aba e aplica automaticamente os alunos válidos por CPF.
    console.log("Envio V2 registrado para processamento automático.");
  } finally {
    bloqueio.releaseLock();
  }
}

function atualizarFluxoAutomaticoAlunosV2() {
  const propriedades = PropertiesService.getScriptProperties();
  const id = propriedades.getProperty("SIGA_V2_FORM_ID");
  if (!id || propriedades.getProperty("SIGA_V2_INSTALADO") !== "SIM")
    throw new Error("Formulário ainda não instalado.");
  const formulario = FormApp.openById(id);
  formulario.setDescription(
    "Preencha seus dados para cadastro ou atualização automática pelo CPF. Confira o CPF, o curso e a turma antes de enviar. Status de indicação, contratação e vínculos com empresas são administrados pela coordenação.",
  );
  formulario.setConfirmationMessage(
    "Recebemos suas informações. Os dados válidos serão processados automaticamente na próxima sincronização do sistema. Respostas inválidas precisam ser corrigidas e enviadas novamente.",
  );
  formulario
    .getItems(FormApp.ItemType.LIST)
    .filter((item) => item.getTitle() === "Termo atual")
    .forEach((item) =>
      item
        .asListItem()
        .setHelpText(
          "Selecione o termo que está cursando; o sistema valida a duração da turma.",
        ),
    );
  console.log(
    "Texto do formulário de alunos atualizado. IDs, respostas e acionador preservados.",
  );
}

function abrirPlanilhaV2_() {
  if (!SIGA_V2.PLANILHA || SIGA_V2.PLANILHA === SIGA_V2.PLANILHA_ANTIGA)
    throw new Error("Configure exclusivamente a nova planilha.");
  const planilha = SpreadsheetApp.openById(SIGA_V2.PLANILHA);
  for (const nome of ["Cursos", "Turmas", "Alunos", "Matriculas", "Empresas"])
    if (!planilha.getSheetByName(nome)) throw new Error("Estrutura V2 incompleta.");
  return planilha;
}

function registrosV2_(planilha, nome, campos) {
  const aba = planilha.getSheetByName(nome);
  const dados = aba.getDataRange().getDisplayValues();
  const head = dados[3] || [];
  const colunas = campos.map((c) => head.indexOf(c));
  if (colunas.some((c) => c < 0))
    throw new Error("Cabeçalho V2 incompatível em " + nome + ".");
  return dados
    .slice(4)
    .filter((linha) => linha[colunas[0]])
    .map((linha) =>
      Object.fromEntries(
        campos.map((c, indice) => [c, String(linha[colunas[indice]] || "").trim()]),
      ),
    );
}

function ofertasV2_(planilha) {
  const cursos = registrosV2_(planilha, "Cursos", [
    "ID Curso",
    "Nome do curso",
    "Tipo de curso",
  ]);
  const turmas = registrosV2_(planilha, "Turmas", [
    "ID Turma",
    "ID Curso",
    "Código da turma",
    "Turno",
    "Data de início",
    "Data de fim",
    "Quantidade total de termos",
  ]);
  return turmas.flatMap((t) => {
    const c = cursos.find((c) => c["ID Curso"] === t["ID Curso"]);
    const termos = Number(t["Quantidade total de termos"]);
    if (
      !c ||
      !Number.isInteger(termos) ||
      termos < 1 ||
      termos > 20 ||
      !t["Data de início"] ||
      !t["Data de fim"]
    )
      return [];
    return [
      {
        id: t["ID Turma"],
        curso: c["ID Curso"],
        termos,
        rotulo:
          c["Nome do curso"] +
          " — " +
          c["Tipo de curso"] +
          " | " +
          t["Código da turma"] +
          " | " +
          t.Turno +
          " [" +
          t["ID Turma"] +
          "]",
      },
    ];
  });
}

function prepararRecebimentosV2_(planilha) {
  let aba = planilha.getSheetByName(SIGA_V2.RECEBIMENTOS);
  if (!aba) {
    aba = planilha.insertSheet(SIGA_V2.RECEBIMENTOS);
    aba
      .getRange("A1:S1")
      .merge()
      .setValue("S.I.G.A. | Recebimentos do novo formulário")
      .setFontSize(16)
      .setFontWeight("bold");
    aba
      .getRange("A2:S2")
      .merge()
      .setValue(
        "Dados declarados, aguardando conferência. Não alteram automaticamente cadastros ou status.",
      )
      .setWrap(true);
    aba
      .getRange(4, 1, 1, SIGA_V2.CABECALHOS.length)
      .setValues([SIGA_V2.CABECALHOS])
      .setBackground("#0a3d7c")
      .setFontColor("#ffffff")
      .setFontWeight("bold")
      .setWrap(true);
  }
  const atual = aba.getRange(4, 1, 1, SIGA_V2.CABECALHOS.length).getDisplayValues()[0];
  if (JSON.stringify(atual) !== JSON.stringify(SIGA_V2.CABECALHOS))
    throw new Error("Cabeçalho de recebimentos divergente; não sobrescrito.");
  // Reaplica também após instalação interrompida. Títulos mesclados impedem congelar só duas colunas.
  aba.setFrozenRows(4);
  aba.setFrozenColumns(0);
  aba.setColumnWidths(1, 19, 170);
  aba.setColumnWidth(3, 270);
  aba.setColumnWidth(10, 300);
  aba.setColumnWidth(19, 300);
  aba.setRowHeight(4, 44);
  return aba;
}

function textoSeguroV2_(valor) {
  const text = String(valor == null ? "" : valor);
  return /^[=+@-]/.test(text) ? "'" + text : text;
}

function documentoV2_(valor, tipo) {
  const documento = String(valor || "").replace(/\D/g, "");
  const size = tipo === "CPF" ? 11 : 14;
  if (documento.length !== size || /^(\d)\1+$/.test(documento)) return false;
  const digito = (base) => {
    let peso = tipo === "CPF" ? base.length + 1 : base.length - 7;
    let soma = 0;
    for (const quantidade of base) {
      soma += Number(quantidade) * peso--;
      if (tipo !== "CPF" && peso < 2) peso = 9;
    }
    const registro = soma % 11;
    return String(registro < 2 ? 0 : 11 - registro);
  };
  const base = documento.slice(0, -2);
  return documento === base + digito(base) + digito(base + digito(base));
}

function nascimentoV2_(valor) {
  const text = String(valor || "").trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  const p = iso
    ? iso.slice(1).map(Number)
    : br
      ? [Number(br[3]), Number(br[2]), Number(br[1])]
      : [];
  const dados = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
  if (
    p[0] < 1900 ||
    !p.length ||
    dados.getUTCFullYear() !== p[0] ||
    dados.getUTCMonth() !== p[1] - 1 ||
    dados.getUTCDate() !== p[2]
  )
    return "";
  return dados.toISOString().slice(0, 10);
}

function validarRespostaV2_(registro, ofertas) {
  const text = (chave) => String(registro[chave] || "").trim();
  const resultado = {
    nome: text("nome"),
    cpf: text("cpf").replace(/\D/g, ""),
    nascimento: nascimentoV2_(registro.nascimento),
    genero: text("genero"),
    telefone: text("telefone"),
    celular: text("celular"),
    email: text("email"),
    endereco: text("endereco"),
    cep: text("cep"),
    situacao: text("situacao"),
    empresa: text("empresa"),
    cnpj: text("cnpj").replace(/\D/g, ""),
    termo: text("termo"),
    curso: "",
    turma: "",
    erros: [],
  };
  const fail = (code) => resultado.erros.push(code);
  if (!resultado.nome || resultado.nome.length > 150) fail("NOME_INVALIDO");
  if (!documentoV2_(resultado.cpf, "CPF")) fail("CPF_INVALIDO");
  if (
    !resultado.nascimento ||
    resultado.nascimento >
      Utilities.formatDate(new Date(), "America/Sao_Paulo", "yyyy-MM-dd")
  )
    fail("NASCIMENTO_INVALIDO");
  if (
    !/^\d{10,13}$/.test(resultado.celular) ||
    (resultado.telefone && !/^\d{10,13}$/.test(resultado.telefone))
  )
    fail("CONTATO_INVALIDO");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resultado.email) || resultado.email.length > 255)
    fail("EMAIL_INVALIDO");
  if (
    resultado.endereco.length > 300 ||
    (resultado.cep && !/^\d{8}$/.test(resultado.cep))
  )
    fail("ENDERECO_OU_CEP_INVALIDO");
  const oferta = ofertas.find((o) => o.rotulo === text("turma"));
  if (!oferta) fail("TURMA_NAO_CONFIRMADA");
  else {
    resultado.curso = oferta.curso;
    resultado.turma = oferta.id;
  }
  if (
    !/^\d+$/.test(resultado.termo) ||
    Number(resultado.termo) < 1 ||
    !oferta ||
    Number(resultado.termo) > oferta.termos
  )
    fail("TERMO_INVALIDO");
  if (resultado.cnpj && !documentoV2_(resultado.cnpj, "CNPJ")) fail("CNPJ_INVALIDO");
  if ((resultado.empresa || resultado.cnpj) && resultado.situacao !== "Sim")
    fail("VINCULO_DECLARADO_INCOERENTE");
  return resultado;
}
