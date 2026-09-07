"use client";

import { THEME } from "@/constants/theme";

const TAB_IDS = ["admin", "empresa"];

export default function LoginTabs({
  activeTab,
  onChange,
}) {
  return (
    <div
      role="group"
      aria-label="Selecione o tipo de acesso"
      className="mt-7 grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-100 p-1"
    >
      {TAB_IDS.map((id) => {
        const theme = THEME[id];
        const Icon = theme.icon;
        const isActive = activeTab === id;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={isActive}
            className={`
              flex min-h-11 items-center justify-center gap-2
              rounded-lg border px-3 py-2
              text-sm font-semibold outline-none
              transition-colors
              focus-visible:ring-2 focus-visible:ring-blue-500
              focus-visible:ring-offset-2
              ${
                isActive
                  ? theme.tabActive
                  : "border-transparent text-slate-600 hover:bg-white hover:text-slate-900"
              }
            `}
          >
            <Icon className="h-4 w-4" />

            {theme.label}
          </button>
        );
      })}
    </div>
  );
}