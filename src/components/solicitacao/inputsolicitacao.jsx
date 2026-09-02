export default function Inputsolicitacao({ label, name, value, onChange, placeholder, largo = false, tipo = "input" }) {
  return (
    <div className={`flex flex-col ${largo ? "col-span-full" : ""}`}>
      <p className="mb-1.5 text-[13px] font-semibold text-[#333]">{label}</p>
      {tipo === "textarea" ? (
        <textarea
          className="min-h-[90px] resize-y rounded-lg border border-solid border-[#d5d8dd] bg-white px-3 py-2.5 text-[14px] text-[#333] [font-family:inherit] transition-[border-color] duration-150 ease-[ease] focus:border-[#0a3d7c] focus:[outline:none]"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={4}
        />
      ) : (
        <input
          className="rounded-lg border border-solid border-[#d5d8dd] bg-white px-3 py-2.5 text-[14px] text-[#333] transition-[border-color] duration-150 ease-[ease] focus:border-[#0a3d7c] focus:[outline:none]"
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

