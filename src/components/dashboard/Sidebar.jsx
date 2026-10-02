"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2Icon,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  GraduationCap,
  Home,
  Mail,
  ShieldCheck,
} from "lucide-react";
import LogoutButton from "@/components/login/LogoutButton";
import logoSenai from "../../../public/images/Logo-SENAI.png";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { label: "Visão Geral", href: "/admin/dashboard", icon: Home },
  { label: "Solicitações", href: "/admin/solicitacoes", icon: Mail },
  { label: "Alunos", href: "/admin/alunos", icon: GraduationCap },
  { label: "Empresas", href: "/admin/empresas", icon: Building2Icon },
];

const STORAGE_KEY = "siga:sidebar-collapsed";


const AVATAR_GRADIENTS = [
  "from-blue-900 to-blue-600",
  "from-indigo-900 to-indigo-500",
  "from-sky-800 to-cyan-500",
  "from-blue-950 to-sky-600",
  "from-violet-900 to-blue-500",
];

function getInitials(nome) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0][0].toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function getGradient(nome) {
  let hash = 0;
  for (const char of nome) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

function getSaudacao(date = new Date()) {
  const hora = date.getHours();
  if (hora < 5) return "Boa madrugada";
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export default function Sidebar() {
  const pathname = usePathname();
  const { session } = useAuth();
  const nome = session?.dados?.nome || "Administrador";
  const email = session?.dados?.email || "";
  const primeiroNome = nome.trim().split(/\s+/)[0];

  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saudacao, setSaudacao] = useState("Olá");
  const userRef = useRef(null);

  
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        setCollapsed(saved === "true");
        return;
      }
    } catch {}
    setCollapsed(window.innerWidth < 1024);
  }, []);

  useEffect(() => {
    setSaudacao(getSaudacao());
    const id = setInterval(() => setSaudacao(getSaudacao()), 60_000);
    return () => clearInterval(id);
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      return next;
    });
    setMenuOpen(false);
  }, []);

  
  useEffect(() => {
    function onKeyDown(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  
  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event) {
      if (userRef.current && !userRef.current.contains(event.target)) setMenuOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const labelClass = `overflow-hidden whitespace-nowrap transition-all duration-300 ${
    collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
  }`;

  return (
    <aside
      aria-label="Menu lateral"
      className={`sticky top-0 z-30 flex h-screen shrink-0 flex-col border-r border-gray-100 bg-white
        transition-[width] duration-300 ease-in-out ${collapsed ? "w-[76px]" : "w-64"}`}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
        aria-expanded={!collapsed}
        title={`${collapsed ? "Expandir" : "Recolher"} (Ctrl+B)`}
        className="absolute -right-3 top-7 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200
          bg-white text-gray-500 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-900
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-900"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      <div className={`flex h-[72px] items-center pt-2 ${collapsed ? "justify-center" : "px-5"}`}>
        {collapsed ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900 text-sm font-bold text-white">
            S
          </div>
        ) : (
          <Image src={logoSenai} alt="SENAI" className="h-8 w-auto" priority />
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={label}
              href={href}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className={`group relative flex items-center rounded-lg py-2.5 text-sm transition
                ${collapsed ? "justify-center px-0" : "gap-2.5 px-3"}
                ${
                  isActive
                    ? "bg-blue-50 font-semibold text-blue-900"
                    : "font-normal text-gray-700 hover:bg-gray-50"
                }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className={labelClass}>{label}</span>

              {/* Tooltip: aparece só quando o menu está recolhido */}
              {collapsed && (
                <span
                  role="tooltip"
                  className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5
                    text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div ref={userRef} className="relative border-t border-gray-100 p-3">
        {menuOpen && (
          <div
            role="menu"
            className={`absolute z-50 w-60 rounded-xl border border-gray-100 bg-white p-4 shadow-xl
              ${collapsed ? "bottom-3 left-full ml-3" : "bottom-full left-3 mb-2"}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white ${getGradient(nome)}`}
              >
                {getInitials(nome)}
              </div>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-semibold text-gray-900">{nome}</p>
                {email && <p className="truncate text-xs text-gray-500">{email}</p>}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-900">
              <ShieldCheck className="h-3.5 w-3.5" />
              Administrador
            </div>
            <div className="mt-2 flex items-center gap-1.5 px-1 text-xs text-gray-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Sessão ativa
            </div>

            <div className="mt-3 border-t border-gray-100 pt-2">
              <LogoutButton />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label={`Menu do usuário ${nome}`}
          className={`group flex w-full items-center rounded-xl p-2 text-left transition hover:bg-gray-50
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-900
            ${collapsed ? "justify-center" : "gap-3"} ${menuOpen ? "bg-gray-50" : ""}`}
        >
          <div className="relative shrink-0">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white
                shadow-sm transition-transform group-hover:scale-105 ${getGradient(nome)}`}
            >
              {getInitials(nome)}
            </div>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
          </div>

          <div className={`min-w-0 flex-1 leading-tight ${labelClass}`}>
            <p className="text-xs text-gray-500">{saudacao},</p>
            <p className="truncate text-sm font-semibold text-gray-900">{primeiroNome}</p>
          </div>

          {!collapsed && (
            <ChevronUp
              className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${menuOpen ? "" : "rotate-180"}`}
            />
          )}
        </button>
      </div>
    </aside>
  );
}
