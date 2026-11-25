"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Filter,
  ListFilter,
  RefreshCw,
  X,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { listarAlunos } from "@/lib/api/alunosService";
import { baixarArquivo } from "@/lib/api/baixarArquivo";
import {
  filtrarAlunosDaTabela,
  ordenarAlunosDaTabela,
} from "@/lib/alunos/filtrosTabela";
import { useAtualizacaoDashboard } from "@/hooks/useAtualizacaoDashboard";
import DashboardCard, {
  DashboardCardHeader,
  DashboardCardFooter,
  dashboardStyles,
} from "./DashboardCard";
import StudentEditor from "../alunos/StudentEditor";
import StudentDetails from "../alunos/StudentDetails";
import MenuExportar from "./MenuExportar";

const TAMANHOS_PAGINA = [5, 10, 25, 50];
const COLUNAS = [
  { key: "nome", label: "Nome", sortable: true, alwaysVisible: true },
  { key: "genero", label: "Gênero", sortable: true },
  { key: "email", label: "E-mail", sortable: true },
  { key: "curso", label: "Curso", sortable: true },
  { key: "turma", label: "Turma", sortable: true },
  { key: "periodo", label: "Período", sortable: true },
  { key: "termo", label: "Termo", sortable: true },
  { key: "empresa", label: "Empresa", sortable: true },
  { key: "statusIndicacao", label: "Status", sortable: true },
];
const VISIBILIDADE_INICIAL = Object.fromEntries(
  COLUNAS.map((coluna) => [coluna.key, true]),
);
const COLUNAS_EXPORTACAO = [
  ["Nome", "nome"],
  ["CPF", "cpf"],
  ["Celular", "celular"],
  ["E-mail", "email"],
  ["Gênero", "genero"],
  ["Idade", "idade"],
  ["Modalidade", "modalidade"],
  ["Curso", "curso"],
  ["Turma", "turma"],
  ["Período", "periodo"],
  ["Termo", "termo"],
  ["Empregado", "empregado"],
  ["Empresa", "empresa"],
  ["Status da indicação", "statusIndicacao"],
  ["Data de cadastro", "dataCadastro"],
  ["Última atualização", "ultimaAtualizacao"],
];

