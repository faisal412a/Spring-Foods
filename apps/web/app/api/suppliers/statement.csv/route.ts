import { getSessionUser } from "../../../../lib/auth";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const supplierId = searchParams.get("supplierId");
  if (!supplierId) {
    return new Response("Supplier id is required", { status: 400 });
  }

  const targetUrl = new URL(`/api/suppliers/${supplierId}/statement.csv`, request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (from) targetUrl.searchParams.set("from", from);
  if (to) targetUrl.searchParams.set("to", to);

  return Response.redirect(targetUrl, 302);
}
