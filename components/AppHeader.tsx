import type { MouseEvent } from "react";
import type { AuthenticatedUser } from "../lib/types";

export type AppView = "today" | "coach" | "insights" | "account";

const NAV_ITEMS: Array<{ id: Exclude<AppView, "account">; label: string }> = [
  { id: "today", label: "Today" },
  { id: "coach", label: "Coach" },
  { id: "insights", label: "My patterns" },
];

type Props = {
  user: AuthenticatedUser;
  view: AppView;
  onViewChange: (view: AppView) => void;
  onSignOut: () => void;
};

export function AppHeader({ user, view, onViewChange, onSignOut }: Props) {
  const initial = user.displayName.slice(0, 1).toUpperCase();

  function openAccount(event: MouseEvent<HTMLButtonElement>) {
    onViewChange("account");
    event.currentTarget.closest("details")?.removeAttribute("open");
  }

  return (
    <header className="topbar">
      <a className="brand-lockup" href="#main-content">
        <span className="brand-mark">R</span>
        <span>reframe</span>
      </a>
      <nav aria-label="Primary navigation">
        {NAV_ITEMS.map((item) => (
          <button
            type="button"
            key={item.id}
            className={view === item.id ? "active" : ""}
            aria-current={view === item.id ? "page" : undefined}
            onClick={() => onViewChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <details className="account-menu">
        <summary aria-label={`Open account menu for ${user.displayName}`}>
          <span className="profile-chip" aria-hidden="true">{initial}</span>
        </summary>
        <div className="account-popover">
          <strong>{user.displayName}</strong>
          <span>{user.email}</span>
          <button type="button" onClick={openAccount}>Account & privacy</button>
          <button type="button" onClick={onSignOut}>Sign out</button>
        </div>
      </details>
    </header>
  );
}
