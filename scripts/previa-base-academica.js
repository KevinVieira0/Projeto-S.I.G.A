import "dotenv/config";
import { readFile } from "node:fs/promises";
import { prisma } from "../src/lib/prisma";
import {
  ErroFonteAcademica,
  lerBaseAcademicaDaPlanilha,
} from "../src/lib/importacao/googleSheetsAcademico";
import { gerarPreviaAcademica } from "../src/lib/importacao/previaAcademica";

async function executarScript() {
  const argumentos = process.argv.slice(2);
  if (argumentos.length && !(argumentos.length === 2 && argumentos[0] === "--arquivo"))
    throw new ErroFonteAcademica(
      "Use sem argumentos para Google Sheets ou --arquivo caminho.json. Esta rotina não aceita --aplicar.",
    );
  const abas = argumentos.length
    ? JSON.parse(await readFile(argumentos[1], "utf8"))
    : await lerBaseAcademicaDaPlanilha();
  console.log(JSON.stringify(await gerarPreviaAcademica(prisma, abas), null, 2));
}
executarScript()
  .catch((erroCapturado) => {
    console.error(
      erroCapturado instanceof ErroFonteAcademica
        ? erroCapturado.message
        : "Prévia não concluída. Confira o arquivo, o banco e as permissões. Nenhum dado foi gravado.",
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
