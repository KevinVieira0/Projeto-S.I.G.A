import Image from "next/image";
import { Check } from "lucide-react";
import { THEME } from "@/constants/theme";

export default function LoginVisualPanel({
  activeTab,
}) {
  const theme = THEME[activeTab];

  return (
    <aside className="relative min-h-[270px] overflow-hidden bg-blue-950 lg:min-h-[620px]">
      {/* Imagem do perfil ativo */}
      <Image
        src={theme.image}
        alt={theme.imageAlt}
        fill
        priority
        sizes="(min-width: 1024px) 45vw, 100vw"
        className="object-cover object-center"
      />

      {/* Escurecimento da imagem */}
      <div className="absolute inset-0 bg-blue-950/45" />

      {/* Gradiente para permitir leitura dos textos */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/95 via-blue-900/75 to-blue-700/25" />

      {/* Detalhe laranja da empresa */}
      {activeTab === "empresa" && (
        <div className="absolute -bottom-20 -right-20 h-44 w-44 rotate-45 bg-orange-500/85" />
      )}

      <div className="relative z-10 flex h-full min-h-[270px] flex-col justify-between p-7 text-white sm:p-9 lg:min-h-[620px] lg:p-12">
        <div>
          {/* Logo */}
          <div className="inline-flex rounded-xl bg-white/95 px-4 py-2 shadow-lg">
            <Image
              src="/images/Logo-SENAI.png"
              alt="SENAI"
              width={180}
              height={58}
              priority
              className="h-auto w-32 sm:w-36"
            />
          </div>

          <div className="mt-7">
            <p className="text-3xl font-bold tracking-wide sm:text-4xl">
              S.I.G.A.
            </p>

            <p className="mt-1 text-sm text-blue-100">
              Sistema de Indicação e Gerenciamento do
              Aprendiz
            </p>
          </div>
        </div>

        <div className="mt-10 max-w-sm">
          <p
            className={`
              text-xs font-semibold uppercase tracking-[0.22em]
              ${
                activeTab === "empresa"
                  ? "text-orange-300"
                  : "text-blue-200"
              }
            `}
          >
            {theme.eyebrow}
          </p>

          <h2 className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl">
            {theme.title}
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-blue-100">
            {theme.description}
          </p>

          <ul className="mt-6 hidden space-y-3 sm:block">
            {theme.items.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 text-sm text-white/90"
              >
                <span
                  className={`
                    flex h-6 w-6 shrink-0 items-center justify-center
                    rounded-full
                    ${
                      activeTab === "empresa"
                        ? "bg-orange-500/90"
                        : "bg-blue-500/90"
                    }
                  `}
                >
                  <Check className="h-3.5 w-3.5" />
                </span>

                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
