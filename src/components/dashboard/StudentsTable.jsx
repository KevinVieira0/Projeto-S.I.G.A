"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  Filter,
  ListFilter,
  RefreshCw,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { listarAlunos } from "@/lib/api/alunosService";

const PAGE_SIZES = [5, 10, 25, 50];

const COLUMN_DEFINITIONS = [
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

const DEFAULT_VISIBILITY = Object.fromEntries(
  COLUMN_DEFINITIONS.map((column) => [column.key, true])
);

const EXPORT_COLUMNS = [
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

export default function StudentsTable() {
  const [alunos, setAlunos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [statusSelecionados, setStatusSelecionados] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState(DEFAULT_VISIBILITY);
  const [sort, setSort] = useState({ key: "nome", direction: "asc" });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const carregarAlunos = useCallback(async () => {
    setIsLoading(true);
    setErro("");

    try {
      const data = await listarAlunos();
      setAlunos(Array.isArray(data.alunos) ? data.alunos : []);
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
          error.message ||
          "Não foi possível carregar os alunos."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarAlunos();
  }, [carregarAlunos]);

  useEffect(() => {
    const atualizarAposSincronizacao = () => carregarAlunos();
    window.addEventListener("alunos:sincronizados", atualizarAposSincronizacao);

    return () => {
      window.removeEventListener("alunos:sincronizados", atualizarAposSincronizacao);
    };
  }, [carregarAlunos]);

  const statusDisponiveis = useMemo(() => {
    const counts = new Map();

    alunos.forEach((aluno) => {
      const status = aluno.statusIndicacao || "Sem status";
      counts.set(status, (counts.get(status) || 0) + 1);
    });

    return Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b, "pt-BR"));
  }, [alunos]);

  const alunosFiltrados = useMemo(() => {
    const termoBusca = busca.trim().toLocaleLowerCase("pt-BR");

    return alunos.filter((aluno) => {
      const combinaBusca =
        !termoBusca ||
        [aluno.nome, aluno.email, aluno.curso, aluno.turma, aluno.cpf]
          .filter(Boolean)
          .some((valor) =>
            String(valor).toLocaleLowerCase("pt-BR").includes(termoBusca)
          );

      const combinaStatus =
        statusSelecionados.length === 0 ||
        statusSelecionados.includes(aluno.statusIndicacao || "Sem status");

      return combinaBusca && combinaStatus;
    });
  }, [alunos, busca, statusSelecionados]);

  const alunosOrdenados = useMemo(() => {
    return [...alunosFiltrados].sort((a, b) => {
      const aValue = a[sort.key] ?? "";
      const bValue = b[sort.key] ?? "";

      const result = String(aValue).localeCompare(String(bValue), "pt-BR", {
        numeric: true,
        sensitivity: "base",
      });

      return sort.direction === "asc" ? result : -result;
    });
  }, [alunosFiltrados, sort]);

  const pageCount = Math.max(1, Math.ceil(alunosOrdenados.length / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const firstRow = safePageIndex * pageSize;
  const alunosDaPagina = alunosOrdenados.slice(firstRow, firstRow + pageSize);

  useEffect(() => {
    setPageIndex(0);
  }, [busca, statusSelecionados, pageSize]);

  const visibleColumns = COLUMN_DEFINITIONS.filter(
    (column) => columnVisibility[column.key]
  );

  function toggleSort(key) {
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  function toggleStatus(status) {
    setStatusSelecionados((current) =>
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status]
    );
  }

  function toggleColumn(key) {
    setColumnVisibility((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function exportar(formato) {
    const dados = alunosOrdenados.map(normalizarAlunoParaExportacao);
    const nomeBase = `alunos-siga-${new Date().toISOString().slice(0, 10)}`;

    if (formato === "csv") {
      const csv = criarCsv(dados);
      baixarArquivo(`${nomeBase}.csv`, `\uFEFF${csv}`, "text/csv;charset=utf-8;");
      return;
    }

    if (formato === "xls") {
      const xls = criarExcelXml(dados);
      baixarArquivo(`${nomeBase}.xls`, xls, "application/vnd.ms-excel;charset=utf-8;");
      return;
    }

    const json = JSON.stringify(dados, null, 2);
    baixarArquivo(`${nomeBase}.json`, json, "application/json;charset=utf-8;");
  }

  const rangeStart = alunosOrdenados.length === 0 ? 0 : firstRow + 1;
  const rangeEnd = Math.min(firstRow + pageSize, alunosOrdenados.length);

  return (
    <section className="mt-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Alunos cadastrados</h2>
            <p className="mt-1 text-sm text-gray-500">
              Consulte, filtre, organize e exporte os registros sincronizados.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1 sm:max-w-sm">
            <ListFilter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Filtrar por nome, e-mail, CPF, curso..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-9 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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

          <details className="relative">
            <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
              <Filter className="h-4 w-4 text-gray-500" />
              Status
              {statusSelecionados.length > 0 && (
                <span className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] text-gray-600">
                  {statusSelecionados.length}
                </span>
              )}
            </summary>
            <div className="absolute left-0 z-30 mt-2 min-w-52 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
              <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Filtrar status
              </p>
              {statusDisponiveis.length === 0 ? (
                <p className="px-2 py-2 text-sm text-gray-500">Nenhum status disponível.</p>
              ) : (
                statusDisponiveis.map(([status, count]) => (
                  <label
                    key={status}
                    className="flex cursor-pointer items-center justify-between gap-4 rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={statusSelecionados.includes(status)}
                        onChange={() => toggleStatus(status)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      {status}
                    </span>
                    <span className="text-xs text-gray-400">{count}</span>
                  </label>
                ))
              )}
            </div>
          </details>

          <details className="relative">
            <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
              <Columns3 className="h-4 w-4 text-gray-500" />
              Colunas
            </summary>
            <div className="absolute left-0 z-30 mt-2 min-w-48 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
              <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Exibir colunas
              </p>
              {COLUMN_DEFINITIONS.map((column) => (
                <label
                  key={column.key}
                  className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm ${
                    column.alwaysVisible
                      ? "cursor-not-allowed text-gray-400"
                      : "cursor-pointer text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={columnVisibility[column.key]}
                    disabled={column.alwaysVisible}
                    onChange={() => toggleColumn(column.key)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {column.label}
                </label>
              ))}
            </div>
          </details>
        </div>

        <details className="relative self-start xl:self-auto">
          <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-lg border border-blue-500 bg-blue-500 px-4 text-sm font-semibold text-white transition hover:bg-blue-600">
            <Download className="h-4 w-4" />
            Exportar
          </summary>
          <div className="absolute right-0 z-30 mt-2 min-w-48 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Formato do arquivo
            </p>
            <ExportOption label="CSV (.csv)" onClick={() => exportar("csv")} />
            <ExportOption label="Excel (.xls)" onClick={() => exportar("xls")} />
            <ExportOption label="JSON (.json)" onClick={() => exportar("json")} />
            <p className="mt-2 border-t border-gray-100 px-2 pt-2 text-[11px] leading-4 text-gray-400">
              Exporta todos os registros que correspondem aos filtros atuais.
            </p>
          </div>
        </details>
      </div>

      {erro && (
        <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {visibleColumns.map((column) => (
                  <th
                    key={column.key}
                    className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className="inline-flex items-center gap-1.5 hover:text-gray-900"
                      >
                        {column.label}
                        {sort.key === column.key &&
                          (sort.direction === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          ))}
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={visibleColumns.length}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    Carregando alunos...
                  </td>
                </tr>
              ) : alunosDaPagina.length > 0 ? (
                alunosDaPagina.map((aluno) => (
                  <tr key={aluno.id} className="transition hover:bg-gray-50/80">
                    {visibleColumns.map((column) => (
                      <td
                        key={`${aluno.id}-${column.key}`}
                        className="whitespace-nowrap px-4 py-3 text-gray-600"
                      >
                        <CellContent columnKey={column.key} aluno={aluno} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={visibleColumns.length}
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

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Linhas por página</span>
          <select
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
            className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-500" aria-live="polite">
          <span className="font-medium text-gray-800">{rangeStart}-{rangeEnd}</span> de{" "}
          <span className="font-medium text-gray-800">{alunosOrdenados.length}</span>
        </div>

        <div className="flex items-center gap-1">
          <PaginationButton
            label="Primeira página"
            disabled={safePageIndex === 0}
            onClick={() => setPageIndex(0)}
          >
            <ChevronFirst className="h-4 w-4" />
          </PaginationButton>
          <PaginationButton
            label="Página anterior"
            disabled={safePageIndex === 0}
            onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </PaginationButton>
          <PaginationButton
            label="Próxima página"
            disabled={safePageIndex >= pageCount - 1}
            onClick={() =>
              setPageIndex((current) => Math.min(pageCount - 1, current + 1))
            }
          >
            <ChevronRight className="h-4 w-4" />
          </PaginationButton>
          <PaginationButton
            label="Última página"
            disabled={safePageIndex >= pageCount - 1}
            onClick={() => setPageIndex(pageCount - 1)}
          >
            <ChevronLast className="h-4 w-4" />
          </PaginationButton>
        </div>
      </div>
    </section>
  );
}

function CellContent({ columnKey, aluno }) {
  if (columnKey === "nome") {
    return <span className="font-medium text-gray-900">{aluno.nome}</span>;
  }

  if (columnKey === "statusIndicacao") {
    return <StatusBadge status={aluno.statusIndicacao} />;
  }

  if (columnKey === "termo") {
    return `${aluno.termo}º`;
  }

  return aluno[columnKey] || "—";
}

function StatusBadge({ status }) {
  const classes = {
    Indicado: "bg-green-50 text-green-700 ring-green-600/20",
    "Não indicado": "bg-gray-100 text-gray-700 ring-gray-600/20",
    "Em análise": "bg-amber-50 text-amber-800 ring-amber-600/20",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
        classes[status] || "bg-blue-50 text-blue-700 ring-blue-600/20"
      }`}
    >
      {status || "Sem status"}
    </span>
  );
}

function PaginationButton({ children, label, disabled, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function ExportOption({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
    >
      <Download className="h-4 w-4 text-gray-400" />
      {label}
    </button>
  );
}

function normalizarAlunoParaExportacao(aluno) {
  const formatarData = (valor) => {
    if (!valor) return "";

    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return String(valor);

    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(data);
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
    statusIndicacao: aluno.statusIndicacao || "",
    dataCadastro: formatarData(aluno.dataCadastro),
    ultimaAtualizacao: formatarData(aluno.ultimaAtualizacao),
  };
}

function criarCsv(dados) {
  const separator = ";";
  const cabecalho = EXPORT_COLUMNS.map(([label]) => csvCell(label)).join(separator);
  const linhas = dados.map((item) =>
    EXPORT_COLUMNS.map(([, key]) => csvCell(item[key])).join(separator)
  );

  return [cabecalho, ...linhas].join("\r\n");
}

function csvCell(value) {
  const sanitized = sanitizeSpreadsheetValue(value);
  return `"${String(sanitized).replace(/"/g, '""')}"`;
}

function criarExcelXml(dados) {
  const header = EXPORT_COLUMNS.map(
    ([label]) =>
      `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(label)}</Data></Cell>`
  ).join("");

  const rows = dados
    .map((item) => {
      const cells = EXPORT_COLUMNS.map(([, key]) => {
        const value = sanitizeSpreadsheetValue(item[key]);
        return `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
      }).join("");

      return `<Row>${cells}</Row>`;
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
   <Row>${header}</Row>
   ${rows}
  </Table>
 </Worksheet>
</Workbook>`;
}

function sanitizeSpreadsheetValue(value) {
  const text = String(value ?? "");
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function baixarArquivo(nomeArquivo, conteudo, mimeType) {
  const blob = new Blob([conteudo], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
