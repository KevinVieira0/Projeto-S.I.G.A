import { calcularIdade } from "@/lib/alunos/dadosPessoais";
import { dataCivil } from "@/lib/dashboard/solicitacoesResumo";
import {
  parseCivilDate,
  todayInSaoPaulo,
} from "@/lib/validations/solicitacaoSchema";

const normalizar = (valor) =>
  String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

export function idadeAluno(aluno, hoje = todayInSaoPaulo()) {
  if (aluno.dataNascimento) {
    const nascimento = dataCivil(aluno.dataNascimento);
    if (!nascimento || !parseCivilDate(nascimento) || nascimento > hoje)
      return null;
    return calcularIdade(nascimento, hoje);
  }
  return Number.isInteger(aluno.idade) && aluno.idade >= 0 ? aluno.idade : null;
}

export function matriculaCompativel(
  solicitacao,
  matricula,
  hoje = todayInSaoPaulo(),
) {
  const curso = normalizar(matricula.turma?.curso?.nome);
  if (!curso || curso !== normalizar(solicitacao.cursos)) return false;
  const idade = idadeAluno(matricula.aluno, hoje);
  if (
    idade == null ||
    idade < solicitacao.idadeMinima ||
    idade > solicitacao.idadeMaxima
  )
    return false;
  const sexo = normalizar(solicitacao.sexo);
  if (sexo === "todos") return true;
  return (
    ["masculino", "feminino"].includes(sexo) &&
    normalizar(matricula.aluno.genero) === sexo
  );
}
