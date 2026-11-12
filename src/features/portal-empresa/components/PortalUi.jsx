import Badge from "@/shared/ui/Badge";
import ErrorState from "@/shared/feedback/ErrorState";
import Pagination from "@/shared/ui/Pagination";
import { cores, rotulosParticipacao } from "../presentation";
export const estilosEmpresa = {
  superficie: "ui-card",
  primario: "ui-action",
  secundario: "ui-action ui-action-secondary",
  campo: "ui-field",
};
export function SeloParticipacao({ status }) {
  return (
    <Badge
      className={
        "ring-1 ring-inset " +
        (cores[status] || "bg-slate-100 text-slate-600 ring-slate-500/15")
      }
    >
      {rotulosParticipacao[status] || status}
    </Badge>
  );
}
export function FalhaEmpresa(props) {
  return <ErrorState {...props} />;
}
export function PaginacaoEmpresa(props) {
  return <Pagination {...props} />;
}
