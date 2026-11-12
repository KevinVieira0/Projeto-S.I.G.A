import Tooltip from "@/features/solicitacoes/components/inputs/tutorialDeUso";

export default function Selectsolicitacao({
  label: rotulo,
  name: nomeCampo,
  value: valor,
  onChange,
  options: opcoes,
  largo = false,
  tooltip,
  erro,
}) {
  return (
    <div className={`flex flex-col ${largo ? "col-span-full" : ""}`}>
      <div className="mb-1.0 flex items-center">
        <label
          htmlFor={nomeCampo}
          className="text-[13px] font-semibold text-[#1e3a5f]"
        >
          {rotulo}
        </label>

        {tooltip && <Tooltip text={tooltip} />}
      </div>

      <select
        id={nomeCampo}
        aria-invalid={Boolean(erro)}
        aria-describedby={erro ? nomeCampo + "-erro" : undefined}
        name={nomeCampo}
        value={valor}
        onChange={onChange}
        className="ui-field"
      >
        <option
          value=""
          className="text-[#333] checked:bg-[#fed7aa] checked:text-[#1e3a5f] hover:bg-[#fff4ea]"
        >
          Selecione
        </option>

        {opcoes.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            className="text-[#333] checked:bg-[#fed7aa] checked:text-[#1e3a5f] hover:bg-[#fff4ea]"
          >
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
