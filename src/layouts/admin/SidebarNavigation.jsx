"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { itensNavegacao, itemAtivo } from "./navigation";
export default function SidebarNavigation({ recolhida = false, aoNavegar }) {
  const caminho = usePathname();
  return (
    <nav aria-label="Navegação administrativa" className="space-y-2 px-3">
      {itensNavegacao.map(({ href, rotulo, descricao, icon: Icone }) => (
        <Link
          key={href}
          href={href}
          aria-label={rotulo}
          aria-current={itemAtivo(caminho, href) ? "page" : undefined}
          title={recolhida ? rotulo : undefined}
          onClick={aoNavegar}
          className={`admin-nav-item ${recolhida ? "justify-center px-0" : "px-3"}`}
        >
          <Icone className="h-5 w-5 shrink-0" aria-hidden="true" />
          {!recolhida && (
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{rotulo}</span>
              <span className="mt-0.5 block text-[11px] opacity-65">
                {descricao}
              </span>
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
