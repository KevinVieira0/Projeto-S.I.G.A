import StudentsTable from "@/components/dashboard/StudentsTable";
import StudentIntakeStatus from "@/components/alunos/StudentIntakeStatus";

export const metadata = { title: "Alunos | Projeto S.I.G.A" };

export default function AdminAlunosPage() {
  return (
    <div className="siga-pagina siga-entrada space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-slate-950">Alunos</h1>
      <StudentIntakeStatus />
      <StudentsTable gestao />
    </div>
  );
}
