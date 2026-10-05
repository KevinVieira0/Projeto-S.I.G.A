import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { migrarBaseAcademica } from "./lib/migracao-alunos";

async function executarScript() {
  const argumentos = process.argv.slice(2);
  if (argumentos.some((a) => !["--aplicar", "--backup-confirmado"].includes(a)))
    throw new Error(
      "Opção desconhecida. Sem opções: simulação. Para gravar: --aplicar --backup-confirmado.",
    );
  const aplicar = argumentos.includes("--aplicar");
  if (aplicar && !argumentos.includes("--backup-confirmado"))
    throw new Error(
      "Faça e confira o backup; depois utilize --aplicar --backup-confirmado.",
    );
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");
  const resumo = await migrarBaseAcademica(prisma, { aplicar });
  console.log(JSON.stringify(resumo, null, 2));
  console.log(
    "As telas atuais continuam usando o legado. Não remover campos antigos nesta etapa.",
  );
}
executarScript()
  .catch((erroCapturado) => {
    // Não imprimir objetos Prisma, URLs, credenciais ou dados pessoais.
    const conhecidos = [
      "Opção desconhecida",
      "Faça e confira",
      "DATABASE_URL",
      "Já existe uma migração",
    ];
    console.error(
      conhecidos.some((prefix) => erroCapturado.message?.startsWith(prefix))
        ? erroCapturado.message
        : "Migração não concluída; transação revertida. Confira a estrutura, a conexão e as permissões do banco. Nenhum dado pessoal foi registrado no log.",
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
