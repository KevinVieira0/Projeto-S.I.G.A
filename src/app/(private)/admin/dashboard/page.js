import OverviewStatusCard from "@/components/dashboard/OverviewStatusCard";
import StudentSyncCard from "@/components/dashboard/StudentSyncCard";
import StudentsTable from "@/components/dashboard/StudentsTable";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import StudentsByCourseCard from "@/components/dashboard/StudentsByCourseCard";

export const metadata = {
  title: "Visão Geral | Projeto S.I.G.A",
};

export default function AdminDashboardPage() {
  return (
    <DashboardOverview>
      <StudentsTable />

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(360px,0.7fr)_minmax(0,1.3fr)]">
        <OverviewStatusCard showViewToggle={false} />
        <StudentsByCourseCard />
      </div>
      
      <StudentSyncCard />
    </DashboardOverview>
  );
}
