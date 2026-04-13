import { requireSessionUser } from "../../lib/auth";
import { getDashboardData } from "../../lib/db";
import { AppShell } from "../components/app-shell";
import { DashboardModule, FeedbackBanners } from "../components/erp-pages";

type SearchValue = string | string[] | undefined;

export default async function DashboardPage({ searchParams }: { searchParams?: Promise<Record<string, SearchValue>> }) {
  const user = await requireSessionUser();
  const data = await getDashboardData(user);
  const params = (await searchParams) ?? {};

  return (
    <AppShell user={user} settings={data.settings} title="Operations Control Center" kicker="Dashboard">
      <FeedbackBanners data={data} params={params} />
      <DashboardModule data={data} />
    </AppShell>
  );
}
