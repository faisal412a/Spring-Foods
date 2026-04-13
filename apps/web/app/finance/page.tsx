import { requireSessionUser } from "../../lib/auth";
import { getDashboardData } from "../../lib/db";
import { AppShell } from "../components/app-shell";
import { FeedbackBanners, FinanceModule } from "../components/erp-pages";

type SearchValue = string | string[] | undefined;

export default async function FinancePage({ searchParams }: { searchParams?: Promise<Record<string, SearchValue>> }) {
  const user = await requireSessionUser();
  const data = await getDashboardData(user);
  const params = (await searchParams) ?? {};

  return (
    <AppShell user={user} settings={data.settings} title="Finance" kicker="Accounting">
      <FeedbackBanners data={data} params={params} />
      <FinanceModule data={data} user={user} />
    </AppShell>
  );
}
