import { requireSessionUser } from "../../lib/auth";
import { getDashboardData } from "../../lib/db";
import { AppShell } from "../components/app-shell";
import { FeedbackBanners, ProductionModule } from "../components/erp-pages";

type SearchValue = string | string[] | undefined;

export default async function ProductionPage({ searchParams }: { searchParams?: Promise<Record<string, SearchValue>> }) {
  const user = await requireSessionUser();
  const data = await getDashboardData(user);
  const params = (await searchParams) ?? {};

  return (
    <AppShell user={user} settings={data.settings} title="Production" kicker="Operations">
      <FeedbackBanners data={data} params={params} />
      <ProductionModule data={data} user={user} params={params} />
    </AppShell>
  );
}
