import CompaniesTable from "../components/CompaniesTable";
import StudentIntakeStatus from "@/features/recebimentos/components/StudentIntakeStatus";
import PageContainer from "@/shared/layout/PageContainer";
import PageHeader from "@/shared/layout/PageHeader";
export default function EmpresasScreen() {
  return (
    <PageContainer>
      <PageHeader
        titulo="Empresas"
        descricao="Consulte e atualize as empresas beneficiárias do programa."
      />
      <StudentIntakeStatus tipo="EMPRESA" />
      <CompaniesTable gestao />
    </PageContainer>
  );
}
