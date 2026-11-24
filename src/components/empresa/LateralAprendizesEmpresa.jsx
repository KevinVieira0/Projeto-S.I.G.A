import {
  ChevronRight,
  ClipboardList,
  Clock3,
  FileText,
  UserRound,
} from "lucide-react";
import {
  CartaoLateralEmpresa,
  rotulosParticipacao,
} from "./acompanhamento/base";
import PanoramaVagasEmpresa from "./PanoramaVagasEmpresa";

const acoesPendentes = [
  {
    chave: "indicacoes",
    status: "INDICADO",
    rotulo: "Indicação para avaliar",
    Icone: UserRound,
  },
  {
    chave: "comprovantes",
    status: "APROVADO",
    rotulo: "Comprovante pendente",
    Icone: FileText,
  },
];

const rotulosMovimentacao = {
  INDICADO: "Indicação recebida",
  EM_PROCESSO: "Processo de seleção iniciado",
  APROVADO: "Seleção aprovada",
  CONTRATADO: "Contratação confirmada",
};

const coresMovimentacao = {
  INDICADO: "border-sky-700 bg-sky-200",
  EM_PROCESSO: "border-orange-700 bg-orange-200",
  APROVADO: "border-violet-700 bg-violet-200",
  CONTRATADO: "border-emerald-700 bg-emerald-200",
};

const dataCurta = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "America/Sao_Paulo",
});

function PendenciasEmpresa({ pendencias, erro, abrirPendencia }) {
  return (
    <CartaoLateralEmpresa
      id="titulo-pendencias-empresa"
      titulo="Pendências da empresa"
      icone={ClipboardList}
    >
      <ul className="space-y-1">
        {acoesPendentes.map(({ chave, status, rotulo, Icone }) => {
          const pendencia = pendencias?.[chave];
          const total = pendencia?.total;
          return (
            <li key={chave}>
              <button
                type="button"
                disabled={!total || Boolean(erro)}
                onClick={() => abrirPendencia(status, pendencia)}
                className={`siga-acao grid min-h-10 w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 rounded-lg px-1.5 py-0.5 text-left text-sm text-slate-900 enabled:hover:bg-orange-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600 disabled:text-slate-600 ${status === "INDICADO" && total && !erro ? "bg-orange-100/80" : ""}`}
              >
                <span className="rounded-md border border-orange-100 bg-white/80 p-1.5 text-orange-800">
                  <Icone className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="break-words font-medium">{rotulo}</span>
                <span className="min-w-6 rounded-full bg-orange-200/75 px-1.5 py-0.5 text-center text-xs font-semibold tabular-nums text-orange-950">
                  {erro ? "—" : (total?.toLocaleString("pt-BR") ?? "—")}
                </span>
                <ChevronRight
                  className="h-4 w-4 text-slate-500"
                  aria-hidden="true"
                />
              </button>
            </li>
          );
        })}
      </ul>
    </CartaoLateralEmpresa>
  );
}

function MovimentacoesEmpresa({ eventos, erro, abrirAluno }) {
  return (
    <CartaoLateralEmpresa
      id="titulo-movimentacoes-empresa"
      titulo="Últimas movimentações"
      icone={Clock3}
    >
      {erro || !eventos?.length ? (
        <p className="py-1 text-sm text-slate-600" role="status">
          {erro
            ? "Movimentações indisponíveis."
            : eventos
              ? "As movimentações dos aprendizes aparecerão aqui."
              : "Carregando movimentações…"}
        </p>
      ) : (
        <ol className="relative space-y-1 before:absolute before:inset-y-4 before:left-[0.6875rem] before:w-px before:bg-orange-200">
          {eventos.map((evento) => {
            const {
              id,
              aprendiz,
              registradoEm,
              statusAnterior,
              novoStatus,
              descricao,
            } = evento;
            const rotulo =
              statusAnterior === novoStatus && descricao
                ? descricao
                : (rotulosMovimentacao[novoStatus] ??
                  rotulosParticipacao[novoStatus]);
            return (
              <li key={id} className="relative">
                <button
                  type="button"
                  onClick={() => abrirAluno(aprendiz)}
                  className="siga-acao grid w-full grid-cols-[0.875rem_minmax(0,1fr)_auto] items-start gap-2.5 rounded-lg px-1 py-1.5 text-left hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600"
                >
                  <span
                    className={`mx-auto mt-1.5 h-2.5 w-2.5 rounded-full border-2 ${coresMovimentacao[novoStatus] ?? "border-slate-500 bg-slate-200"}`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 break-words">
                    <span className="block text-sm font-semibold text-slate-950">
                      {aprendiz.nome}
                    </span>
                    <span className="block text-xs leading-4 text-slate-600">
                      {rotulo}
                    </span>
                  </span>
                  <time
                    dateTime={registradoEm}
                    className="mt-0.5 text-xs tabular-nums text-slate-600"
                  >
                    {dataCurta.format(new Date(registradoEm))}
                  </time>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </CartaoLateralEmpresa>
  );
}

export default function LateralAprendizesEmpresa({
  dados,
  erro,
  pedidos,
  abrirPendencia,
  abrirAluno,
  acompanhar,
}) {
  return (
    <aside
      aria-label="Acompanhamento da empresa"
      className="min-w-0 space-y-3.5"
    >
      <PendenciasEmpresa
        pendencias={dados?.pendencias}
        erro={erro}
        abrirPendencia={abrirPendencia}
      />
      <PanoramaVagasEmpresa consulta={pedidos} acompanhar={acompanhar} />
      <MovimentacoesEmpresa
        eventos={dados?.movimentacoes}
        erro={erro}
        abrirAluno={abrirAluno}
      />
    </aside>
  );
}
