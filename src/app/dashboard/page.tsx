import { auth } from "@/lib/auth";
import { TopBar } from "@/components/layout/Sidebar";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Dashboard"
        subtitle={`Welcome back, ${session?.user?.name?.split(" ")[0] || "User"}`}
      />
      <DashboardClient session={session} />
    </div>
  );
}
