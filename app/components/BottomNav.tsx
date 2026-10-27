"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const Icon = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="18" height="16.5" rx="3" />
      <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  dispo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.6-3.5 3.3-5.5 6.5-5.5s5.9 2 6.5 5.5" />
      <path d="m15.5 9.5 2 2 4-4" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c.8-4 4-6 8-6s7.2 2 8 6" />
    </svg>
  ),
};

export default function BottomNav({ pendingCount }: { pendingCount: number }) {
  const path = usePathname();
  const is = (p: string) => (p === "/events" ? path === "/events" || /^\/events\/\d+/.test(path) : path.startsWith(p));

  return (
    <nav className="bottom-nav" aria-label="Navigation principale">
      <div className="bottom-nav-inner">
        <Link href="/events" className="nav-item" aria-current={is("/events") ? "page" : undefined}>
          {Icon.home}
          Sorties
          {pendingCount > 0 && <span className="nav-dot">{pendingCount}</span>}
        </Link>
        <Link href="/calendar" className="nav-item" aria-current={is("/calendar") ? "page" : undefined}>
          {Icon.calendar}
          Calendrier
        </Link>
        <Link href="/events/new" className="nav-item" aria-label="Proposer une sortie">
          <span className="nav-create">{Icon.plus}</span>
        </Link>
        <Link href="/dispos" className="nav-item" aria-current={is("/dispos") ? "page" : undefined}>
          {Icon.dispo}
          Mes dispos
        </Link>
        <Link href="/account" className="nav-item" aria-current={is("/account") ? "page" : undefined}>
          {Icon.profile}
          Profil
        </Link>
      </div>
    </nav>
  );
}
