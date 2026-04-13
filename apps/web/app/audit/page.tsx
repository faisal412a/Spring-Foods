import { requireSessionUser } from "../../lib/auth";
import { getDashboardData } from "../../lib/db";
import { AppShell } from "../components/app-shell";
import { AuditModule, FeedbackBanners } from "../components/erp-pages";

type SearchValue = string | string[] | undefined;

export default async function AuditPage({ searchParams }: { searchParams?: Promise<Record<string, SearchValue>> }) {
  const user = await requireSessionUser();
  const data = await getDashboardData(user);
  const params = (await searchParams) ?? {};

  return (
    <AppShell user={user} settings={data.settings} title="Audit History" kicker="System">
      <FeedbackBanners data={data} params={params} />
      <AuditModule data={data} user={user} />
    </AppShell>
  );
}
