/** Instalar no mesmo projeto V2. Nunca substitui o formulário antigo de empresas. */
const SIGA_EMPRESAS_V2 = {
  ABA: "Recebimentos Empresas",
  CABECALHOS: [
    "ID Envio",
    "Recebido em",
    "Razão social",
    "Nome fantasia",
    "CNPJ",
    "E-mail",
    "Telefone",
    "Contribuinte?",
    "Conferência",
    "Pendências",
  ],
};

function instalarFormularioEmpresasV2() {
  const bloqueio = LockService.getScriptLock();
  bloqueio.waitLock(30000);
  try {
    const propriedades = PropertiesService.getScriptProperties();
    const existente = propriedades.getProperty("SIGA_V2_EMPRESA_FORM_ID");
    if (existente) {
      if (propriedades.getProperty("SIGA_V2_EMPRESA_INSTALADO") !== "SIM")
        throw new Error(
          "Instalação parcial: revisar formulário existente antes de continuar.",
        );
      console.log(FormApp.openById(existente).getEditUrl());
      return;
    }
    const planilha = abrirPlanilhaV2_();
    prepararEmpresasV2_(planilha);
    const formulario = FormApp.create(
      "S.I.G.A. | Cadastro de empresas — Nova estrutura",
      false,
    );
    propriedades.setProperty("SIGA_V2_EMPRESA_FORM_ID", formulario.getId());
    formulario
      .setDescription(
        "Informe os dados da empresa para cadastro ou atualização. A coordenação fará a conferência. Este cadastro não concede acesso ao sistema. Não informe senhas.",
      )
      .setConfirmationMessage(
        "Recebemos os dados da empresa para conferência pela coordenação.",
      )
      .setProgressBar(true)
      .setPublishingSummary(false)
      .setCollectEmail(false)
      .setAllowResponseEdits(false);
    const ids = {};
    const texto = (chave, titulo, obrigatorio, validacao) => {
      const item = formulario.addTextItem().setTitle(titulo).setRequired(obrigatorio);
      if (validacao) item.setValidation(validacao);
      ids[chave] = String(item.getId());
    };
    const maximo = (quantidade) =>
      FormApp.createTextValidation()
        .requireTextLengthLessThanOrEqualTo(quantidade)
        .build();
    const regex = (p, mensagem) =>
      FormApp.createTextValidation()
        .requireTextMatchesPattern(p)
        .setHelpText(mensagem)
        .build();
    formulario.addSectionHeaderItem().setTitle("Identificação da empresa");
    texto("razaoSocial", "Razão social", true, maximo(255));
    texto("nomeFantasia", "Nome fantasia", false, maximo(255));
    texto("cnpj", "CNPJ", true, regex("^[0-9]{14}$", "Use 14 números, sem pontuação."));
    formulario.addPageBreakItem().setTitle("Contato e informações complementares");
    texto(
      "email",
      "E-mail",
      true,
      FormApp.createTextValidation().requireTextIsEmail().build(),
    );
    texto(
      "telefone",
      "Telefone",
      true,
      regex("^[0-9]{10,13}$", "Inclua DDD. Use de 10 a 13 números."),
    );
    const contribuinte = formulario
      .addListItem()
      .setTitle("A empresa é contribuinte?")
      .setChoiceValues(["Sim", "Não", "Não informado"])
      .setRequired(true);
    ids.contribuinte = String(contribuinte.getId());
    propriedades.setProperty("SIGA_V2_EMPRESA_ITENS", JSON.stringify(ids));
    formulario.setDestination(FormApp.DestinationType.SPREADSHEET, SIGA_V2.PLANILHA);
    const acionador = ScriptApp.newTrigger("receberEmpresaV2")
      .forForm(formulario)
      .onFormSubmit()
      .create();
    propriedades.setProperty("SIGA_V2_EMPRESA_TRIGGER_ID", acionador.getUniqueId());
    propriedades.setProperty("SIGA_V2_EMPRESA_INSTALADO", "SIM");
    console.log("Formulário de empresas (rascunho): " + formulario.getEditUrl());
  } finally {
    bloqueio.releaseLock();
  }
}

