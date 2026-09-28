function limpar(valor) {
  return String(valor ?? "").trim().replace(/\s+/g, " ");
}

function chave(valor) {
  return limpar(valor).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

const TURNOS = new Map([
  ["manha", "Manhã"], ["matutino", "Manhã"], ["matutina", "Manhã"],
  ["tarde", "Tarde"], ["vespertino", "Tarde"], ["vespertina", "Tarde"],
  ["noite", "Noite"], ["noturno", "Noite"], ["noturna", "Noite"],
  ["integral", "Integral"], ["tempo integral", "Integral"],
]);
const ORDEM = ["Manhã", "Tarde", "Noite", "Integral"];

// Recebe apenas contagens agrupadas: nenhum dado pessoal é necessário no gráfico.
export function consolidarAlunosPorCurso(grupos) {
  const cursos = new Map();
  let totalAlunos = 0;

  for (const grupo of grupos) {
    const nome = limpar(grupo.curso) || "Curso não informado";
    const id = chave(nome);
    const periodo = limpar(grupo.periodo);
    const turno = TURNOS.get(chave(periodo)) || periodo || "Não informado";
    const quantidade = grupo._count._all;

    if (!cursos.has(id)) cursos.set(id, { curso: nome, total: 0, turnos: new Map() });
    const curso = cursos.get(id);
    curso.total += quantidade;
    totalAlunos += quantidade;
    const turnoId = chave(turno);
    const anterior = curso.turnos.get(turnoId);
    curso.turnos.set(turnoId, { turno: anterior?.turno || turno, total: (anterior?.total || 0) + quantidade });
  }

  const ranking = Array.from(cursos.values()).map((curso) => ({
    curso: curso.curso,
    total: curso.total,
    turnos: Array.from(curso.turnos.values()).sort((a, b) => {
      const ordemA = ORDEM.includes(a.turno) ? ORDEM.indexOf(a.turno) : ORDEM.length;
      const ordemB = ORDEM.includes(b.turno) ? ORDEM.indexOf(b.turno) : ORDEM.length;
      return ordemA - ordemB || a.turno.localeCompare(b.turno, "pt-BR");
    }),
  })).sort((a, b) => b.total - a.total || a.curso.localeCompare(b.curso, "pt-BR"));

  return { totalAlunos, totalCursos: ranking.length, cursos: ranking.slice(0, 5) };
}
