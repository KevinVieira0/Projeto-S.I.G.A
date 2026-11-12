import { Inbox } from "lucide-react";
export default function EmptyState({ titulo, descricao, children }) {
  return (
    <div className="ui-feedback">
      <Inbox className="h-7 w-7 text-slate-400" aria-hidden="true" />
      <p className="font-semibold text-slate-800">{titulo}</p>
      {descricao && <p className="max-w-sm text-sm leading-6">{descricao}</p>}
      {children}
    </div>
  );
}
