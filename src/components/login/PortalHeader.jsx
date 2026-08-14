"use client";

import { THEME } from "@/constants/theme";

export default function PortalHeader({ activeTab }) {
  const theme = THEME[activeTab];
  const Icon = theme.icon;

  return (
  <div className="-mt-8 mb-6 flex items-center justify-center gap-y-4 rounded-lg bg-white p-2">
    <img src="images/Logo-SENAI.png" alt="Portal Logo" className="h-32" />
  </div>
  );
}
