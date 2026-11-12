export function correspondeAoCadastro(matricula, aluno = matricula.aluno) {
  return Boolean(
    aluno && !aluno.arquivadoEm &&
    matricula.turma.codigo === aluno.turma &&
    matricula.turma.curso.nome === aluno.curso &&
    matricula.turma.turno === aluno.periodo
  );
}
