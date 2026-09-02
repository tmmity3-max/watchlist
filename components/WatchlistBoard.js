'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import ColorDot from './ColorDot';
import {
  fetchWatchlists,
  createWatchlist,
  renameWatchlist,
  deleteWatchlist,
  addSection,
  renameSection,
  toggleSectionCollapsed,
  deleteSection,
  addSymbol,
  updateSymbol,
  removeSymbol,
  subscribeToWatchlistChanges,
} from '@/lib/queries';

const SUPER = '__super__';

// Placeholder columns until the Upstox price-fetch Edge Function (build order §9 step 3)
// is wired up. Kept as a separate row-render step so swapping in live data later is a
// one-function change, not a rewrite of this component.
function LiveBadges() {
  return (
    <>
      <td className="px-2 py-1.5 text-right text-base-muted">—</td>
      <td className="px-2 py-1.5 text-right text-base-muted">—</td>
      <td className="px-2 py-1.5 text-right text-base-muted">—</td>
      <td className="px-2 py-1.5 text-right text-base-muted">—</td>
    </>
  );
}

export default function WatchlistBoard({ userId, initialWatchlists }) {
  const supabase = useMemo(() => createClient(), []);
  const [watchlists, setWatchlists] = useState(initialWatchlists);
  const [activeId, setActiveId] = useState(initialWatchlists[0]?.id ?? SUPER);
  const [isCompact, setIsCompact] = useState(false);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const data = await fetchWatchlists(supabase);
    setWatchlists(data);
  }, [supabase]);

  useEffect(() => {
    const unsubscribe = subscribeToWatchlistChanges(supabase, userId, () => {
      // Any change from the extension, another tab, or another device lands here.
      reload();
    });
    return unsubscribe;
  }, [supabase, userId, reload]);

  const active = watchlists.find((w) => w.id === activeId);

  // Super Watchlist: every symbol across every watchlist, grouped by ticker's
  // originating watchlist name instead of by section (read-only aggregate view).
  const superSections = useMemo(() => {
    if (activeId !== SUPER) return [];
    return watchlists.map((wl) => ({
      id: `super_${wl.id}`,
      name: wl.name,
      isCollapsed: false,
      symbols: wl.sections.flatMap((s) => s.symbols),
      readOnly: true,
    }));
  }, [activeId, watchlists]);

  async function handleAddWatchlist() {
    const name = prompt('New watchlist name');
    if (!name) return;
    setBusy(true);
    try {
      const id = await createWatchlist(supabase, userId, name);
      await reload();
      setActiveId(id);
    } finally {
      setBusy(false);
    }
  }

  async function handleRenameWatchlist() {
    if (!active) return;
    const name = prompt('Rename watchlist', active.name);
    if (!name || name === active.name) return;
    await renameWatchlist(supabase, active.id, name);
    await reload();
  }

  async function handleDeleteWatchlist() {
    if (!active) return;
    if (!confirm(`Delete "${active.name}" and everything in it?`)) return;
    await deleteWatchlist(supabase, active.id);
    setActiveId(watchlists.find((w) => w.id !== active.id)?.id ?? SUPER);
    await reload();
  }

  async function handleAddSection() {
    if (!active) return;
    const name = prompt('New section name', 'Section');
    if (!name) return;
    await addSection(supabase, userId, active.id, name);
    await reload();
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Watchlist switcher */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveId(SUPER)}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            activeId === SUPER ? 'bg-accent text-white' : 'bg-base-panel2 text-base-muted hover:text-base-text'
          }`}
        >
          Super Watchlist
        </button>
        {watchlists.map((wl) => (
          <button
            key={wl.id}
            onClick={() => setActiveId(wl.id)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              activeId === wl.id ? 'bg-accent text-white' : 'bg-base-panel2 text-base-muted hover:text-base-text'
            }`}
          >
            {wl.name}
          </button>
        ))}
        <button
          onClick={handleAddWatchlist}
          disabled={busy}
          className="rounded-lg border border-dashed border-base-border px-3 py-1.5 text-sm text-base-muted hover:text-base-text"
        >
          + Watchlist
        </button>

        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-base-muted">
            <input type="checkbox" checked={isCompact} onChange={(e) => setIsCompact(e.target.checked)} />
            Compact
          </label>
          {activeId !== SUPER && active && (
            <>
              <button onClick={handleAddSection} className="rounded-lg border border-base-border px-2 py-1 text-xs hover:bg-base-panel2">
                + Section
              </button>
              <button onClick={handleRenameWatchlist} className="rounded-lg border border-base-border px-2 py-1 text-xs hover:bg-base-panel2">
                Rename
              </button>
              <button onClick={handleDeleteWatchlist} className="rounded-lg border border-base-border px-2 py-1 text-xs text-tag-red hover:bg-base-panel2">
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {(activeId === SUPER ? superSections : active?.sections ?? []).map((section) => (
          <SectionBlock
            key={section.id}
            supabase={supabase}
            userId={userId}
            watchlistId={active?.id}
            section={section}
            isCompact={isCompact}
            readOnly={activeId === SUPER}
            onChange={reload}
          />
        ))}
        {activeId !== SUPER && active?.sections.length === 0 && (
          <p className="text-sm text-base-muted">No sections yet — add one to get started.</p>
        )}
      </div>
    </div>
  );
}

