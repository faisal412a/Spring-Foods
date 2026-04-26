import Link from "next/link";
import { ReactNode } from "react";
import { logoutAction } from "../actions";
import { SessionActivityGuard } from "./session-activity-guard";
import { SessionUser, SystemSettings, roleLabels } from "../../lib/erp-data";
import { getNavItems } from "../../lib/navigation";

type AppShellProps = {
  user: SessionUser;
  settings: SystemSettings;
  title: string;
  kicker: string;
  children: ReactNode;
};

export function AppShell({ user, settings, title, kicker, children }: AppShellProps) {
  const navItems = getNavItems(user);

  return (
    <main className="dashboard-shell">
      <SessionActivityGuard />
      <aside className="side-nav">
        <div className="brand-panel">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Company logo" className="brand-logo" />
          ) : (
            <div className="brand-icon">SF</div>
          )}
          <div>
            <strong>Spring Foods</strong>
            <p>{settings.region} ERP</p>
          </div>
        </div>

        <nav className="menu-list">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="menu-item">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="side-footer">
          <strong>{user.displayName}</strong>
          <span>{roleLabels[user.role]}</span>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div>
            <p className="section-kicker">{kicker}</p>
            <h1>{title}</h1>
          </div>

          <div className="topbar-actions">
            <input className="search-box" placeholder="Search..." />
            <span className="profile-pill">{user.displayName}</span>
            <form action={logoutAction}>
              <button type="submit" className="toolbar-button danger-button">
                Logout
              </button>
            </form>
          </div>
        </header>

        {children}
      </div>
    </main>
  );
}
