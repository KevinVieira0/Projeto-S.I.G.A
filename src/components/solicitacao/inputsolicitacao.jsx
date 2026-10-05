import Tooltip from "./tutorialDeUso";

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
}) {
  return (
    <div className={`flex flex-col ${largo ? "col-span-full" : ""}`}>
      <div className="mb-1.5 flex items-center">
        <label htmlFor={nomeCampo} className="text-[13px] font-semibold text-[#1e3a5f]">
          {rotulo}
        </label>

        {tooltip && <Tooltip text={tooltip} />}
      </div>

      {tipo === "textarea" ? (
        <textarea
          className="min-h-[90px] resize-y rounded-lg border border-solid border-[#e2e8f0] bg-white px-3 py-2.5 text-[14px] text-[#333] [font-family:inherit] transition-[border-color,box-shadow] duration-150 ease-[ease] focus:border-[#f97316] focus:[outline:none] focus:shadow-[0_0_0_3px_rgba(249,115,0,0.15)]"
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
          className="rounded-lg border border-solid border-[#e2e8f0] bg-white px-3 py-2.5 text-[14px] text-[#333] transition-[border-color,box-shadow] duration-150 ease-[ease] focus:border-[#f97316] focus:[outline:none] focus:shadow-[0_0_0_3px_rgba(249,115,0,0.15)]"
          type={tipo}
          id={nomeCampo}
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? nomeCampo + "-erro" : undefined}
          name={nomeCampo}
          value={valor}
          onChange={onChange}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
