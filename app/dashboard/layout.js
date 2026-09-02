import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from '@/components/SignOutButton';

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-blue-500/10 text-[11px] font-black tracking-tight text-blue-200">TM</span>
      <span className="font-semibold tracking-tight">TM Watchlist</span>
    </Link>
  );
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '/alerts', label: 'Alerts', icon: '⌁' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
];

export default async function DashboardLayout({ children }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-[#090b0f] text-base-text">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-white/[0.07] bg-[#0d1015] px-4 py-5 lg:block">
        <Brand />
        <div className="mt-10 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25">Workspace</div>
        <nav className="mt-3 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/50 transition hover:bg-white/[0.05] hover:text-white">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-white/[0.04] text-xs">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-5 left-4 right-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" /><span className="text-xs text-white/60">Workspace synced</span></div>
          <p className="mt-2 truncate text-[10px] text-white/25">{user.email}</p>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/[0.07] bg-[#090b0f]/90 px-4 backdrop-blur-xl sm:px-6">
          <div className="lg:hidden"><Brand /></div>
          <div className="hidden lg:block"><p className="text-sm font-medium">Market Workspace</p><p className="text-[10px] text-white/30">Your synced trading watchlists</p></div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1.5 text-[10px] text-emerald-300 sm:inline-flex">● Synced</span>
            <span className="hidden max-w-48 truncate text-xs text-white/35 sm:block">{user.email}</span>
            <SignOutButton />
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
