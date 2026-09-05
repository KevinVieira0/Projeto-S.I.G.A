export default function Selectsolicitacao({ label, name, value, onChange, options, largo = false }) {
  return (
    <div className={`flex flex-col ${largo ? "col-span-full" : ""}`}>
      <p className="mb-1.0 text-[13px] font-semibold text-[#1e3a5f]">{label}</p>
      <select name={name} value={value} onChange={onChange} className="rounded-lg border border-solid border-[#e2e8f0] bg-white px-3 py-2.5 text-[14px] text-[#333] transition-[border-color,box-shadow] duration-150 ease-[ease] focus:border-[#f97316] focus:[outline:none] focus:shadow-[0_0_0_3px_rgba(249,115,22,0.15)]">
        <option value="" className="text-[#333] checked:bg-[#fed7aa] checked:text-[#1e3a5f] hover:bg-[#fff4ea]">Selecione</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="text-[#333] checked:bg-[#fed7aa] checked:text-[#1e3a5f] hover:bg-[#fff4ea]">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}