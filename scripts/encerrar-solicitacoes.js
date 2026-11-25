import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { encerrarSolicitacoesVencidas } from "../src/lib/solicitacoes/encerramento";

encerrarSolicitacoesVencidas(prisma)
  .then((total) =>
    console.log(`Solicitações encerradas por falta de retorno: ${total}.`),
  )
  .catch((erro) => {
    console.error(
      "Falha no encerramento das solicitações.",
      erro.code || erro.name,
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
