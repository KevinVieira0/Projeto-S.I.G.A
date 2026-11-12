import { AlertCircle } from "lucide-react";
export default function ErrorState({ mensagem, tentar }) {
  return (
    <div role="alert" className="ui-feedback ui-feedback-error">
      <AlertCircle className="h-5 w-5" aria-hidden="true" />
      <p>{mensagem}</p>
      {tentar && (
        <button
          type="button"
          className="ui-action ui-action-secondary"
          onClick={tentar}
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
