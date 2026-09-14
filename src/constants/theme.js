import { ShieldCheck, Building2 } from "lucide-react";

export const THEME = {
  admin: {
    label: "Administrador",
    icon: ShieldCheck,

    tabActive:
      "border-blue-600 bg-blue-600 text-white shadow-sm",

    image: "/login/admin.webp",
    imageAlt: "Ambiente moderno de educação técnica",

    eyebrow: "Gestão de aprendizes",
    title: "Formando hoje talentos para um amanhã mais forte.",
    description:
      "Gerencie alunos, empresas e oportunidades de aprendizagem em um único ambiente.",

    items: [
      "Educação para o trabalho",
      "Indústria mais competitiva",
      "Pessoas que transformam",
    ],
  },

  empresa: {
    label: "Empresa",
    icon: Building2,

    tabActive:
      "border-orange-600 bg-orange-600 text-white shadow-sm",

    image: "/login/empresa.webp",
    imageAlt: "Ambiente industrial moderno e automatizado",

    eyebrow: "Portal da empresa",
    title: "Parceria que desenvolve pessoas e impulsiona o futuro.",
    description:
      "Solicite aprendizes e acompanhe oportunidades para sua empresa.",

    items: [
      "Empresas mais fortes",
      "Jovens mais preparados",
      "Indústria mais humana",
    ],
  },
};
