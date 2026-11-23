import { ChartNoAxesCombined } from "lucide-react";
import { useId, useState } from "react";
import { seriesDaVisao } from "@/lib/dashboard/series";
import { useRecorte } from "./RecortesDaVisao";
import DashboardCard, {
  DashboardCardFooter,
  DashboardCardHeader,
} from "./DashboardCard";

const formatarNumero = (valor) => valor.toLocaleString("pt-BR");
const niveis = [4, 3, 2, 1, 0];
const largura = 1000;
const altura = 150;

export default function GraficoDeMovimentacao({ visao, dados, erro }) {
  const idTitulo = useId();
  const { titulo, descricao, unidade, periodos, series } = seriesDaVisao[visao];
  const [periodo, setPeriodo] = useRecorte("serie", periodos[0]);
  const [chaveDestacada, setChaveDestacada] = useState(null);
  const linhas = dados?.slice(-periodo) ?? [];
  const detalhe =
    linhas.find(({ chave }) => chave === chaveDestacada) ?? linhas.at(-1);
  const maximo = Math.max(
    0,
    ...linhas.flatMap((linha) => series.map(({ chave }) => linha[chave])),
  );
  const passo = Math.max(1, Math.ceil(maximo / 4));
  const posicaoY = (valor) => 6 + (1 - valor / (4 * passo)) * (altura - 12);
  const posicaoPercentual = (valor) => `${(posicaoY(valor) / altura) * 100}%`;

  return (
    <DashboardCard aria-labelledby={idTitulo} lift>
      <DashboardCardHeader
        title={titulo}
        headingId={idTitulo}
        description={descricao}
        icon={ChartNoAxesCombined}
      >
        <label className="text-xs font-medium text-gray-600">
          <span className="sr-only">Período de {titulo.toLowerCase()}</span>
          <select
            className="siga-acao siga-controle rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-blue-600"
            value={periodo}
            onChange={(evento) => {
              setPeriodo(Number(evento.target.value));
              setChaveDestacada(null);
            }}
          >
            {periodos.map((valor) => (
              <option key={valor} value={valor}>
                {valor} {unidade.toLowerCase()}
              </option>
            ))}
          </select>
        </label>
      </DashboardCardHeader>
      {maximo > 0 ? (
        <>
          <div className="siga-entrada grid min-w-0 flex-1 content-center px-4 py-4 sm:px-5">
            <ul
              className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600"
              aria-label="Legenda"
            >
              {series.map(({ chave, rotulo, cor }, indice) => (
                <li key={chave} className="flex items-center gap-1.5">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 ${indice === 0 ? "rounded-full" : "rotate-45 rounded-[1px]"}`}
                    style={{ backgroundColor: cor }}
                    aria-hidden="true"
                  />
                  {rotulo}
                </li>
              ))}
            </ul>
            <div className="relative pl-9">
              <div
                className="pointer-events-none absolute left-0 top-0 h-[var(--siga-altura-linhas,150px)] w-8"
                aria-hidden="true"
              >
                {niveis.map((nivel) => (
                  <span
                    key={nivel}
                    className="absolute right-0 -translate-y-1/2 text-right text-[11px] tabular-nums text-gray-500"
                    style={{ top: posicaoPercentual(passo * nivel) }}
                  >
                    {formatarNumero(passo * nivel)}
                  </span>
                ))}
              </div>
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-9 h-[var(--siga-altura-linhas,150px)] w-[calc(100%-2.25rem)]"
                viewBox={`0 0 ${largura} ${altura}`}
                preserveAspectRatio="none"
              >
                {niveis.map((nivel) => (
                  <line
                    key={nivel}
                    x1="0"
                    x2={largura}
                    y1={posicaoY(nivel * passo)}
                    y2={posicaoY(nivel * passo)}
                    stroke="#e2e8f0"
                  />
                ))}
                {series.map(({ chave, cor }, indice) => (
                  <polyline
                    key={chave}
                    points={linhas
                      .map(
                        (linha, i) =>
                          `${((i + 0.5) / linhas.length) * largura},${posicaoY(linha[chave])}`,
                      )
                      .join(" ")}
                    fill="none"
                    stroke={cor}
                    strokeWidth="2.3"
                    strokeDasharray={indice === 0 ? undefined : "5 3"}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </svg>
              <div
                role="group"
                aria-label={titulo}
                className="relative grid"
                style={{
                  gridTemplateColumns: `repeat(${linhas.length}, minmax(0, 1fr))`,
                }}
              >
                {linhas.map((linha, indice) => (
                  <button
                    key={linha.chave}
                    type="button"
                    aria-label={`${linha.rotuloCompleto}. ${series.map(({ chave, rotulo }) => `${formatarNumero(linha[chave])} ${rotulo.toLowerCase()}`).join(". ")}`}
                    aria-pressed={detalhe.chave === linha.chave}
                    onPointerEnter={(evento) => {
                      if (evento.pointerType === "mouse")
                        setChaveDestacada(linha.chave);
                    }}
                    onFocus={() => setChaveDestacada(linha.chave)}
                    onClick={() => setChaveDestacada(linha.chave)}
                    className="min-w-0 rounded-md transition-colors hover:bg-blue-50/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 motion-reduce:transition-none"
                  >
                    <span
                      className="relative block h-[var(--siga-altura-linhas,150px)]"
                      aria-hidden="true"
                    >
                      {detalhe.chave === linha.chave && (
                        <span className="absolute inset-y-1 left-1/2 border-l border-dashed border-blue-200" />
                      )}
                      {series.map(({ chave, cor }, serie) => (
                        <span
                          key={chave}
                          className={`absolute left-1/2 block h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 border-2 border-white ${serie === 0 ? "rounded-full" : "rotate-45 rounded-[2px]"} ${detalhe.chave === linha.chave ? "ring-1 ring-slate-300" : ""}`}
                          style={{
                            top: posicaoPercentual(linha[chave]),
                            backgroundColor: cor,
                          }}
                        />
                      ))}
                    </span>
                    <span
                      className={`mt-1 flex justify-center whitespace-nowrap pb-1 text-[11px] text-gray-600 ${linhas.length > 6 && indice !== linhas.length - 1 && (indice % 2 === 1 || indice === linhas.length - 2) ? "invisible sm:visible" : ""}`}
                      aria-hidden="true"
                    >
                      {visao === "empresas" ? (
                        <>
                          <span className="sm:hidden">
                            {linha.rotulo.split("/")[0]}
                          </span>
                          <span className="hidden sm:inline">
                            {linha.rotulo}
                          </span>
                        </>
                      ) : (
                        linha.rotulo
                      )}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-1 text-center text-[11px] text-gray-500">
                {unidade}
              </p>
            </div>
          </div>
          <DashboardCardFooter className="justify-between gap-x-4 gap-y-1">
            <span className="font-semibold text-gray-800">
              {detalhe.rotuloCompleto}
            </span>
            <dl className="flex flex-wrap gap-x-4 gap-y-1">
              {series.map(({ chave, rotulo, cor }) => (
                <div
                  key={chave}
                  className="flex flex-row-reverse items-baseline gap-1"
                >
                  <dt>{rotulo}</dt>
                  <dd
                    className="font-semibold tabular-nums"
                    style={{ color: cor }}
                  >
                    {formatarNumero(detalhe[chave])}
                  </dd>
                </div>
              ))}
            </dl>
          </DashboardCardFooter>
        </>
      ) : (
        <p
          className="grid min-h-36 flex-1 place-items-center px-4 text-center text-sm text-gray-500"
          role="status"
        >
          {dados
            ? "Nenhuma movimentação registrada neste período."
            : erro
              ? "Gráfico indisponível."
              : "Carregando movimentações…"}
        </p>
      )}
    </DashboardCard>
  );
}
