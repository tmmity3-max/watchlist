import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-sm font-black tracking-tight text-white shadow-lg shadow-blue-500/10">
        TM
      </span>
      <span className="font-semibold tracking-tight text-white">TM Watchlist</span>
    </Link>
  );
}

const features = [
  ['One watchlist. Everywhere.', 'Keep the same trading workspace available across your devices.'],
  ['Built for active traders', 'Organize symbols into focused watchlists and sections without the clutter.'],
  ['Alerts that fit your rules', 'Build toward price conditions and delayed market alerts that match your workflow.'],
];

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen overflow-hidden bg-[#080a0e] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(61,127,240,0.18),transparent_32%),radial-gradient(circle_at_15%_45%,rgba(78,110,190,0.10),transparent_28%)]" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <header className="flex h-20 items-center justify-between">
          <Brand />
          <nav className="flex items-center gap-3">
            <Link href={user ? '/dashboard' : '/login'} className="rounded-xl px-4 py-2 text-sm text-white/65 transition hover:bg-white/5 hover:text-white">
              {user ? 'Dashboard' : 'Log in'}
            </Link>
            {!user && <Link href="/signup" className="rounded-xl border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-white/90">Get started</Link>}
          </nav>
        </header>

        <section className="grid items-center gap-14 pb-24 pt-16 lg:grid-cols-[1.02fr_0.98fr] lg:pt-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-xs font-medium text-blue-200">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-300" /> Trading workspace, simplified
            </div>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Watch the market.
              <span className="block text-blue-300">Not your tabs.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/55">
              TM Watchlist gives your trading watchlists a clean, synced home — built to work alongside your browser extension and keep your market workspace consistent.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={user ? '/dashboard' : '/signup'} className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-2xl shadow-blue-500/10 transition hover:-translate-y-0.5 hover:bg-white/90">
                {user ? 'Open dashboard' : 'Create free account'}
              </Link>
              <Link href={user ? '/dashboard' : '/login'} className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
                {user ? 'Go to workspace' : 'I already have an account'}
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/40">
              <span>✓ Cross-device sync</span>
              <span>✓ Account-based privacy</span>
              <span>✓ Extension friendly</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 rounded-[3rem] bg-blue-500/10 blur-3xl" />
            <div className="relative rounded-3xl border border-white/10 bg-[#101319]/90 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl">
              <div className="rounded-2xl border border-white/10 bg-[#0b0e13] p-4 sm:p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/35">MARKET WORKSPACE</p>
                    <p className="mt-1 font-semibold">Super Watchlist</p>
                  </div>
                  <span className="rounded-full border border-emerald-400/15 bg-emerald-400/10 px-2.5 py-1 text-[10px] text-emerald-300">● Synced</span>
                </div>
                <div className="mb-4 flex gap-2 overflow-hidden">
                  {['Super', 'Breakout', 'Swing'].map((item, i) => <span key={item} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs ${i === 0 ? 'bg-blue-500/15 text-blue-200' : 'bg-white/[0.04] text-white/40'}`}>{item}</span>)}
                </div>
                <div className="overflow-hidden rounded-xl border border-white/10">
                  {[
                    ['TRENT', '4,182', '+2.84%', '1.72x'],
                    ['MCX', '7,910', '+1.91%', '1.44x'],
                    ['TITAN', '3,861', '+1.16%', '1.28x'],
                    ['BEL', '412', '+0.82%', '1.17x'],
                  ].map(([symbol, price, move, rvol]) => (
                    <div key={symbol} className="grid grid-cols-[1.2fr_1fr_1fr_0.8fr] items-center border-b border-white/[0.06] px-3 py-3 last:border-0 sm:px-4">
                      <span className="text-xs font-semibold">{symbol}</span>
                      <span className="text-right text-xs text-white/60">₹{price}</span>
                      <span className="text-right text-xs text-emerald-300">{move}</span>
                      <span className="text-right text-[10px] text-white/35">RVOL {rvol}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-white/[0.035] p-3"><p className="text-[9px] text-white/30">SYMBOLS</p><p className="mt-1 text-sm font-semibold">24</p></div>
                  <div className="rounded-xl bg-white/[0.035] p-3"><p className="text-[9px] text-white/30">ALERTS</p><p className="mt-1 text-sm font-semibold">08</p></div>
                  <div className="rounded-xl bg-white/[0.035] p-3"><p className="text-[9px] text-white/30">SYNC</p><p className="mt-1 text-sm font-semibold text-emerald-300">Live</p></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.07] py-20">
          <div className="mb-10 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300/80">Designed for the workflow</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Less switching. More focus.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map(([title, text], i) => (
              <div key={title} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 transition hover:-translate-y-1 hover:bg-white/[0.04]">
                <div className="mb-6 grid h-9 w-9 place-items-center rounded-lg bg-blue-400/10 text-sm font-bold text-blue-300">0{i + 1}</div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/45">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-20 pt-4">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-white/[0.03] to-transparent p-8 sm:p-12">
            <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
              <div className="max-w-2xl"><h2 className="text-3xl font-semibold tracking-tight">Your watchlist should follow you.</h2><p className="mt-3 text-white/45">Start with the dashboard, then keep building the trading workspace around the way you actually trade.</p></div>
              <Link href={user ? '/dashboard' : '/signup'} className="shrink-0 rounded-xl bg-white px-5 py-3 text-center text-sm font-semibold text-slate-950">{user ? 'Open dashboard' : 'Get started'}</Link>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-3 border-t border-white/[0.07] py-8 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <Brand />
          <span>TM Watchlist · Trading workspace</span>
        </footer>
      </div>
    </main>
  );
}
