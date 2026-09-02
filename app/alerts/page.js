import { createClient } from '@/lib/supabase/server';

export default async function AlertsPage() {
  const supabase = createClient();
  const { data: alerts } = await supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false });
  const { data: history } = await supabase
    .from('alert_history')
    .select('*')
    .order('fired_at', { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section>
        <h2 className="mb-2 text-sm font-semibold text-base-muted">Alerts</h2>
        {alerts?.length ? (
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li key={a.id} className="rounded-lg border border-base-border bg-base-panel p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>
                    {a.ticker ?? `Section ${a.section_id}`} — {a.condition?.type}
                  </span>
                  <span className={a.status === 'active' ? 'text-tag-green' : 'text-base-muted'}>{a.status}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-base-border p-4 text-sm text-base-muted">
            No alerts yet. The condition builder (CMP crosses / % move / RVOL thresholds, §5 of the build
            prompt) is the next build step — the `alerts` table and cooldown logic are already in place.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-base-muted">Alert History</h2>
        {history?.length ? (
          <ul className="space-y-1 text-sm">
            {history.map((h) => (
              <li key={h.id} className="rounded-lg border border-base-border bg-base-panel px-3 py-2">
                {h.ticker} · {h.condition?.type} · CMP {h.cmp_at_fire ?? '—'} ·{' '}
                {new Date(h.fired_at).toLocaleString()}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-base-muted">Nothing has fired yet.</p>
        )}
      </section>
    </div>
  );
}
