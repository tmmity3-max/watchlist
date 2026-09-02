import { createClient } from '@/lib/supabase/server';

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: settings } = await supabase
    .from('user_settings_public') // never selects the raw upstox_access_token
    .select('*')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="rounded-xl border border-base-border bg-base-panel p-4">
        <h2 className="mb-3 text-sm font-semibold">Upstox</h2>
        <div className="flex items-center justify-between text-sm">
          <span className="text-base-muted">
            {settings?.upstox_connected ? 'Connected' : 'Not connected'}
            {settings?.upstox_token_updated_at &&
              ` · refreshed ${new Date(settings.upstox_token_updated_at).toLocaleString()}`}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              settings?.upstox_connected ? 'bg-tag-green/20 text-tag-green' : 'bg-tag-red/20 text-tag-red'
            }`}
          >
            {settings?.upstox_connected ? 'Live' : 'Reconnect needed'}
          </span>
        </div>
        <p className="mt-2 text-xs text-base-muted">
          Upstox tokens expire daily. Once the price-fetch Edge Function (build step 3) is wired up, this
          banner will flip automatically when a poll gets a 401 back.
        </p>
      </section>

      <section className="rounded-xl border border-base-border bg-base-panel p-4">
        <h2 className="mb-3 text-sm font-semibold">Telegram</h2>
        <div className="flex items-center justify-between text-sm">
          <span className="text-base-muted">{settings?.telegram_connected ? 'Connected' : 'Not connected'}</span>
          <button className="rounded-lg bg-accent px-3 py-1.5 text-xs text-white opacity-50" disabled>
            Connect Telegram (build step 5)
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-base-border bg-base-panel p-4">
        <h2 className="mb-3 text-sm font-semibold">Sync</h2>
        <p className="text-sm text-base-muted">
          Last synced: <span className="text-base-text">just now</span> (this page)
        </p>
        <p className="mt-1 text-xs text-base-muted">
          Extension sync status will show here once the extension's push/pull loop is added (§3).
        </p>
      </section>
    </div>
  );
}
