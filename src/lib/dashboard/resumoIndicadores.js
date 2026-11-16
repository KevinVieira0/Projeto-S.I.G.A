import { formatarDataCriacao } from "./solicitacoesResumo";

export function resumirIndicadores(visao, dados) {
  if (visao === "alunos") {
    return [
      {
        id: "comprovante",
        titulo: "Aprovados aguardando comprovante",
        valor: dados.aguardandoComprovante,
        descricao: "Aprovações em solicitações ativas",
      },
      {
        id: "disponiveis",
        titulo: "Disponíveis há mais de 30 dias",
        valor: dados.disponiveisHaMaisDe30Dias,
        descricao: "Alunos que seguem disponíveis",
      },
      {
        id: "contratacoes",
        titulo: "Alunos com contratação registrada",
        valor: dados.contratadosEm30Dias,
        detalhe: "Últimos 30 dias",
      },
    ];
  }
  return [
    {
      id: "prazo",
      titulo: "Solicitações que vencem em até 24 h",
      valor: dados.vencemEm24Horas,
      detalhe: "Aguardando retorno ou contratação",
    },
    {
      id: "indicacao",
      titulo: "Pedidos sem primeira indicação",
      valor: dados.semPrimeiraIndicacao,
      detalhe: dados.pedidoMaisAntigo
        ? `Mais antigo de ${formatarDataCriacao(dados.pedidoMaisAntigo)}`
        : "",
      descricao: "Solicitações ativas pendentes de envio",
    },
    {
      id: "encerradas",
      titulo: "Encerradas por falta de retorno",
      valor: dados.encerradasSemRetorno,
      detalhe: "Últimos 30 dias",
    },
  ];
}
