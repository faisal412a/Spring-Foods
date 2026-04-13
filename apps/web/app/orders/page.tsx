import { requireSessionUser } from "../../lib/auth";
import { getDashboardData } from "../../lib/db";
import { AppShell } from "../components/app-shell";
import { FeedbackBanners, OrdersModule } from "../components/erp-pages";

type SearchValue = string | string[] | undefined;

export default async function OrdersPage({ searchParams }: { searchParams?: Promise<Record<string, SearchValue>> }) {
  const user = await requireSessionUser();
  const data = await getDashboardData(user);
  const params = (await searchParams) ?? {};

  return (
    <AppShell user={user} settings={data.settings} title="Sales Orders" kicker="Sales">
      <FeedbackBanners data={data} params={params} />
      <OrdersModule data={data} user={user} params={params} />
    </AppShell>
  );
}
