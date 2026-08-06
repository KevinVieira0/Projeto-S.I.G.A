import { ShieldCheck, Building2 } from "lucide-react";

export const THEME = {
  admin: {
    label: "Administrador",
    icon: ShieldCheck,
    badgeBg: "bg-blue-100",
    badgeIconColor: "text-blue-600",
    tabActive: "border-blue-300 bg-blue-50 text-blue-700",
    inputBorder: "border-blue-200",
    inputFocus: "focus:border-blue-400 focus:ring-blue-100",
    buttonColor: "blue",
    linkColor: "text-blue-600 hover:text-blue-700",
  },
  empresa: {
    label: "Empresa",
    icon: Building2,
    badgeBg: "bg-amber-100",
    badgeIconColor: "text-amber-600",
    tabActive: "border-amber-300 bg-amber-50 text-amber-700",
    inputBorder: "border-amber-200",
    inputFocus: "focus:border-amber-400 focus:ring-amber-100",
    buttonColor: "amber",
    linkColor: "text-amber-600 hover:text-amber-700",
  },
};
