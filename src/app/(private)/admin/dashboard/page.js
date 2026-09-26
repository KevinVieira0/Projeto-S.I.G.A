import OverviewStatusCard from "@/components/dashboard/OverviewStatusCard";
import StudentSyncCard from "@/components/dashboard/StudentSyncCard";
import StudentsTable from "@/components/dashboard/StudentsTable";
import DashboardOverview from "@/components/dashboard/DashboardOverview";

export const metadata = {
  title: "Visão Geral | Projeto S.I.G.A",
};

export default function AdminDashboardPage() {
  return (
    <DashboardOverview>
      <StudentsTable />

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <OverviewStatusCard showViewToggle={false} />
      </div>
      
      <StudentSyncCard />
    </DashboardOverview>
  );
}
