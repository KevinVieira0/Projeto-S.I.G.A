import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { sincronizarRecebimentos } from "../src/lib/importacao/sincronizarRecebimentos";

async function executarScript() {
  if (process.argv.length > 2)
    throw new Error(
      "Este comando recebe propostas; não aceita aprovação por argumentos.",
    );
  const registro = await sincronizarRecebimentos(prisma);
  console.log(JSON.stringify(registro));
  const pendentes = await prisma.recebimentoCadastro.findMany({
    where: { estado: "PENDENTE" },
    select: { tipo: true, erros: true },
  });
  console.log(
    JSON.stringify({
      pendentes: pendentes.length,
      problemas: pendentes.flatMap((recebimento) => recebimento.erros),
    }),
  );
}
executarScript()
  .catch(() => {
    console.error(
      "Importação dos recebimentos não concluída; nenhum dado pessoal exibido.",
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
