import { DashboardClient } from "@/components/dashboard-client";
import { getDashboardData } from "@/lib/dashboard";
import { maybeRefreshCurrentPrices } from "@/lib/services";

export const revalidate = 0;

export default async function HomePage() {
  await maybeRefreshCurrentPrices("visit");
  const data = await getDashboardData();

  return <DashboardClient data={data} />;
}
