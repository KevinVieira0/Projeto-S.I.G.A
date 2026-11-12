"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
const CHAVE = "siga:sidebar-collapsed";
export default function useSidebar() {
  const [recolhida, setRecolhida] = useState(false);
  const [aberta, setAberta] = useState(false);
  const acionadorRef = useRef(null);
  const caminho = usePathname();
  useEffect(() => {
    try {
      setRecolhida(localStorage.getItem(CHAVE) === "true");
    } catch {}
  }, []);
  const alternar = useCallback(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setAberta((v) => !v);
      return;
    }
    setRecolhida((anterior) => {
      const proximo = !anterior;
      try {
        localStorage.setItem(CHAVE, String(proximo));
      } catch {}
      return proximo;
    });
  }, []);
  useEffect(() => {
    setAberta(false);
  }, [caminho]);
  useEffect(() => {
    function atalho(evento) {
      if (
        (evento.ctrlKey || evento.metaKey) &&
        evento.key.toLowerCase() === "b" &&
        !evento.target.closest?.(
          'input, textarea, select, [contenteditable="true"]',
        )
      ) {
        evento.preventDefault();
        alternar();
      }
    }
    const desktop = window.matchMedia("(min-width: 1024px)");
    const redimensionar = () => {
      if (desktop.matches) setAberta(false);
    };
    window.addEventListener("keydown", atalho);
    desktop.addEventListener("change", redimensionar);
    return () => {
      window.removeEventListener("keydown", atalho);
      desktop.removeEventListener("change", redimensionar);
    };
  }, [alternar]);
  return {
    recolhida,
    aberta,
    alternar,
    fechar: () => setAberta(false),
    acionadorRef,
  };
}
