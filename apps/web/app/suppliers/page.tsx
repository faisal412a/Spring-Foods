import { requireSessionUser } from "../../lib/auth";
import { getDashboardData } from "../../lib/db";
import { AppShell } from "../components/app-shell";
import { FeedbackBanners, SuppliersModule } from "../components/erp-pages";

type SearchValue = string | string[] | undefined;

export default async function SuppliersPage({ searchParams }: { searchParams?: Promise<Record<string, SearchValue>> }) {
  const user = await requireSessionUser();
  const data = await getDashboardData(user);
  const params = (await searchParams) ?? {};

  return (
    <AppShell user={user} settings={data.settings} title="Suppliers" kicker="Procurement">
      <FeedbackBanners data={data} params={params} />
      <SuppliersModule data={data} user={user} params={params} />
    </AppShell>
  );
}
