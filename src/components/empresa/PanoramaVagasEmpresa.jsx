import { BarChart3 } from "lucide-react";
import { CartaoLateralEmpresa, FalhaEmpresa } from "./acompanhamento/base";

export default function PanoramaVagasEmpresa({ consulta, acompanhar }) {
  const { dados, erro, recarregar } = consulta;
  const pedidosEmAberto = [];
  const total = { solicitadas: 0, preenchidas: 0 };
  for (const pedido of dados?.solicitacoes ?? []) {
    if (!pedido.ativa) continue;
    total.solicitadas += pedido.quantidadeVagas;
    const preenchidas = Math.min(
      pedido.quantidadeVagas,
      pedido.resumo.contratados,
    );
    total.preenchidas += preenchidas;
    if (preenchidas < pedido.quantidadeVagas && pedidosEmAberto.length < 2) {
      pedidosEmAberto.push({ ...pedido, preenchidas });
    }
  }
  const emAberto = total.solicitadas - total.preenchidas;

  return (
    <CartaoLateralEmpresa
      id="panorama-vagas-empresa"
      titulo="Panorama de vagas"
      icone={BarChart3}
    >
      {erro ? (
        <div className="mt-4">
          <FalhaEmpresa mensagem={erro} tentar={recarregar} />
        </div>
      ) : !dados ? (
        <p role="status" className="mt-4 text-sm text-slate-600">
          Carregando vagas…
        </p>
      ) : total.solicitadas === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-orange-200 bg-white/65 px-4 py-5 text-sm text-slate-600">
          Nenhuma vaga em solicitações ativas.
        </p>
      ) : (
        <div className="siga-entrada">
          <p className="mb-2.5 text-sm tabular-nums text-slate-700">
            {total.preenchidas.toLocaleString("pt-BR")}{" "}
            {total.preenchidas === 1 ? "preenchida" : "preenchidas"}{" "}
            <span aria-hidden="true">·</span> {emAberto.toLocaleString("pt-BR")}{" "}
            em aberto
          </p>
          <div
            role="meter"
            aria-label="Vagas preenchidas"
            aria-valuemin={0}
            aria-valuemax={total.solicitadas}
            aria-valuenow={total.preenchidas}
            aria-valuetext={`${total.preenchidas} de ${total.solicitadas} vagas preenchidas`}
            className="h-3 overflow-hidden rounded-full bg-orange-200/80"
          >
            <div
              className="h-full rounded-full bg-emerald-600 motion-safe:transition-[width] motion-safe:duration-300"
              style={{
                width: `${(total.preenchidas / total.solicitadas) * 100}%`,
              }}
            />
          </div>
          {pedidosEmAberto.length > 0 && (
            <ul className="mt-2.5 divide-y divide-orange-200/60">
              {pedidosEmAberto.map(
                ({ id, cursos, quantidadeVagas, preenchidas }) => (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => acompanhar(id)}
                      aria-label={`Acompanhar solicitação de ${cursos}, ${preenchidas} de ${quantidadeVagas} vagas preenchidas`}
                      className="siga-acao flex min-h-8 w-full items-center justify-between gap-2 rounded-md py-1.5 text-left text-sm text-slate-800 hover:text-orange-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600"
                    >
                      <span className="min-w-0 break-words font-medium">
                        {cursos}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {preenchidas} de {quantidadeVagas}
                      </span>
                    </button>
                  </li>
                ),
              )}
            </ul>
          )}
        </div>
      )}
    </CartaoLateralEmpresa>
  );
}
