"use client";

import { THEME } from "@/constants/theme";

const TAB_IDS = ["admin", "empresa"];

/**
 * Componente controlado: quem guarda o estado é o LoginCard.
 * Aqui só cuida da aparência do seletor de tipo de conta.
 */
export default function LoginTabs({ activeTab, onChange }) {
  return (
    <div className="my-6 flex items-stretch gap-3">
      <div className="w-px shrink-0 bg-gray-300" />
      <div className="flex flex-1 flex-wrap gap-2">
        {TAB_IDS.map((id) => {
          const theme = THEME[id];
          const Icon = theme.icon;
          const isActive = activeTab === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition
                ${isActive ? theme.tabActive : "border-transparent text-gray-600 hover:bg-gray-200/60"}`}
            >
              <Icon className="h-4 w-4" />
              {theme.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
