import { loginAction } from "../actions";
import { getSystemSettings } from "../../lib/db";

type SearchValue = string | string[] | undefined;

function readParam(value: SearchValue) {
  return typeof value === "string" ? value : "";
}

export default async function LoginPage({ searchParams }: { searchParams?: Promise<Record<string, SearchValue>> }) {
  const params = (await searchParams) ?? {};
  const error = readParam(params.error);
  const settings = await getSystemSettings();

  return (
    <main className="login-screen">
      <section className="login-card">
        <div className="brand-panel login-brand">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Company logo" className="brand-logo brand-logo-large" />
          ) : (
            <div className="brand-icon">SF</div>
          )}
          <div>
            <strong>Spring Foods</strong>
            <p>{settings.region} Frozen Food ERP</p>
          </div>
        </div>

        <div className="login-copy">
          <p className="section-kicker">Secure Access</p>
          <h1>Sign in to continue</h1>
          <p>Only authorized users can open the ERP and view company data.</p>
        </div>

        {error ? <div className="feedback error-feedback">{error}</div> : null}

        <form action={loginAction} className="form-grid">
          <input name="username" placeholder="Username" required />
          <input name="password" type="password" placeholder="Password" required />
          <button type="submit" className="toolbar-button primary-button">Sign in</button>
        </form>

        <div className="login-hint">
          Starter accounts: `admin`, `sales`, `warehouse`, `accounts`
        </div>
      </section>
    </main>
  );
}
