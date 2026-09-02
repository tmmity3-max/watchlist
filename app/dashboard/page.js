import { createClient } from '@/lib/supabase/server';
import { fetchWatchlists } from '@/lib/queries';
import WatchlistBoard from '@/components/WatchlistBoard';

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initialWatchlists = await fetchWatchlists(supabase);

  return <WatchlistBoard userId={user.id} initialWatchlists={initialWatchlists} />;
}
