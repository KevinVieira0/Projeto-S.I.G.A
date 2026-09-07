import { ShieldCheck, Building2 } from "lucide-react";

export const THEME = {
  admin: {
    label: "Administrador",
    icon: ShieldCheck,

    tabActive:
      "border-blue-600 bg-blue-600 text-white shadow-sm",

    image: "/images/login/admin.webp",
    imageAlt: "Ambiente moderno de educação técnica",

    eyebrow: "Gestão de aprendizes",
    title: "Formando hoje os talentos de amanhã.",
    description:
      "Gerencie alunos, empresas e oportunidades de aprendizagem em um único ambiente.",

    items: [
      "Gestão centralizada",
      "Informações organizadas",
      "Acompanhamento de aprendizes",
    ],
  },

  empresa: {
    label: "Empresa",
    icon: Building2,

    tabActive:
      "border-orange-600 bg-orange-600 text-white shadow-sm",

    image: "/images/login/empresa.webp",
    imageAlt: "Ambiente industrial moderno e automatizado",

    eyebrow: "Portal da empresa",
    title: "Parcerias que desenvolvem pessoas.",
    description:
      "Solicite aprendizes e acompanhe oportunidades para sua empresa.",

    items: [
      "Solicitação de aprendizes",
      "Integração com o SENAI",
      "Processo simples e organizado",
    ],
  },
};