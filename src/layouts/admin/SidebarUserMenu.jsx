"use client";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronUp, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import LogoutButton from "@/features/autenticacao/components/LogoutButton";
export default function SidebarUserMenu({ recolhida = false }) {
  const { session } = useAuth();
  const nome = session?.dados?.nome || "Administrador";
  const email = session?.dados?.email || "";
  const iniciais = nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  const [aberto, setAberto] = useState(false);
  const caixaRef = useRef(null),
    botaoRef = useRef(null);
  const id = useId();
  useEffect(() => {
    if (!aberto) return;
    function pressionar(evento) {
      if (evento.key === "Escape") {
        evento.preventDefault();
        evento.stopPropagation();
        setAberto(false);
        botaoRef.current?.focus();
      }
    }
    function clicar(evento) {
      if (!caixaRef.current?.contains(evento.target)) setAberto(false);
    }
    caixaRef.current?.querySelector('[role="dialog"] button')?.focus();
    document.addEventListener("keydown", pressionar);
    document.addEventListener("pointerdown", clicar);
    return () => {
      document.removeEventListener("keydown", pressionar);
      document.removeEventListener("pointerdown", clicar);
    };
  }, [aberto]);
  useEffect(() => setAberto(false), [recolhida]);
  return (
    <div
      ref={caixaRef}
      className="relative mt-auto border-t border-white/10 p-3"
    >
      {aberto && (
        <div
          id={id}
          role="dialog"
          aria-label="Conta do administrador"
          className="absolute bottom-full left-3 z-50 mb-3 w-64 max-w-[calc(100vw-48px)] rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl"
        >
          <p className="break-words text-sm font-semibold">{nome}</p>
          <p className="mt-1 break-all text-xs text-slate-500">{email}</p>
          <p className="mb-4 mt-3 flex items-center gap-2 text-xs text-blue-800">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Administrador
          </p>
          <LogoutButton />
        </div>
      )}
      <button
        ref={botaoRef}
        type="button"
        aria-label={`Menu do usuário ${nome}`}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        aria-controls={aberto ? id : undefined}
        onClick={() => setAberto((v) => !v)}
        className={`admin-user-button ${recolhida ? "justify-center" : "px-2"}`}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-sm font-bold">
          {iniciais}
        </span>
        {!recolhida && (
          <>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-[10px] text-blue-200">
                Coordenação
              </span>
              <span className="block truncate text-sm font-semibold">
                {nome.split(/\s+/)[0]}
              </span>
            </span>
            <ChevronUp
              className={`h-4 w-4 ${aberto ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </>
        )}
      </button>
    </div>
  );
}
