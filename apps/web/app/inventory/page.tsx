import { requireSessionUser } from "../../lib/auth";
import { getDashboardData } from "../../lib/db";
import { AppShell } from "../components/app-shell";
import { FeedbackBanners, InventoryModule } from "../components/erp-pages";

type SearchValue = string | string[] | undefined;

export default async function InventoryPage({ searchParams }: { searchParams?: Promise<Record<string, SearchValue>> }) {
  const user = await requireSessionUser();
  const data = await getDashboardData(user);
  const params = (await searchParams) ?? {};

  return (
    <AppShell user={user} settings={data.settings} title="Stock & Inventory" kicker="Inventory">
      <FeedbackBanners data={data} params={params} />
      <InventoryModule data={data} />
    </AppShell>
  );
}
