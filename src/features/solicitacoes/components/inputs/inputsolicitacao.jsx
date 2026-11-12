import Tooltip from "@/features/solicitacoes/components/inputs/tutorialDeUso";

export default function Inputsolicitacao({
  label: rotulo,
  name: nomeCampo,
  value: valor,
  onChange,
  placeholder,
  largo = false,
  tipo = "input",
  tooltip,
  erro,
  minAge,
  maxAge,
}) {
  return (
    <div className={`flex flex-col ${largo ? "col-span-full" : ""}`}>
      <div className="mb-1.5 flex items-center">
        <label
          htmlFor={nomeCampo}
          className="text-[13px] font-semibold text-[#1e3a5f]"
        >
          {rotulo}
        </label>

        {tooltip && <Tooltip text={tooltip} />}
      </div>

      {tipo === "textarea" ? (
        <textarea
          className="ui-field min-h-[110px] resize-y [font-family:inherit]"
          id={nomeCampo}
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? nomeCampo + "-erro" : undefined}
          name={nomeCampo}
          value={valor}
          onChange={onChange}
          placeholder={placeholder}
          rows={4}
        />
      ) : (
        <input
          className="ui-field"
          type={tipo}
          id={nomeCampo}
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? nomeCampo + "-erro" : undefined}
          name={nomeCampo}
          value={valor}
          onChange={onChange}
          placeholder={placeholder}
          min={minAge}
          max={maxAge}
        />
      )}
    </div>
  );
}
