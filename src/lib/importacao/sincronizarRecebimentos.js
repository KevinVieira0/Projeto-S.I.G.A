import { lerRecebimentosDaPlanilha } from "./googleSheetsAcademico";
import { importarRecebimentos } from "./recebimentos";
import { automatizarCadastros } from "./automatizarCadastros";
import { tentarEspelharBase } from "./espelharBase";
import { sincronizarCatalogo } from "./sincronizarCatalogo";

export async function sincronizarRecebimentos(prisma) {
  const abas = await lerRecebimentosDaPlanilha();
  const fonte = process.env.GOOGLE_SHEETS_ACADEMICO_ID;
  const catalogo = await sincronizarCatalogo(prisma, abas);
  const recebimentos = await importarRecebimentos(prisma, fonte, abas);
  const empresas = await automatizarCadastros(prisma, fonte, "EMPRESA");
  const alunos = await automatizarCadastros(prisma, fonte, "ALUNO");
  const espelho = await tentarEspelharBase(prisma);
  return { ...recebimentos, catalogo, alunos, empresas, espelho };
}
