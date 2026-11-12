import { FileText, Download } from "lucide-react";

export default function ComprovantesContrato({
  documentos = [],
  mostrarEmpresa = false,
  variante = "azul",
  perfil = "admin",
}) {
  if (!documentos.length)
    return (
      <p className="text-sm text-slate-500">Nenhum comprovante anexado.</p>
    );
  return (
    <div className="space-y-3">
      <p className="text-xs leading-5 text-slate-500">
        Envios mais recentes primeiro. As versões anteriores permanecem
        disponíveis para consulta.
      </p>
      <ul className="space-y-2">
        {documentos.map((d) => (
          <li
            key={d.id}
            className="rounded-xl border border-slate-200 bg-white/80 p-3"
          >
            <a
              href={`/api/contratos/${d.id}?perfil=${perfil}`}
              className={`flex min-w-0 items-start gap-3 rounded text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 ${variante === "laranja" ? "text-orange-800 focus-visible:ring-orange-400" : "text-[#0a3d7c] focus-visible:ring-blue-400"}`}
            >
              <FileText className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 break-all">
                {d.nome}
                <span className="sr-only"> — baixar comprovante</span>
              </span>
              <Download className="h-4 w-4 shrink-0" />
            </a>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
                timeZone: "America/Sao_Paulo",
              }).format(new Date(d.criadoEm))}{" "}
              · {Math.max(1, Math.ceil(d.tamanho / 1024))} KB
              {mostrarEmpresa &&
                ` · ${d.empresa.nomeFantasia || d.empresa.razaoSocial}`}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
