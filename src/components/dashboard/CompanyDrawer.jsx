"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Building2, X } from "lucide-react";

export default function CompanyDrawer({
  empresaId,
  titulo,
  nome,
  subtitulo,
  ocupado = false,
  variante = "azul",
  categoria = "Cadastro da empresa",
  rotuloFechar = "Fechar painel da empresa",
  onClose,
  children,
}) {
  const dialogoRef = useRef(null);
  const fechamentoRef = useRef(null);
  const tituloId = useId();
  const [fechando, setFechando] = useState(false);
  useEffect(() => {
    const dialogo = dialogoRef.current;
    const focoAnterior = document.activeElement;
    const rolagemAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogo.showModal();
    return () => {
      window.clearTimeout(fechamentoRef.current);
      dialogo.close();
      document.body.style.overflow = rolagemAnterior;
      const focoRetorno = focoAnterior?.isConnected
        ? focoAnterior
        : [...document.querySelectorAll("button[data-empresa-id]")].find(
            (botao) => botao.dataset.empresaId === empresaId,
          );
      (
        focoRetorno || document.querySelector("[data-foco-acompanhamento]")
      )?.focus();
    };
  }, [empresaId]);
  function fechar(acao = onClose) {
    if (ocupado || fechando) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      acao();
      return;
    }
    setFechando(true);
    fechamentoRef.current = window.setTimeout(acao, 180);
  }
  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby={tituloId}
      onCancel={(evento) => {
        evento.preventDefault();
        fechar();
      }}
      onClick={(evento) => {
        if (evento.target !== evento.currentTarget) return;
        const caixa = evento.currentTarget.getBoundingClientRect();
        if (
          evento.clientX < caixa.left ||
          evento.clientX > caixa.right ||
          evento.clientY < caixa.top ||
          evento.clientY > caixa.bottom
        )
          fechar();
      }}
      data-fechando={fechando || undefined}
      className="company-drawer fixed m-0 overflow-hidden border-0 p-0 text-gray-900"
    >
      <header
        className={`z-10 flex shrink-0 items-center justify-between gap-4 border-b border-gray-200/70 border-t-[3px] ${variante === "laranja" ? "border-t-orange-500" : "border-t-[#0a3d7c]"} bg-white/80 px-5 py-5 backdrop-blur-xl sm:px-7`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-semibold ${variante === "laranja" ? "bg-orange-100 text-orange-800" : "bg-blue-50 text-[#0a3d7c]"}`}
            aria-hidden="true"
          >
            {nome
              ?.split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((parte) => parte[0])
              .join("")
              .toUpperCase() || <Building2 className="h-6 w-6" />}
          </span>
          <div className="min-w-0">
            <p
              className={`text-[11px] font-semibold uppercase tracking-widest ${variante === "laranja" ? "text-orange-700" : "text-[#0a3d7c]"}`}
            >
              {categoria}
            </p>
            <h2
              id={tituloId}
              className="break-words text-lg font-semibold text-gray-900 sm:text-xl"
            >
              {titulo}
            </h2>
            {subtitulo && (
              <p
                className="mt-1 truncate text-xs text-gray-600"
                title={subtitulo}
              >
                {subtitulo}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          aria-label={rotuloFechar}
          onClick={() => fechar()}
          disabled={ocupado || fechando}
          className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40"
        >
          <X className="h-5 w-5" />
        </button>
      </header>
      {children({ fechar, fechando })}
      <style jsx>{`
        .company-drawer {
          inset: 0 0 0 auto;
          width: min(48vw, 680px);
          min-width: 560px;
          max-width: 100vw;
          height: 100vh;
          height: 100dvh;
          max-height: 100dvh;
          flex-direction: column;
          border-left: 1px solid rgba(255, 255, 255, 0.9);
          border-radius: 24px 0 0 24px;
          background: #f8fafc;
          box-shadow: -16px 0 60px rgba(15, 23, 42, 0.16);
        }
        @supports (
          (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))
        ) {
          .company-drawer {
            background: rgba(248, 250, 252, 0.92);
            backdrop-filter: blur(32px) saturate(115%);
            -webkit-backdrop-filter: blur(32px) saturate(115%);
          }
        }
        .company-drawer[open] {
          display: flex;
          animation: details-enter 220ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .company-drawer::backdrop {
          background: rgba(15, 23, 42, 0.22);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          animation: backdrop-enter 220ms ease-out both;
        }
        .company-drawer[data-fechando] {
          pointer-events: none;
          animation: details-exit 180ms ease-in both;
        }
        .company-drawer[data-fechando]::backdrop {
          animation: backdrop-exit 180ms ease-in both;
        }
        @keyframes details-enter {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes details-exit {
          to {
            transform: translateX(100%);
          }
        }
        @keyframes backdrop-enter {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes backdrop-exit {
          to {
            opacity: 0;
          }
        }
        @media (max-width: 767px) {
          .company-drawer {
            width: 100%;
            min-width: 0;
            border-left: 0;
            border-radius: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .company-drawer[open],
          .company-drawer::backdrop,
          .company-drawer[data-fechando],
          .company-drawer[data-fechando]::backdrop {
            animation: none;
          }
        }
      `}</style>
    </dialog>
  );
}
