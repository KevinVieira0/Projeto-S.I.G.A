import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const contexto = vm.createContext({
  Utilities: { formatDate: () => "2026-10-06" },
  console,
});
for (const arquivo of ["FormularioAlunosV2.gs", "FormularioEmpresasV2.gs"])
  vm.runInContext(
    readFileSync(
      new URL("../scripts/google-apps-script/" + arquivo, import.meta.url),
      "utf8",
    ),
    contexto,
  );

test("formulário de empresa valida dados sem aprovação manual", () => {
  const dados = contexto.validarEmpresaV2_({
    razaoSocial: "Empresa fictícia",
    cnpj: "11222333000181",
    email: "empresa@example.invalid",
    telefone: "6133333333",
    contribuinte: "Sim",
  });
  assert.equal(dados.erros.length, 0);
  assert.ok(
    contexto
      .validarEmpresaV2_({ ...dados, cnpj: "11111111111111" })
      .erros.includes("CNPJ_INVALIDO"),
  );
});

test("formulário de aluno rejeita CPF inválido e termo incompatível", () => {
  const ofertas = [
    { id: "TUR-001", curso: "CUR-001", termos: 3, rotulo: "Curso e turma" },
  ];
  const dados = {
    nome: "Aluno fictício",
    cpf: "52998224725",
    nascimento: "2006-01-01",
    celular: "61999999999",
    email: "aluno@example.invalid",
    turma: "Curso e turma",
    termo: "2",
    situacao: "Não",
  };
  assert.equal(contexto.validarRespostaV2_(dados, ofertas).erros.length, 0);
  assert.ok(
    contexto
      .validarRespostaV2_({ ...dados, cpf: "11111111111" }, ofertas)
      .erros.includes("CPF_INVALIDO"),
  );
  assert.ok(
    contexto
      .validarRespostaV2_({ ...dados, termo: "4" }, ofertas)
      .erros.includes("TERMO_INVALIDO"),
  );
  assert.ok(
    contexto
      .validarRespostaV2_({ ...dados, turma: "Turma ausente" }, ofertas)
      .erros.includes("TURMA_NAO_CONFIRMADA"),
  );
});

test("nomes recebidos não viram fórmulas na planilha", () => {
  assert.equal(
    contexto.textoSeguroV2_('=IMPORTXML("https://example.invalid")'),
    '\'=IMPORTXML("https://example.invalid")',
  );
  assert.equal(contexto.textoSeguroV2_("Empresa fictícia"), "Empresa fictícia");
});
