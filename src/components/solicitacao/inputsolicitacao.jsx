export default function Inputsolicitacao({ label, name, value, onChange, placeholder, largo = false, tipo = "input" }) {
  return (
    <div className={`flex flex-col ${largo ? "col-span-full" : ""}`}>
      <p className="mb-1.5 text-[13px] font-semibold text-[#1e3a5f]">{label}</p>
      {tipo === "textarea" ? (
        <textarea
          className="min-h-[90px] resize-y rounded-lg border border-solid border-[#e2e8f0] bg-white px-3 py-2.5 text-[14px] text-[#333] [font-family:inherit] transition-[border-color,box-shadow] duration-150 ease-[ease] focus:border-[#f97316] focus:[outline:none] focus:shadow-[0_0_0_3px_rgba(249,115,22,0.15)]"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={4}
        />
      ) : (
        <input
          className="rounded-lg border border-solid border-[#e2e8f0] bg-white px-3 py-2.5 text-[14px] text-[#333] transition-[border-color,box-shadow] duration-150 ease-[ease] focus:border-[#f97316] focus:[outline:none] focus:shadow-[0_0_0_3px_rgba(249,115,22,0.15)]"
          type={tipo}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}