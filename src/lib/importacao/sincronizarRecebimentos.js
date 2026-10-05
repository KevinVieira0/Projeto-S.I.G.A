import { lerRecebimentosDaPlanilha } from "./googleSheetsAcademico";
import { importarRecebimentos } from "./recebimentos";
import { automatizarAlunos } from "./automatizarAlunos";

// Alunos válidos são processados por CPF. Empresas permanecem na conferência.

export async function sincronizarRecebimentos(prisma) {
  const abas = await lerRecebimentosDaPlanilha();
  const fonte = process.env.GOOGLE_SHEETS_ACADEMICO_ID;
  const recebimentos = await importarRecebimentos(prisma, fonte, abas);
  return { ...recebimentos, alunos: await automatizarAlunos(prisma, fonte) };
}
