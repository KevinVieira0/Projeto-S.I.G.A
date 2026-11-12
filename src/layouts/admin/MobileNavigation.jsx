"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import SidebarNavigation from "./SidebarNavigation";
import SidebarUserMenu from "./SidebarUserMenu";
export default function MobileNavigation({ aberta, fechar, acionadorRef }) {
  const dialogoRef = useRef(null),
    fecharRef = useRef(null);
  const fecharAtual = useRef(fechar);
  fecharAtual.current = fechar;
  useEffect(() => {
    if (!aberta) return;
    const dialogo = dialogoRef.current;
    const acionador = acionadorRef.current;
    const rolagem = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogo.showModal();
    fecharRef.current?.focus();
    return () => {
      dialogo.close();
      document.body.style.overflow = rolagem;
      acionador?.focus();
    };
  }, [aberta, acionadorRef]);
  return (
    <dialog
      id="navegacao-movel"
      ref={dialogoRef}
      aria-label="Menu de navegação"
      className="admin-mobile-navigation"
      onCancel={(e) => {
        e.preventDefault();
        fecharAtual.current();
      }}
      onClick={(e) => {
        if (
          e.target === dialogoRef.current &&
          e.clientX > dialogoRef.current.getBoundingClientRect().right
        )
          fecharAtual.current();
      }}
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between p-5">
          <div>
            <p className="text-lg font-bold tracking-tight">S.I.G.A.</p>
            <p className="mt-1 text-xs text-blue-200">Gestão de aprendizes</p>
          </div>
          <button
            ref={fecharRef}
            type="button"
            aria-label="Fechar menu de navegação"
            onClick={fechar}
            className="rounded-xl p-2 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <SidebarNavigation aoNavegar={fechar} />
        <SidebarUserMenu />
      </div>
    </dialog>
  );
}