function prepararEmpresasV2_(planilha) {
  let aba = planilha.getSheetByName(SIGA_EMPRESAS_V2.ABA);
  if (!aba) {
    aba = planilha.insertSheet(SIGA_EMPRESAS_V2.ABA);
    aba
      .getRange("A1:J1")
      .merge()
      .setValue("S.I.G.A. | Recebimentos de empresas")
      .setFontSize(16)
      .setFontWeight("bold");
    aba
      .getRange("A2:J2")
      .merge()
      .setValue("Dados para conferência. Não concedem acesso ao sistema.");
    aba
      .getRange(4, 1, 1, 10)
      .setValues([SIGA_EMPRESAS_V2.CABECALHOS])
      .setBackground("#0a3d7c")
      .setFontColor("#ffffff")
      .setFontWeight("bold");
  }
  if (
    JSON.stringify(aba.getRange(4, 1, 1, 10).getDisplayValues()[0]) !==
    JSON.stringify(SIGA_EMPRESAS_V2.CABECALHOS)
  )
    throw new Error("Cabeçalho de recebimentos de empresas incompatível.");
  aba.setFrozenRows(4);
  aba.setColumnWidths(1, 10, 180);
  aba.setColumnWidth(3, 300);
  return aba;
}

function validarEmpresaV2_(registro) {
  const dados = Object.fromEntries(
    ["razaoSocial", "nomeFantasia", "cnpj", "email", "telefone", "contribuinte"].map(
      (chave) => [chave, String(registro[chave] || "").trim()],
    ),
  );
  dados.erros = [];
  if (
    !dados.razaoSocial ||
    dados.razaoSocial.length > 255 ||
    dados.nomeFantasia.length > 255
  )
    dados.erros.push("NOME_INVALIDO");
  if (!/^\d{14}$/.test(dados.cnpj) || !documentoV2_(dados.cnpj, "CNPJ"))
    dados.erros.push("CNPJ_INVALIDO");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email) || dados.email.length > 255)
    dados.erros.push("EMAIL_INVALIDO");
  if (!/^\d{10,13}$/.test(dados.telefone)) dados.erros.push("TELEFONE_INVALIDO");
  if (!["Sim", "Não", "Não informado"].includes(dados.contribuinte))
    dados.erros.push("CONTRIBUINTE_INVALIDO");
  return dados;
}

function receberEmpresaV2(evento) {
  const propriedades = PropertiesService.getScriptProperties();
  if (
    !evento ||
    !evento.response ||
    !evento.source ||
    evento.source.getId() !== propriedades.getProperty("SIGA_V2_EMPRESA_FORM_ID")
  )
    throw new Error("Evento de empresa inválido.");
  const bloqueio = LockService.getScriptLock();
  bloqueio.waitLock(30000);
  try {
    const aba = prepararEmpresasV2_(abrirPlanilhaV2_());
    const envio = evento.response.getId();
    if (!envio) throw new Error("Envio sem ID.");
    if (
      aba.getLastRow() > 4 &&
      aba
        .getRange(5, 1, aba.getLastRow() - 4, 1)
        .getDisplayValues()
        .some((registro) => registro[0] === envio)
    )
      return;
    const ids = JSON.parse(propriedades.getProperty("SIGA_V2_EMPRESA_ITENS") || "{}");
    const itens = new Map(
      evento.response
        .getItemResponses()
        .map((registro) => [String(registro.getItem().getId()), registro.getResponse()]),
    );
    const dados = validarEmpresaV2_(
      Object.fromEntries(
        Object.keys(ids).map((chave) => [chave, itens.get(ids[chave]) || ""]),
      ),
    );
    const linha = [
      envio,
      evento.response.getTimestamp().toISOString(),
      dados.razaoSocial,
      dados.nomeFantasia,
      dados.cnpj,
      dados.email,
      dados.telefone,
      dados.contribuinte,
      dados.erros.length ? "Dados a corrigir" : "Aguardando revisão",
      dados.erros.join("; "),
    ];
    const quantidade = Math.max(5, aba.getLastRow() + 1);
    if (quantidade > aba.getMaxRows()) aba.insertRowsAfter(aba.getMaxRows(), 100);
    aba
      .getRange(quantidade, 1, 1, 10)
      .setNumberFormat("@")
      .setValues([linha.map(textoSeguroV2_)]);
    console.log("Recebimento de empresa registrado para conferência.");
  } finally {
    bloqueio.releaseLock();
  }
}