export default function StudentsTable({ gestao = false }) {
  const grupoDeFiltros = useId();
  const [editor, setEditor] = useState(null);
  const [alunoDetalhado, setAlunoDetalhado] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [alunos, setAlunos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [statusSelecionados, setStatusSelecionados] = useState([]);
  const [visibilidadeColunas, setVisibilidadeColunas] =
    useState(VISIBILIDADE_INICIAL);
  const [ordenacao, setOrdenacao] = useState({ key: "nome", direction: "asc" });
  const [indicePagina, setIndicePagina] = useState(0);
  const [tamanhoPagina, setTamanhoPagina] = useState(10);
  const carregarAlunos = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const dados = await listarAlunos();
      setAlunos(Array.isArray(dados.alunos) ? dados.alunos : []);
    } catch (erroCapturado) {
      setErro(
        erroCapturado.response?.data?.mensagem ||
          erroCapturado.message ||
          "Não foi possível carregar os alunos.",
      );
    } finally {
      setCarregando(false);
    }
  }, []);
  useEffect(() => {
    carregarAlunos();
  }, [carregarAlunos]);
  useAtualizacaoDashboard(carregarAlunos);
  const statusDisponiveis = useMemo(() => {
    const contagens = new Map();
    alunos.forEach((aluno) => {
      const status = aluno.statusIndicacao || "Sem status";
      contagens.set(status, (contagens.get(status) || 0) + 1);
    });
    return Array.from(contagens.entries()).sort(([a], [b]) =>
      a.localeCompare(b, "pt-BR"),
    );
  }, [alunos]);
  const alunosFiltrados = useMemo(
    () => filtrarAlunosDaTabela(alunos, busca, statusSelecionados),
    [alunos, busca, statusSelecionados],
  );
  const alunosOrdenados = useMemo(
    () => ordenarAlunosDaTabela(alunosFiltrados, ordenacao),
    [alunosFiltrados, ordenacao],
  );
  const totalPaginas = Math.max(
    1,
    Math.ceil(alunosOrdenados.length / tamanhoPagina),
  );
  const indicePaginaValido = Math.min(indicePagina, totalPaginas - 1);
  const primeiraLinha = indicePaginaValido * tamanhoPagina;
  const alunosDaPagina = alunosOrdenados.slice(
    primeiraLinha,
    primeiraLinha + tamanhoPagina,
  );
  useEffect(() => {
    setIndicePagina(0);
  }, [busca, statusSelecionados, tamanhoPagina]);
  const colunasVisiveis = COLUNAS.filter(
    (coluna) => visibilidadeColunas[coluna.key],
  );
  function alternarOrdenacao(chave) {
    setOrdenacao((atual) => ({
      key: chave,
      direction:
        atual.key === chave && atual.direction === "asc" ? "desc" : "asc",
    }));
  }
  function alternarStatus(status) {
    setStatusSelecionados((atual) =>
      atual.includes(status)
        ? atual.filter((item) => item !== status)
        : [...atual, status],
    );
  }
  function alternarColuna(chave) {
    setVisibilidadeColunas((atual) => ({ ...atual, [chave]: !atual[chave] }));
  }
  function exportar(formato) {
    const dados = alunosOrdenados.map(normalizarAlunoParaExportacao);
    const nomeBase = `alunos-siga-${new Date().toISOString().slice(0, 10)}`;
    if (formato === "csv") {
      const csv = criarCsv(dados);
      baixarArquivo(
        `${nomeBase}.csv`,
        `\uFEFF${csv}`,
        "text/csv;charset=utf-8;",
      );
      return;
    }
    if (formato === "xls") {
      const xls = criarExcelXml(dados);
      baixarArquivo(
        `${nomeBase}.xls`,
        xls,
        "application/vnd.ms-excel;charset=utf-8;",
      );
      return;
    }
    const json = JSON.stringify(dados, null, 2);
    baixarArquivo(`${nomeBase}.json`, json, "application/json;charset=utf-8;");
  }
  const inicioPagina = alunosOrdenados.length === 0 ? 0 : primeiraLinha + 1;
  const fimPagina = Math.min(
    primeiraLinha + tamanhoPagina,
    alunosOrdenados.length,
  );
  return (
    <DashboardCard
      aria-labelledby="alunos-tabela-titulo"
      className="siga-card-fosco"
    >
      <DashboardCardHeader
        headingId="alunos-tabela-titulo"
        eyebrow="Cadastros"
        title="Alunos cadastrados"
        description={
          gestao
            ? "Clique em um aluno para ver os detalhes, vínculos e histórico de acompanhamento."
            : "Consulte, filtre, organize e exporte os registros sincronizados."
        }
      />
      <div className={dashboardStyles.body}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <div className="relative min-w-0 basis-full sm:min-w-[180px] sm:max-w-sm sm:flex-1">
              <ListFilter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                aria-label="Buscar aluno"
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="Filtrar por nome, e-mail, CPF, curso..."
                maxLength={255}
                className={dashboardStyles.searchField}
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca("")}
                  aria-label="Limpar filtro"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <details
              name={grupoDeFiltros}
              className="siga-menu-expansivel sm:relative"
            >
              <summary
                className={`siga-cabecalho-expansivel cursor-pointer ${dashboardStyles.secondaryAction}`}
              >
                <Filter className="h-4 w-4" aria-hidden="true" />
                Status
                {statusSelecionados.length > 0 && (
                  <span className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] text-gray-600">
                    {statusSelecionados.length}
                  </span>
                )}
                <ChevronDown
                  className="siga-seta-expansao"
                  aria-hidden="true"
                />
              </summary>
              <div className="siga-card siga-vidro-elevado absolute inset-x-0 top-full z-30 mt-2 p-2 sm:right-auto sm:min-w-52">
                <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Filtrar status
                </p>
                {statusDisponiveis.length === 0 ? (
                  <p className="px-2 py-2 text-sm text-gray-500">
                    Nenhum status disponível.
                  </p>
                ) : (
                  statusDisponiveis.map(([status, quantidade]) => (
                    <label
                      key={status}
                      className="flex cursor-pointer items-center justify-between gap-4 rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={statusSelecionados.includes(status)}
                          onChange={() => alternarStatus(status)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        {status === "Contratado" ? "Empregado" : status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {quantidade}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </details>

            <details
              name={grupoDeFiltros}
              className="siga-menu-expansivel sm:relative"
            >
              <summary
                className={`siga-cabecalho-expansivel cursor-pointer ${dashboardStyles.secondaryAction}`}
              >
                <Columns3 className="h-4 w-4" aria-hidden="true" />
                Colunas
                <ChevronDown
                  className="siga-seta-expansao"
                  aria-hidden="true"
                />
              </summary>
              <div className="siga-card siga-vidro-elevado absolute inset-x-0 top-full z-30 mt-2 p-2 sm:right-auto sm:min-w-48">
                <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Exibir colunas
                </p>
                {COLUNAS.map((coluna) => (
                  <label
                    key={coluna.key}
                    className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm ${coluna.alwaysVisible ? "cursor-not-allowed text-gray-400" : "cursor-pointer text-gray-700 hover:bg-gray-50"}`}
                  >
                    <input
                      type="checkbox"
                      checked={visibilidadeColunas[coluna.key]}
                      disabled={coluna.alwaysVisible}
                      onChange={() => alternarColuna(coluna.key)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {coluna.label}
                  </label>
                ))}
              </div>
            </details>
          </div>

          {gestao && (
            <button
              type="button"
              className={dashboardStyles.primaryAction}
              onClick={() => {
                setMensagem("");
                setEditor({ modo: "criar" });
              }}
            >
              <Plus className="h-4 w-4" />
              Novo aluno
            </button>
          )}
          <MenuExportar
            visao="alunos"
            filtro={{ busca, status: statusSelecionados, ordenacao }}
            desabilitado={carregando || Boolean(erro)}
            opcoes={[
              { rotulo: "CSV (.csv)", acao: () => exportar("csv") },
              { rotulo: "Excel (.xls)", acao: () => exportar("xls") },
              { rotulo: "JSON (.json)", acao: () => exportar("json") },
            ]}
          />
        </div>

        {mensagem && (
          <p
            role="status"
            className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          >
            {mensagem}
          </p>
        )}

        {erro && (
          <div role="alert" className={`mt-4 ${dashboardStyles.error}`}>
            {erro}
          </div>
        )}

        <div aria-busy={carregando} className="siga-moldura-tabela mt-4">
          <div
            className="siga-rolagem-tabela"
            role="region"
            aria-label="Tabela de alunos"
            tabIndex={0}
          >
            <table className="siga-tabela min-w-full text-sm">
              <thead>
                <tr>
                  {colunasVisiveis.map((coluna) => (
                    <th
                      key={coluna.key}
                      scope="col"
                      aria-sort={
                        ordenacao.key === coluna.key
                          ? ordenacao.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : undefined
                      }
                      className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    >
                      {coluna.sortable ? (
                        <button
                          type="button"
                          onClick={() => alternarOrdenacao(coluna.key)}
                          className="siga-acao inline-flex items-center gap-1.5 rounded-sm hover:text-[#0a3d7c] focus-visible:outline-blue-600"
                        >
                          {coluna.label}
                          {ordenacao.key === coluna.key &&
                            (ordenacao.direction === "asc" ? (
                              <ArrowUp className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5" />
                            ))}
                        </button>
                      ) : (
                        coluna.label
                      )}
                    </th>
                  ))}
                  {gestao && (
                    <th
                      scope="col"
                      className="siga-tabela-acoes px-4 py-3 text-right text-xs font-semibold uppercase"
                    >
                      Ações
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {carregando ? (
                  <tr>
                    <td
                      colSpan={colunasVisiveis.length + (gestao ? 1 : 0)}
                      className="px-4 py-10 text-center text-sm text-gray-500"
                    >
                      Carregando alunos...
                    </td>
                  </tr>
                ) : alunosDaPagina.length > 0 ? (
                  alunosDaPagina.map((aluno) => (
                    <tr
                      key={aluno.id}
                      data-registro=""
                      data-selecionado={alunoDetalhado === aluno.id}
                      className={gestao ? "cursor-pointer" : undefined}
                      onClick={
                        gestao
                          ? (evento) => {
                              if (
                                evento.target.closest(
                                  "button, a, input, select",
                                )
                              )
                                return;
                              evento.currentTarget
                                .querySelector("button[data-detalhes]")
                                ?.focus();
                              setAlunoDetalhado(aluno.id);
                            }
                          : undefined
                      }
                    >
                      {colunasVisiveis.map((coluna) => (
                        <td
                          key={`${aluno.id}-${coluna.key}`}
                          className="whitespace-nowrap px-4 py-3 text-gray-600"
                        >
                          {gestao && coluna.key === "nome" ? (
                            <button
                              type="button"
                              data-detalhes
                              data-aluno-id={aluno.id}
                              aria-haspopup="dialog"
                              aria-label={`Ver detalhes de ${aluno.nome}`}
                              onClick={(evento) => {
                                evento.currentTarget.focus();
                                setAlunoDetalhado(aluno.id);
                              }}
                              className="rounded text-left font-medium text-gray-900 hover:text-[#0a3d7c] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                            >
                              {aluno.nome}
                            </button>
                          ) : (
                            <CellContent columnKey={coluna.key} aluno={aluno} />
                          )}
                        </td>
                      ))}
                      {gestao && (
                        <td className="siga-tabela-acoes whitespace-nowrap px-4 py-3 text-right">
                          <button
                            type="button"
                            aria-label={`Editar ${aluno.nome}`}
                            title="Editar aluno"
                            className="siga-acao rounded-lg p-2 text-blue-700 hover:bg-blue-100 focus-visible:outline-blue-600"
                            onClick={() => {
                              setMensagem("");
                              setEditor({ modo: "editar", alunoId: aluno.id });
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Excluir ${aluno.nome}`}
                            title="Excluir aluno"
                            className="siga-acao rounded-lg p-2 text-red-600 hover:bg-red-50 focus-visible:outline-red-600"
                            onClick={() => {
                              setMensagem("");
                              setEditor({ modo: "excluir", alunoId: aluno.id });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={colunasVisiveis.length + (gestao ? 1 : 0)}
                      className="px-4 py-10 text-center text-sm text-gray-500"
                    >
                      Nenhum aluno encontrado com os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <DashboardCardFooter className="flex-col lg:flex-row lg:justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Linhas por página</span>
          <select
            value={tamanhoPagina}
            onChange={(evento) => setTamanhoPagina(Number(evento.target.value))}
            aria-label="Linhas por página"
            className="siga-controle siga-acao h-9 rounded-lg px-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            {TAMANHOS_PAGINA.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-500" aria-live="polite">
          <span className="font-medium text-gray-800">
            {inicioPagina}-{fimPagina}
          </span>{" "}
          de{" "}
          <span className="font-medium text-gray-800">
            {alunosOrdenados.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <PaginationButton
            label="Primeira página"
            disabled={indicePaginaValido === 0}
            onClick={() => setIndicePagina(0)}
          >
            <ChevronFirst className="h-4 w-4" />
          </PaginationButton>
          <PaginationButton
            label="Página anterior"
            disabled={indicePaginaValido === 0}
            onClick={() => setIndicePagina((atual) => Math.max(0, atual - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </PaginationButton>
          <PaginationButton
            label="Próxima página"
            disabled={indicePaginaValido >= totalPaginas - 1}
            onClick={() =>
              setIndicePagina((atual) => Math.min(totalPaginas - 1, atual + 1))
            }
          >
            <ChevronRight className="h-4 w-4" />
          </PaginationButton>
          <PaginationButton
            label="Última página"
            disabled={indicePaginaValido >= totalPaginas - 1}
            onClick={() => setIndicePagina(totalPaginas - 1)}
          >
            <ChevronLast className="h-4 w-4" />
          </PaginationButton>
        </div>
      </DashboardCardFooter>
      {alunoDetalhado && (
        <StudentDetails
          key={alunoDetalhado}
          alunoId={alunoDetalhado}
          onClose={() => setAlunoDetalhado(null)}
          onEdit={() => {
            setMensagem("");
            setEditor({ modo: "editar", alunoId: alunoDetalhado });
            setAlunoDetalhado(null);
          }}
        />
      )}
      {editor && (
        <StudentEditor
          {...editor}
          onClose={() => setEditor(null)}
          onSaved={(texto) => {
            setEditor(null);
            setMensagem(texto);
          }}
        />
      )}
    </DashboardCard>
  );
}

function CellContent({ columnKey: chaveColuna, aluno }) {
  if (chaveColuna === "nome") {
    return <span className="font-medium text-gray-900">{aluno.nome}</span>;
  }
  if (chaveColuna === "statusIndicacao") {
    return <StatusBadge status={aluno.statusIndicacao} />;
  }
  if (chaveColuna === "termo") {
    return `${aluno.termo}º`;
  }
  return aluno[chaveColuna] || "—";
}

function StatusBadge({ status }) {
  const classes = {
    Indicado: "bg-green-50 text-green-700 ring-green-600/20",
    Disponível: "bg-orange-50 text-orange-700 ring-orange-600/20",
    "Em processo": "bg-blue-50 text-blue-700 ring-blue-600/20",
    Contratado: "bg-violet-50 text-violet-700 ring-violet-600/20",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${classes[status] || "bg-blue-50 text-blue-700 ring-blue-600/20"}`}
    >
      {status === "Contratado" ? "Empregado" : status || "Disponível"}
    </span>
  );
}

function PaginationButton({ children, label: rotulo, disabled, onClick }) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      disabled={disabled}
      onClick={onClick}
      className={dashboardStyles.pageAction}
    >
      {children}
    </button>
  );
}

function normalizarAlunoParaExportacao(aluno) {
  const formatarData = (valor) => {
    if (!valor) return "";
    const dados = new Date(valor);
    if (Number.isNaN(dados.getTime())) return String(valor);
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(dados);
  };
  return {
    nome: aluno.nome || "",
    cpf: aluno.cpf || "",
    celular: aluno.celular || "",
    email: aluno.email || "",
    genero: aluno.genero || "",
    idade: aluno.idade ?? "",
    modalidade: aluno.modalidade || "",
    curso: aluno.curso || "",
    turma: aluno.turma || "",
    periodo: aluno.periodo || "",
    termo: aluno.termo ?? "",
    empregado: aluno.empregado ? "Sim" : "Não",
    empresa: aluno.empresa || "",
    statusIndicacao:
      aluno.statusIndicacao === "Contratado"
        ? "Empregado"
        : aluno.statusIndicacao || "",
    dataCadastro: formatarData(aluno.dataCadastro),
    ultimaAtualizacao: formatarData(aluno.ultimaAtualizacao),
  };
}

function criarCsv(dados) {
  const separador = ";";
  const cabecalho = COLUNAS_EXPORTACAO.map(([rotulo]) =>
    formatarCelulaCsv(rotulo),
  ).join(separador);
  const linhas = dados.map((item) =>
    COLUNAS_EXPORTACAO.map(([, chave]) => formatarCelulaCsv(item[chave])).join(
      separador,
    ),
  );
  return [cabecalho, ...linhas].join("\r\n");
}

function formatarCelulaCsv(valor) {
  const sanitizado = neutralizarFormula(valor);
  return `"${String(sanitizado).replace(/"/g, '""')}"`;
}

function criarExcelXml(dados) {
  const cabecalho = COLUNAS_EXPORTACAO.map(
    ([rotulo]) =>
      `<Cell ss:StyleID="Header"><Data ss:Type="String">${escaparXml(rotulo)}</Data></Cell>`,
  ).join("");
  const linhas = dados
    .map((item) => {
      const celulas = COLUNAS_EXPORTACAO.map(([, chave]) => {
        const valor = neutralizarFormula(item[chave]);
        return `<Cell><Data ss:Type="String">${escaparXml(valor)}</Data></Cell>`;
      }).join("");
      return `<Row>${celulas}</Row>`;
    })
    .join("");
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header"><Font ss:Bold="1"/></Style>
 </Styles>
 <Worksheet ss:Name="Alunos">
  <Table>
   <Row>${cabecalho}</Row>
   ${linhas}
  </Table>
 </Worksheet>
</Workbook>`;
}

function neutralizarFormula(valor) {
  const text = String(valor ?? "");
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function escaparXml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
