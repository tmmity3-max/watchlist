import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from '@/components/SignOutButton';

export default async function DashboardLayout({ children }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-base-border bg-base-panel px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold">TM Watchlist</span>
          <nav className="flex items-center gap-4 text-sm text-base-muted">
            <Link href="/dashboard" className="hover:text-base-text">
              Dashboard
            </Link>
            <Link href="/alerts" className="hover:text-base-text">
              Alerts
            </Link>
            <Link href="/settings" className="hover:text-base-text">
              Settings
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-base-muted">{user.email}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
