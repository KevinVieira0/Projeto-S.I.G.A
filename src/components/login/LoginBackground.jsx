export default function LoginBackground({
  activeTab,
}) {
  const isEmpresa = activeTab === "empresa";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {/* Cor base */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/70 to-white" />

      {/* Grade técnica */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: `
            linear-gradient(
              rgba(37, 99, 235, 0.055) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(37, 99, 235, 0.055) 1px,
              transparent 1px
            )
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Iluminação azul */}
      <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-blue-300/30 blur-3xl" />

      {/* Iluminação que muda conforme o perfil */}
      <div
        className={`
          absolute -bottom-40 -right-32
          h-[480px] w-[480px]
          rounded-full blur-3xl
          ${
            isEmpresa
              ? "bg-orange-300/30"
              : "bg-blue-300/25"
          }
        `}
      />

      {/* Forma superior */}
      <div className="absolute -left-24 top-20 h-44 w-72 rotate-[-35deg] rounded-[48px] border border-blue-300/30" />

      {/* Forma inferior */}
      <div
        className={`
          absolute -bottom-20 right-28
          h-44 w-72 rotate-[-35deg]
          rounded-[48px] border
          ${
            isEmpresa
              ? "border-orange-300/35"
              : "border-blue-300/30"
          }
        `}
      />

      {/* Luz atrás do card */}
      <div className="absolute left-1/2 top-1/2 h-[70%] w-[65%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 blur-3xl" />
    </div>
  );
}