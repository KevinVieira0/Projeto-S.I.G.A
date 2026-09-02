export default function Selectsolicitacao({ label, name, value, onChange, options, largo = false }) {
  return (
    <div className={`flex flex-col ${largo ? "col-span-full" : ""}`}>
      <p className="mb-1.0 text-[13px] font-semibold text-[#333]">{label}</p>
      <select name={name} value={value} onChange={onChange} className="rounded-lg border border-solid border-[#d5d8dd] bg-white px-3 py-2.5 text-[14px] text-[#333] transition-[border-color] duration-150 ease-[ease] focus:border-[#0a3d7c] focus:[outline:none]">
        <option value="" className="checked:bg-[#cfe3fb] checked:text-[#0a3d7c] hover:bg-[#e6f0ff]">Selecione</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="checked:bg-[#cfe3fb] checked:text-[#0a3d7c] hover:bg-[#e6f0ff]">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
