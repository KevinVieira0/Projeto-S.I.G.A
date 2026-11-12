import { LoaderCircle } from "lucide-react";
export default function LoadingState({ mensagem = "Carregando…" }) {
  return (
    <div role="status" className="ui-feedback">
      <LoaderCircle
        className="h-5 w-5 animate-spin motion-reduce:animate-none"
        aria-hidden="true"
      />
      <p>{mensagem}</p>
    </div>
  );
}
