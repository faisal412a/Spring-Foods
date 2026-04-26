import { requireSessionUser } from "../../lib/auth";
import { getDashboardData } from "../../lib/db";
import { AppShell } from "../components/app-shell";
import { FeedbackBanners, UsersModule } from "../components/erp-pages";

type SearchValue = string | string[] | undefined;

export default async function UsersPage({ searchParams }: { searchParams?: Promise<Record<string, SearchValue>> }) {
  const user = await requireSessionUser();
  const data = await getDashboardData(user);
  const params = (await searchParams) ?? {};

  return (
    <AppShell user={user} settings={data.settings} title="Users & Roles" kicker="Administration">
      <FeedbackBanners data={data} params={params} />
      <UsersModule data={data} user={user} params={params} />
    </AppShell>
  );
}
