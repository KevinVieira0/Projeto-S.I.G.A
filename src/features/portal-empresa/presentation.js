export const rotulosParticipacao = {
  INDICADO: "Indicado",
  EM_PROCESSO: "Em processo",
  APROVADO: "Aprovado · aguardando formalização",
  CONTRATADO: "Contratado",
  NAO_CONTRATADO: "Não contratado",
  DESISTIU: "Desistiu",
  CANCELADO: "Encerrado pela coordenação",
};
export const cores = {
  INDICADO: "bg-sky-50 text-sky-800 ring-sky-600/15",
  EM_PROCESSO: "bg-amber-50 text-amber-800 ring-amber-600/15",
  APROVADO: "bg-violet-50 text-violet-800 ring-violet-600/15",
  CONTRATADO: "bg-emerald-50 text-emerald-800 ring-emerald-600/15",
};
export function dataEmpresa(valor, hora = false) {
  return valor
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        ...(hora ? { timeStyle: "short" } : {}),
        timeZone: hora ? "America/Sao_Paulo" : "UTC",
      }).format(new Date(valor))
    : "Não informado";
}
