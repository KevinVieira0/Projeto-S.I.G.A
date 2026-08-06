"use client";

import { THEME } from "@/constants/theme";

export default function PortalHeader({ activeTab }) {
  const theme = THEME[activeTab];
  const Icon = theme.icon;

  return (
    <div className="mb-6 flex items-center justify-center gap-2">
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${theme.badgeBg}`}>
        <Icon className={`h-4 w-4 ${theme.badgeIconColor}`} />
      </span>
      <span className="text-xs font-bold tracking-wide text-gray-700">
        PORTAL DE ACESSO
      </span>
    </div>
  );
}
