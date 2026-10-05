import "dotenv/config";
import fs from "node:fs";
import { prisma } from "../src/lib/prisma";
import { lerBaseAcademicaDaPlanilha } from "../src/lib/importacao/googleSheetsAcademico";
import { validarBaseAcademica } from "../src/lib/importacao/baseAcademica";
import {
  montarDemonstracao,
  contarBase as counts,
} from "../src/lib/demonstracao/montarBase";

async function executarScript() {
  const url = new URL(process.env.DIRECT_URL || "");
  if (
    !["localhost", "127.0.0.1"].includes(url.hostname) ||
    url.pathname !== "/siga_local" ||
    process.env.DATABASE_URL !== process.env.DIRECT_URL
  )
    throw new Error("Use somente o banco local siga_local.");
  const catalogo = validarBaseAcademica(await lerBaseAcademicaDaPlanilha());
  const aplicar = process.argv.includes("--aplicar");
  console.log(
    JSON.stringify({
      modo: aplicar ? "aplicar" : "previa",
      atual: await counts(prisma),
      cursosValidos: catalogo.registros.Cursos.filter((c) => c.valido).length,
      turmasValidas: catalogo.registros.Turmas.filter((t) => t.valido).length,
      demonstracao: { alunos: 36, empresas: 6 },
    }),
  );
  if (!aplicar) return;
  const indice = process.argv.indexOf("--backup");
  if (indice < 0) throw new Error("Informe o comprovante do backup verificado.");
  const comprovante = JSON.parse(fs.readFileSync(process.argv[indice + 1], "utf8"));
  if (!comprovante.restauracaoVerificada || !fs.existsSync(comprovante.backup))
    throw new Error("Backup não verificado.");
  const resultado = await prisma.$transaction(
    async (transacao) => {
      await transacao.$executeRaw`SELECT pg_advisory_xact_lock(741004)`;
      const atual = await counts(transacao);
      if (
        Object.entries(atual).some(
          ([chave, valor]) => comprovante.contagens[chave] !== valor,
        )
      )
        throw new Error("Banco mudou após o backup. Gere um novo backup.");
      return montarDemonstracao(transacao, catalogo);
    },
    { timeout: 60000 },
  );
  console.log(JSON.stringify(resultado));
}
if (!process.env.SIGA_DEMO_IMPORT_ONLY)
  executarScript()
    .catch((e) => {
      console.error(
        e.message?.startsWith("Banco mudou")
          ? e.message
          : "Preparação não concluída; nenhuma informação pessoal exibida.",
      );
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
