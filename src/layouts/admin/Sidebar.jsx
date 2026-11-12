"use client";
import Image from "next/image";
import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import SidebarNavigation from "./SidebarNavigation";
import SidebarUserMenu from "./SidebarUserMenu";
export default function Sidebar({ recolhida, alternar }) {
  return (
    <aside
      className="admin-sidebar"
      data-collapsed={recolhida}
      aria-label="Menu lateral"
    >
      <header className="admin-brand">
        {recolhida ? (
          <Link
            href="/admin/dashboard"
            aria-label="S.I.G.A. — Visão Geral"
            className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-sm font-bold tracking-tight text-blue-950"
          >
            SG
          </Link>
        ) : (
          <div>
            <Link
              href="/admin/dashboard"
              aria-label="S.I.G.A. — Visão Geral"
              className="mb-3 block w-fit rounded-lg bg-white px-3 py-2"
            >
              <Image
                src="/images/Logo-SENAI.png"
                alt="SENAI"
                width={116}
                height={34}
                className="h-auto w-28"
              />
            </Link>
            <p className="admin-brand-name">S.I.G.A. · COORDENAÇÃO</p>
          </div>
        )}
      </header>
      <div className={recolhida ? "mb-5 px-3" : "mb-5 px-5"}>
        <button
          type="button"
          onClick={alternar}
          aria-label={
            recolhida ? "Expandir menu lateral" : "Recolher menu lateral"
          }
          aria-expanded={!recolhida}
          title="Ctrl/Cmd+B"
          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/15 text-xs text-blue-100 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          {recolhida ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" />
              <span>Recolher menu</span>
            </>
          )}
        </button>
      </div>
      <SidebarNavigation recolhida={recolhida} />
      <SidebarUserMenu recolhida={recolhida} />
    </aside>
  );
}
