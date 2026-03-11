import { DashboardClient } from "@/components/dashboard-client";
import { getDashboardDataSafe } from "@/lib/dashboard";

export const revalidate = 0;

export default async function HomePage() {
  const data = await getDashboardDataSafe();

  return <DashboardClient data={data} />;
}
