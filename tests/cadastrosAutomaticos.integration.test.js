import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "../src/lib/prisma";
import {
  importarRecebimentos,
  CABECALHOS_RECEBIMENTOS,
} from "../src/lib/importacao/recebimentos";
import { ABAS_ACADEMICAS } from "../src/lib/importacao/baseAcademica";
import { automatizarCadastros } from "../src/lib/importacao/automatizarCadastros";
import { processarRecebimento } from "../src/lib/importacao/processarRecebimento";
import { sincronizarCatalogo } from "../src/lib/importacao/sincronizarCatalogo";
import { montarEspelho } from "../src/lib/importacao/espelharBase";
import { GET as alunos } from "../src/app/api/admin/alunos/route";
import { GET as empresas } from "../src/app/api/admin/empresas/route";
import { GET as resumo } from "../src/app/api/admin/dashboard/resumo/route";
import { POST as aprovar } from "../src/app/api/admin/recebimentos/[id]/route";
import { createSessionToken, SESSION_COOKIE } from "../src/lib/auth/session";

test(
  "cadastros automáticos e indicadores no banco isolado",
  { skip: !process.env.TEST_DATABASE_URL },
  async (t) => {
    const url = new URL(process.env.TEST_DATABASE_URL);
    assert.ok(
      ["localhost", "127.0.0.1"].includes(url.hostname) &&
        url.pathname === "/siga_test",
    );
    assert.equal(process.env.DATABASE_URL, process.env.TEST_DATABASE_URL);
    process.env.AUTH_SECRET = "segredo-ficticio-somente-dos-testes-20261006";
    const fonte = "automacao-" + randomUUID();
    const nomeCurso = "Curso fictício " + fonte;
    const adminId = randomUUID();
    const senhaHash = "hash-ficticio";
    const token = createSessionToken("admin", { id: adminId, senhaHash });
    const req = (caminho, autenticado = true, post = false) =>
      new NextRequest("http://localhost:3000" + caminho, {
        method: post ? "POST" : "GET",
        headers: {
          ...(autenticado ? { cookie: `${SESSION_COOKIE}=${token}` } : {}),
          ...(post
            ? {
                origin: "http://localhost:3000",
                "Content-Type": "application/json",
              }
            : {}),
        },
        ...(post ? { body: "{}" } : {}),
      });
    function fixture(aluno = {}, empresa = {}) {
      const abas = Object.fromEntries(
        Object.entries(ABAS_ACADEMICAS).map(([nome, cabecalhos]) => [
          nome,
          [cabecalhos],
        ]),
      );
      abas.Cursos.push(["CUR-001", nomeCurso, "Curso Técnico"]);
      abas.Turmas.push([
        "TUR-001",
        "CUR-001",
        "TDS1",
        "Manhã",
        "2026-07-22",
        "2026-12-18",
        3,
      ]);
      const dadosAluno = {
        "ID Envio": "aluno-1",
        "Recebido em": "2026-10-06T10:00:00.000Z",
        "Nome completo": "Aluno fictício",
        CPF: "52998224725",
        "Data de nascimento": "2006-01-01",
        Gênero: "Outro",
        Celular: "61999999999",
        "E-mail": "aluno@example.invalid",
        "ID Curso": "CUR-001",
        "ID Turma": "TUR-001",
        "Termo atual": "2",
        "Situação profissional informada": "Não",
        ...aluno,
      };
      const dadosEmpresa = {
        "ID Envio": "empresa-1",
        "Recebido em": "2026-10-06T09:00:00.000Z",
        "Razão social": "Empresa fictícia",
        "Nome fantasia": "Teste",
        CNPJ: "11222333000181",
        "E-mail": "empresa@example.invalid",
        Telefone: "6133333333",
        "Contribuinte?": "Sim",
        ...empresa,
      };
      for (const [tipo, dados, nome] of [
        ["ALUNO", dadosAluno, "Recebimentos Alunos"],
        ["EMPRESA", dadosEmpresa, "Recebimentos Empresas"],
      ])
        abas[nome] = [
          CABECALHOS_RECEBIMENTOS[tipo],
          CABECALHOS_RECEBIMENTOS[tipo].map((campo) => dados[campo] ?? ""),
        ];
      return abas;
    }
    let alunoId, empresaId;
    try {
      assert.equal(
        await prisma.aluno.count({ where: { cpf: "52998224725" } }),
        0,
      );
      assert.equal(
        await prisma.empresa.count({ where: { cnpj: "11222333000181" } }),
        0,
      );
      await prisma.administrador.create({
        data: {
          id: adminId,
          nome: "Admin fictício",
          email: fonte + "@example.invalid",
          senhaHash,
        },
      });
      await t.test("cadastra o catálogo sem depender de um aluno", async () => {
        const r = await sincronizarCatalogo(prisma, fixture());
        assert.equal(r.cursosCriados, 1);
        assert.equal(r.turmasCriadas, 1);
        const repetido = await sincronizarCatalogo(prisma, fixture());
        assert.equal(repetido.cursosCriados, 0);
        assert.equal(repetido.turmasCriadas, 0);
        assert.equal(
          await prisma.aluno.count({ where: { cpf: "52998224725" } }),
          0,
        );
      });
      await t.test("cria aluno e empresa sem aprovação", async () => {
        assert.equal(
          (await importarRecebimentos(prisma, fonte, fixture())).novos,
          2,
        );
        const primeiro = await prisma.recebimentoCadastro.findFirst({
          where: { fonte, tipo: "EMPRESA" },
        });
        assert.equal(
          (await processarRecebimento(prisma, primeiro.id)).operacao,
          "criado",
        );
        assert.equal(
          (await automatizarCadastros(prisma, fonte, "ALUNO")).criados,
          1,
        );
        const a = await prisma.aluno.findUnique({
          where: { cpf: "52998224725" },
          include: { matriculas: true },
        });
        alunoId = a.id;
        const e = await prisma.empresa.findUnique({
          where: { cnpj: "11222333000181" },
        });
        empresaId = e.id;
        assert.equal(a.statusIndicacao, "Disponível");
        assert.equal(a.matriculas.length, 1);
        assert.equal(a.matriculas[0].status, "DISPONIVEL");
        assert.equal(e.ativa, true);
        assert.equal(e.autorizada, false);
        assert.equal(e.senhaHash, null);
        assert.equal(
          await prisma.recebimentoCadastro.count({
            where: { fonte, estado: "PROCESSADO" },
          }),
          2,
        );
      });
      await t.test(
        "releitura não duplica nem registra outro histórico",
        async () => {
          assert.equal(
            (await importarRecebimentos(prisma, fonte, fixture())).repetidos,
            2,
          );
          assert.equal(
            (await automatizarCadastros(prisma, fonte, "ALUNO")).criados,
            0,
          );
          assert.equal(
            (await automatizarCadastros(prisma, fonte, "EMPRESA")).criados,
            0,
          );
          assert.equal(
            await prisma.historicoAcompanhamento.count({
              where: { matricula: { alunoId } },
            }),
            1,
          );
        },
      );
      await t.test(
        "CPF/CNPJ existentes atualizam e preservam situação e acesso",
        async () => {
          await prisma.empresa.update({
            where: { id: empresaId },
            data: {
              ativa: false,
              autorizada: true,
              senhaHash: "hash-preservado",
            },
          });
          await prisma.aluno.update({
            where: { id: alunoId },
            data: {
              statusIndicacao: "Contratado",
              empresaId,
              empregado: true,
              telefone: "6133333333",
            },
          });
          await prisma.matricula.updateMany({
            where: { alunoId },
            data: { status: "CONTRATADO", empresaAtualId: empresaId },
          });
          await importarRecebimentos(
            prisma,
            fonte,
            fixture(
              {
                "ID Envio": "aluno-2",
                "Recebido em": "2026-10-06T12:00:00.000Z",
                "Nome completo": "Nome atualizado",
                "Termo atual": "3",
              },
              {
                "ID Envio": "empresa-2",
                "Recebido em": "2026-10-06T11:00:00.000Z",
                "Razão social": "Empresa atualizada",
                "Nome fantasia": "",
                "Contribuinte?": "Não informado",
              },
            ),
          );
          assert.equal(
            (await automatizarCadastros(prisma, fonte, "ALUNO")).atualizados,
            1,
          );
          assert.equal(
            (await automatizarCadastros(prisma, fonte, "EMPRESA")).atualizados,
            1,
          );
          const a = await prisma.aluno.findUnique({
            where: { id: alunoId },
            include: { matriculas: true },
          });
          const e = await prisma.empresa.findUnique({
            where: { id: empresaId },
          });
          assert.equal(a.nome, "Nome atualizado");
          assert.equal(a.statusIndicacao, "Contratado");
          assert.equal(a.empresaId, empresaId);
          assert.equal(a.telefone, "6133333333");
          assert.equal(a.matriculas[0].termoAtual, 3);
          assert.equal(e.razaoSocial, "Empresa atualizada");
          assert.equal(e.ativa, false);
          assert.equal(e.autorizada, true);
          assert.equal(e.senhaHash, "hash-preservado");
          assert.equal(e.nomeFantasia, "Teste");
          assert.equal(e.contribuinte, true);
        },
      );
      await t.test(
        "inválidos são bloqueados e envios antigos não sobrescrevem",
        async () => {
          await importarRecebimentos(
            prisma,
            fonte,
            fixture(
              { "ID Envio": "aluno-invalido", CPF: "11111111111" },
              { "ID Envio": "empresa-invalida", CNPJ: "11111111111111" },
            ),
          );
          await importarRecebimentos(
            prisma,
            fonte,
            fixture(
              { "ID Envio": "aluno-antigo" },
              { "ID Envio": "empresa-antiga" },
            ),
          );
          for (const tipo of ["ALUNO", "EMPRESA"]) {
            const r = await automatizarCadastros(prisma, fonte, tipo);
            assert.equal(r.invalidos, 1);
            assert.equal(r.ignorados, 1);
            assert.equal(r.falhas, 0);
          }
          assert.equal(
            (await prisma.aluno.findUnique({ where: { id: alunoId } })).nome,
            "Nome atualizado",
          );
          assert.equal(
            (await prisma.empresa.findUnique({ where: { id: empresaId } }))
              .razaoSocial,
            "Empresa atualizada",
          );
          assert.equal(
            await prisma.recebimentoCadastro.count({
              where: { fonte, estado: "INVALIDO" },
            }),
            2,
          );
        },
      );
      await t.test("concorrência processa uma única vez", async () => {
        await importarRecebimentos(
          prisma,
          fonte,
          fixture({
            "ID Envio": "aluno-concorrente",
            "Recebido em": "2026-10-06T13:00:00.000Z",
          }),
        );
        const resultados = await Promise.all([
          automatizarCadastros(prisma, fonte, "ALUNO"),
          automatizarCadastros(prisma, fonte, "ALUNO"),
        ]);
        assert.equal(
          resultados.reduce((n, r) => n + r.atualizados, 0),
          1,
        );
        assert.equal(
          await prisma.aluno.count({ where: { cpf: "52998224725" } }),
          1,
        );
      });
      await t.test(
        "abas do espelho mantêm IDs de cursos/turmas e não incluem senha",
        async () => {
          const base = {
            alunos: await prisma.aluno.findMany({ where: { id: alunoId } }),
            empresas: await prisma.empresa.findMany({
              where: { id: empresaId },
            }),
            cursos: await prisma.curso.findMany({ where: { nome: nomeCurso } }),
            turmas: await prisma.turma.findMany({
              where: { curso: { nome: nomeCurso } },
            }),
            matriculas: await prisma.matricula.findMany({ where: { alunoId } }),
            historico: await prisma.historicoAcompanhamento.findMany({
              where: { matricula: { alunoId } },
            }),
          };
          const espelho = montarEspelho(base, fixture());
          assert.equal(espelho.catalogo.cursos, 1);
          assert.equal(espelho.catalogo.turmas, 1);
          assert.equal(espelho.linhas.Matriculas[0][2], "TUR-001");
          assert.equal(espelho.linhas.Matriculas[0][4], "Empregado");
          assert.ok(!JSON.stringify(espelho).includes("hash-preservado"));
          const conflitante = fixture();
          conflitante.Turmas[1][6] = 2;
          assert.throws(
            () => montarEspelho(base, conflitante),
            /duração divergente/,
          );
        },
      );
      await t.test(
        "tabelas e indicadores consultam a base oficial; aprovação foi retirada",
        async () => {
          assert.equal(
            (await alunos(req("/api/admin/alunos", false))).status,
            401,
          );
          assert.equal(
            (await aprovar(req("/api/admin/recebimentos/x", true, true)))
              .status,
            410,
          );
          const listagem = await (
            await alunos(req("/api/admin/alunos"))
          ).json();
          assert.ok(listagem.alunos.some((a) => a.id === alunoId));
          const listaEmpresas = await (
            await empresas(req("/api/admin/empresas?busca=11222333000181"))
          ).json();
          assert.equal(listaEmpresas.total, 1);
          assert.ok(!JSON.stringify(listaEmpresas).includes("hash-preservado"));
          const dados = await (
            await resumo(req("/api/admin/dashboard/resumo?periodo=7"))
          ).json();
          assert.ok(dados.alunos.total >= 1);
          assert.ok(dados.empresas.total >= 1);
        },
      );
      await t.test(
        "CPF arquivado não é reativado pelo formulário",
        async () => {
          await prisma.aluno.update({
            where: { id: alunoId },
            data: { arquivadoEm: new Date() },
          });
          await importarRecebimentos(
            prisma,
            fonte,
            fixture({
              "ID Envio": "aluno-arquivado",
              "Recebido em": "2026-10-06T14:00:00.000Z",
            }),
          );
          assert.equal(
            (await automatizarCadastros(prisma, fonte, "ALUNO")).ignorados,
            1,
          );
          assert.ok(
            (await prisma.aluno.findUnique({ where: { id: alunoId } }))
              .arquivadoEm,
          );
          const listagem = await (
            await alunos(req("/api/admin/alunos"))
          ).json();
          assert.ok(!listagem.alunos.some((a) => a.id === alunoId));
        },
      );
    } finally {
      await prisma.historicoAcompanhamento.deleteMany({
        where: { matricula: { aluno: { cpf: "52998224725" } } },
      });
      await prisma.matricula.deleteMany({
        where: { aluno: { cpf: "52998224725" } },
      });
      await prisma.aluno.deleteMany({ where: { cpf: "52998224725" } });
      await prisma.empresa.deleteMany({ where: { cnpj: "11222333000181" } });
      await prisma.turma.deleteMany({ where: { curso: { nome: nomeCurso } } });
      await prisma.curso.deleteMany({ where: { nome: nomeCurso } });
      await prisma.recebimentoCadastro.deleteMany({ where: { fonte } });
      await prisma.administrador.deleteMany({ where: { id: adminId } });
      await prisma.$disconnect();
    }
  },
);
