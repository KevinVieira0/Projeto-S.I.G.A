"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Home,
  RefreshCw,
  CheckCircle2,
  BarChart3,
  Settings,
} from "lucide-react";
import logoSenai from "../../../public/images/Logo-SENAI.png";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { label: "Visão Geral", href: "/admin/dashboard", icon: Home },
  { label: "Solicitações", href: "/admin/solicitacoes", icon: RefreshCw },
  { label: "Contratados", href: "/admin/concluidas", icon: CheckCircle2 },
  { label: "Relatórios", href: "/admin/relatorios", icon: BarChart3 },
  { label: "Configurações", href: "/admin/configuracoes", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { session } = useAuth();

  const nome = session?.dados?.nome || "Administrador";
  const cargo = session?.tipo === "empresa" ? "Empresa" : "Perfil";

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-100 bg-white">
      {/* menu */}
      <div className="px-5 pt-5">
        <button
          type="button"
          aria-label="Abrir menu"
          className="text-gray-800 hover:text-gray-600"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
      <div className="px-5 pb-2 pt-6">
        <Image src={Logo-SENAI.png} alt="SENAI" className="h-8 w-auto" priority />
      </div>

      {/* Navegar */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition
                ${
                  isActive
                    ? "bg-blue-50 font-semibold text-blue-900"
                    : "font-normal text-gray-700 hover:bg-gray-50"
                }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Rodape*/}
      <div className="flex items-center gap-3 border-t border-gray-100 px-5 py-4">
        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-900" />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-gray-900">{nome}</p>
          <p className="text-xs text-gray-500">{cargo}</p>
        </div>
      </div>
    </aside>
  );
}
