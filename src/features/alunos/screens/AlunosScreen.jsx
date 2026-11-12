import StudentsTable from "../components/StudentsTable";
import StudentIntakeStatus from "@/features/recebimentos/components/StudentIntakeStatus";
import PageContainer from "@/shared/layout/PageContainer";
import PageHeader from "@/shared/layout/PageHeader";
export default function AlunosScreen() {
  return (
    <PageContainer>
      <PageHeader
        titulo="Alunos"
        descricao="Consulte e gerencie os cadastros e o acompanhamento dos aprendizes."
      />
      <StudentIntakeStatus />
      <StudentsTable gestao />
    </PageContainer>
  );
}
