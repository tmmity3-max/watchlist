// CRUD helpers used by the dashboard. Every mutation here is the "website" half
// of the last-write-wins sync described in the build prompt §3: each row's
// `updated_at` (set automatically by a DB trigger) is what the extension and
// website both compare when merging. Nothing here does client-side merging —
// that logic lives in the extension's pull/push loop.

function genId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---- Watchlists ----------------------------------------------------------

export async function fetchWatchlists(supabase) {
  const { data: watchlists, error: wErr } = await supabase
    .from('watchlists')
    .select('*')
    .order('sort_order', { ascending: true });
  if (wErr) throw wErr;

  const { data: sections, error: sErr } = await supabase
    .from('sections')
    .select('*')
    .order('sort_order', { ascending: true });
  if (sErr) throw sErr;

  const { data: symbols, error: symErr } = await supabase
    .from('symbols')
    .select('*')
    .order('sort_order', { ascending: true });
  if (symErr) throw symErr;

  // Assemble into the extension's nested shape: Watchlist -> sections[] -> symbols[]
  return watchlists.map((wl) => ({
    ...wl,
    sections: sections
      .filter((s) => s.watchlist_id === wl.id)
      .map((sec) => ({
        ...sec,
        symbols: symbols.filter(
          (sym) => sym.section_id === sec.id && sym.watchlist_id === wl.id
        ),
      })),
  }));
}

export async function createWatchlist(supabase, userId, name) {
  const watchlistId = genId('wl');
  const sectionId = genId('sec');

  const { error: wErr } = await supabase.from('watchlists').insert({
    id: watchlistId,
    user_id: userId,
    name,
    active_section_id: null,
  });
  if (wErr) throw wErr;

  const { error: sErr } = await supabase.from('sections').insert({
    id: sectionId,
    watchlist_id: watchlistId,
    user_id: userId,
    name: 'Main',
  });
  if (sErr) throw sErr;

  return watchlistId;
}

export async function renameWatchlist(supabase, watchlistId, name) {
  const { error } = await supabase.from('watchlists').update({ name }).eq('id', watchlistId);
  if (error) throw error;
}

export async function deleteWatchlist(supabase, watchlistId) {
  // sections/symbols cascade via FK ON DELETE CASCADE
  const { error } = await supabase.from('watchlists').delete().eq('id', watchlistId);
  if (error) throw error;
}

// ---- Sections --------------------------------------------------------------

export async function addSection(supabase, userId, watchlistId, name) {
  const id = genId('sec');
  const { error } = await supabase.from('sections').insert({
    id,
    watchlist_id: watchlistId,
    user_id: userId,
    name,
  });
  if (error) throw error;
  return id;
}

export async function renameSection(supabase, sectionId, name) {
  const { error } = await supabase.from('sections').update({ name }).eq('id', sectionId);
  if (error) throw error;
}

export async function toggleSectionCollapsed(supabase, sectionId, isCollapsed) {
  const { error } = await supabase
    .from('sections')
    .update({ is_collapsed: isCollapsed })
    .eq('id', sectionId);
  if (error) throw error;
}

export async function deleteSection(supabase, sectionId) {
  const { error } = await supabase.from('sections').delete().eq('id', sectionId);
  if (error) throw error;
}

// ---- Symbols ----------------------------------------------------------------
// Unique key is (watchlist_id, section_id, ticker, exchange) — enforced by a
// DB constraint (symbols_unique_row), never `ticker` alone, since the same
// ticker can legitimately live in more than one section.

export async function addSymbol(supabase, userId, { watchlistId, sectionId, ticker, exchange = 'NSE', color = 'none', note = '' }) {
  const { data, error } = await supabase
    .from('symbols')
    .insert({
      watchlist_id: watchlistId,
      section_id: sectionId,
      user_id: userId,
      ticker: ticker.toUpperCase(),
      exchange,
      color,
      note,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSymbol(supabase, symbolId, patch) {
  // patch may include: color, note, section_id (move), sort_order (reorder)
  const { error } = await supabase.from('symbols').update(patch).eq('id', symbolId);
  if (error) throw error;
}

export async function removeSymbol(supabase, symbolId) {
  const { error } = await supabase.from('symbols').delete().eq('id', symbolId);
  if (error) throw error;
}

// ---- Realtime subscription ---------------------------------------------------
// Fires on any change from the extension (or another browser tab) so the
// dashboard stays live without a manual refresh, per §3.

export function subscribeToWatchlistChanges(supabase, userId, onChange) {
  const channel = supabase
    .channel('watchlist-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'watchlists', filter: `user_id=eq.${userId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'sections', filter: `user_id=eq.${userId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'symbols', filter: `user_id=eq.${userId}` }, onChange)
    .subscribe();

  return () => supabase.removeChannel(channel);
}
