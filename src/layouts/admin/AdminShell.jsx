"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/constants/routes";
import StudentSyncNotification from "@/features/recebimentos/components/StudentSyncNotification";
import Sidebar from "./Sidebar";
import MobileNavigation from "./MobileNavigation";
import useSidebar from "./useSidebar";
import { itensNavegacao, itemAtivo } from "./navigation";
export default function AdminShell({ children }) {
  const { session: sessao, isLoading: carregando } = useAuth();
  const router = useRouter(),
    caminho = usePathname();
  const menu = useSidebar();
  useEffect(() => {
    if (!carregando && (!sessao || sessao.tipo !== "admin"))
      router.replace(ROUTES.LOGIN);
  }, [carregando, sessao, router]);
  if (carregando || !sessao || sessao.tipo !== "admin") return null;
  const atual = itensNavegacao.find((item) => itemAtivo(caminho, item.href));
  return (
    <div className="admin-layout">
      <a href="#conteudo-principal" className="ui-skip-link">
        Ir para o conteúdo
      </a>
      <Sidebar recolhida={menu.recolhida} alternar={menu.alternar} />
      <MobileNavigation
        aberta={menu.aberta}
        fechar={menu.fechar}
        acionadorRef={menu.acionadorRef}
      />
      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="flex min-w-0 items-center gap-3">
            <button
              ref={menu.acionadorRef}
              type="button"
              aria-label="Abrir menu de navegação"
              aria-expanded={menu.aberta}
              aria-controls="navegacao-movel"
              onClick={menu.alternar}
              className="ui-action ui-action-secondary admin-mobile-trigger px-3"
            >
              <Menu className="h-5 w-5" />
            </button>
            <p className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold tracking-wide text-blue-900">
                S.I.G.A.
              </span>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{atual?.rotulo || "Coordenação"}</span>
            </p>
          </div>
          <StudentSyncNotification />
        </header>
        <main id="conteudo-principal" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
