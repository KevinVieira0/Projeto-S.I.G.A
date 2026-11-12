"use client";
import { useState } from "react";
import { Building2, GraduationCap } from "lucide-react";
import Tabs from "@/shared/ui/Tabs";
import PageContainer from "@/shared/layout/PageContainer";
import PageHeader from "@/shared/layout/PageHeader";
import EmptyState from "@/shared/feedback/EmptyState";
const itens = [
  { id: "alunos", rotulo: "Alunos", icon: GraduationCap },
  { id: "empresas", rotulo: "Empresas", icon: Building2 },
];
export default function DashboardOverview({ children, empresas }) {
  const [visao, setVisao] = useState("alunos");
  return (
    <PageContainer>
      <PageHeader
        titulo="Visão Geral"
        descricao="Acompanhe os principais dados de alunos, empresas e solicitações."
      >
        <Tabs
          itens={itens}
          valor={visao}
          alterar={setVisao}
          rotulo="Visão geral de alunos ou empresas"
          prefixo="overview"
        />
      </PageHeader>
      <section
        id="overview-alunos-panel"
        role="tabpanel"
        aria-labelledby="overview-alunos-tab"
        hidden={visao !== "alunos"}
        className="ui-conteudo"
      >
        {children}
      </section>
      <section
        id="overview-empresas-panel"
        role="tabpanel"
        aria-labelledby="overview-empresas-tab"
        hidden={visao !== "empresas"}
        className="ui-conteudo"
      >
        {empresas || (
          <div className="ui-card">
            <EmptyState
              titulo="Visão geral das empresas"
              descricao="Os indicadores desta visão serão disponibilizados em breve."
            />
          </div>
        )}
      </section>
    </PageContainer>
  );
}
