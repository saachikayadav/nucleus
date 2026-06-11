'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useSummary } from '@/hooks';

const NAV = [
  {
    section: 'Command',
    items: [
      { href: '/overview',   label: 'Overview',        icon: <svg className="nav-icon" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg> },
      { href: '/incidents',  label: 'Live Incidents',  icon: <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>, badge: true },
      { href: '/analytics',  label: 'Analytics',       icon: <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 13L5 9l3 2.5 3-4.5 3-3"/></svg> },
    ],
  },
  {
    section: 'Operations',
    items: [
      { href: '/reports',    label: 'Incident Reports', icon: <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 7h6M5 10h4"/></svg> },
      { href: '/responders', label: 'Responders',       icon: <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="5" r="2.5"/><path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/></svg> },
      { href: '/devices',    label: 'AR Devices',       icon: <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="10" height="8" rx="1.5"/><path d="M11 7l4 2-4 2V7z"/></svg> },
    ],
  },
  {
    section: 'Intelligence',
    items: [
      { href: '/ai-performance', label: 'AI Performance', icon: <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="5.5"/><path d="M8 5.5v3l1.5 1.5"/></svg> },
      { href: '/heatmaps',       label: 'Heatmaps',       icon: <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 11l3-4 3 3 2.5-4L14 2"/><path d="M2 14h12"/></svg> },
    ],
  },
  {
    section: 'System',
    items: [
      { href: '/settings', label: 'Settings', icon: <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="2"/><path d="M8 2v2M8 12v2M2 8h2M12 8h2M3.8 3.8l1.4 1.4M10.8 10.8l1.4 1.4M3.8 12.2l1.4-1.4M10.8 5.2l1.4-1.4"/></svg> },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { data: summary } = useSummary();
  const redCount = summary?.triage_distribution?.Red?.count ?? 0;

  const initials = session?.user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'US';

  return (
    <aside className="sidebar">
      <div className="logo-area">
        <div className="logo">
          <div className="logo-mark">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L13 5.5V10.5L8 14L3 10.5V5.5L8 2Z" fill="rgba(255,255,255,0.35)" />
              <path d="M8 5L11 7V9L8 11L5 9V7L8 5Z" fill="#fff" />
            </svg>
          </div>
          <span className="logo-text">Valkyra</span>
        </div>
        <div className="logo-sub">Nucleus</div>
      </div>

      <nav className="nav">
        {NAV.map((group) => (
          <div key={group.section}>
            <div className="nav-section">{group.section}</div>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item${pathname === item.href ? ' active' : ''}`}
              >
                {item.icon}
                {item.label}
                {item.badge && redCount > 0 && (
                  <span className="nav-badge">{redCount}</span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '0 2px' }}>
          <div className="api-dot api-ok" />
          <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>API Connected</span>
        </div>
        <div className="user-chip" onClick={() => signOut({ callbackUrl: '/auth/signin' })}>
          <div className="avatar">{initials}</div>
          <div>
            <div className="user-name">{session?.user?.name ?? 'User'}</div>
            <div className="user-role">Click to sign out</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
