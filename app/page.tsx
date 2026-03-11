import { DashboardClient } from "@/components/dashboard-client";
import { getDashboardDataSafe } from "@/lib/dashboard";
import { maybeRefreshCurrentPrices } from "@/lib/services";

export const revalidate = 0;

export default async function HomePage() {
  try {
    await maybeRefreshCurrentPrices("visit");
  } catch (error) {
    console.error("maybeRefreshCurrentPrices error", error);
  }
  const data = await getDashboardDataSafe();

  return <DashboardClient data={data} />;
}