function SectionBlock({ supabase, userId, watchlistId, section, isCompact, readOnly, onChange }) {
  const [collapsed, setCollapsed] = useState(section.isCollapsed);
  const [adding, setAdding] = useState(false);

  async function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    if (!readOnly) await toggleSectionCollapsed(supabase, section.id, next);
  }

  async function handleRename() {
    const name = prompt('Rename section', section.name);
    if (!name || name === section.name) return;
    await renameSection(supabase, section.id, name);
    onChange();
  }

  async function handleDelete() {
    if (!confirm(`Delete section "${section.name}"?`)) return;
    await deleteSection(supabase, section.id);
    onChange();
  }

  return (
    <div className="overflow-hidden rounded-xl border border-base-border">
      <div className="flex items-center justify-between bg-base-panel px-3 py-2">
        <button onClick={toggleCollapse} className="flex items-center gap-2 text-sm font-medium">
          <span className="text-base-muted">{collapsed ? '▸' : '▾'}</span>
          {section.name}
          <span className="text-xs text-base-muted">({section.symbols.length})</span>
        </button>
        {!readOnly && (
          <div className="flex items-center gap-2 text-xs">
            <button onClick={() => setAdding((v) => !v)} className="text-accent hover:underline">
              + Symbol
            </button>
            <button onClick={handleRename} className="text-base-muted hover:text-base-text">
              Rename
            </button>
            <button onClick={handleDelete} className="text-tag-red hover:underline">
              Delete
            </button>
          </div>
        )}
      </div>

      {!collapsed && (
        <>
          {adding && (
            <AddSymbolForm
              supabase={supabase}
              userId={userId}
              watchlistId={watchlistId}
              sectionId={section.id}
              onDone={() => {
                setAdding(false);
                onChange();
              }}
            />
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-base-border text-xs text-base-muted">
                <th className="w-6" />
                <th className="px-2 py-1.5 text-left">Symbol</th>
                <th className="px-2 py-1.5 text-right">CMP</th>
                <th className="px-2 py-1.5 text-right">Prev Day High</th>
                <th className="px-2 py-1.5 text-right">Today's Move</th>
                <th className="px-2 py-1.5 text-right">RVOL</th>
                <th className="px-2 py-1.5 text-left">Note</th>
                {!readOnly && <th className="w-6" />}
              </tr>
            </thead>
            <tbody>
              {section.symbols.map((sym) => (
                <SymbolRow
                  key={sym.id}
                  supabase={supabase}
                  symbol={sym}
                  isCompact={isCompact}
                  readOnly={readOnly}
                  onChange={onChange}
                />
              ))}
              {section.symbols.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-3 text-center text-xs text-base-muted">
                    No symbols in this section yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

function AddSymbolForm({ supabase, userId, watchlistId, sectionId, onDone }) {
  const [ticker, setTicker] = useState('');
  const [exchange, setExchange] = useState('NSE');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    if (!ticker.trim()) return;
    setSaving(true);
    setError('');
    try {
      await addSymbol(supabase, userId, { watchlistId, sectionId, ticker: ticker.trim(), exchange });
      onDone();
    } catch (err) {
      setError(err.code === '23505' ? 'That symbol is already in this section.' : err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleAdd} className="flex items-center gap-2 border-t border-base-border bg-base-panel2 px-3 py-2">
      <input
        autoFocus
        value={ticker}
        onChange={(e) => setTicker(e.target.value.toUpperCase())}
        placeholder="Ticker e.g. TCS"
        className="w-32 rounded border border-base-border bg-base-bg px-2 py-1 text-sm outline-none focus:border-accent"
      />
      <select
        value={exchange}
        onChange={(e) => setExchange(e.target.value)}
        className="rounded border border-base-border bg-base-bg px-2 py-1 text-sm"
      >
        <option>NSE</option>
        <option>BSE</option>
        <option>MCX</option>
      </select>
      <button type="submit" disabled={saving} className="rounded bg-accent px-3 py-1 text-sm text-white disabled:opacity-50">
        Add
      </button>
      {error && <span className="text-xs text-tag-red">{error}</span>}
    </form>
  );
}

function SymbolRow({ supabase, symbol, isCompact, readOnly, onChange }) {
  const [note, setNote] = useState(symbol.note);

  async function handleColor(color) {
    if (readOnly) return;
    await updateSymbol(supabase, symbol.id, { color });
    onChange();
  }

  async function handleNoteBlur() {
    if (readOnly || note === symbol.note) return;
    await updateSymbol(supabase, symbol.id, { note });
  }

  async function handleRemove() {
    if (readOnly) return;
    await removeSymbol(supabase, symbol.id);
    onChange();
  }

  return (
    <tr className={`border-t border-base-border/60 ${isCompact ? '' : 'h-9'} hover:bg-base-panel2/50`}>
      <td className="px-2">
        <ColorDot color={symbol.color} onChange={handleColor} />
      </td>
      <td className="px-2 py-1.5 font-medium">
        {symbol.ticker}
        <span className="ml-1 text-xs text-base-muted">{symbol.exchange}</span>
      </td>
      <LiveBadges />
      <td className="px-2 py-1.5">
        <input
          value={note}
          disabled={readOnly}
          onChange={(e) => setNote(e.target.value)}
          onBlur={handleNoteBlur}
          placeholder="—"
          className="w-full min-w-[8rem] bg-transparent text-xs text-base-muted outline-none focus:text-base-text disabled:cursor-default"
        />
      </td>
      {!readOnly && (
        <td className="px-2 text-right">
          <button onClick={handleRemove} title="Remove" className="text-base-muted hover:text-tag-red">
            ×
          </button>
        </td>
      )}
    </tr>
  );
}
