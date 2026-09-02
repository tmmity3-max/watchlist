'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import ColorDot from './ColorDot';
import { fetchWatchlists, createWatchlist, renameWatchlist, deleteWatchlist, addSection, renameSection, toggleSectionCollapsed, deleteSection, addSymbol, updateSymbol, removeSymbol, subscribeToWatchlistChanges } from '@/lib/queries';

const SUPER = '__super__';

function Stat({ label, value, sub }) {
  return <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-white/30">{label}</p><div className="mt-1 flex items-end justify-between"><span className="text-xl font-semibold text-white">{value}</span><span className="text-[10px] text-white/25">{sub}</span></div></div>;
}

function LiveCells() {
  return <><td className="px-4 py-3 text-right font-medium text-white/45">—</td><td className="px-4 py-3 text-right text-white/30">—</td><td className="px-4 py-3 text-right text-white/30">—</td><td className="px-4 py-3 text-right text-white/30">—</td></>;
}

export default function WatchlistBoard({ userId, initialWatchlists }) {
  const supabase = useMemo(() => createClient(), []);
  const [watchlists, setWatchlists] = useState(initialWatchlists);
  const [activeId, setActiveId] = useState(initialWatchlists[0]?.id ?? SUPER);
  const [compact, setCompact] = useState(false);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => setWatchlists(await fetchWatchlists(supabase)), [supabase]);
  useEffect(() => subscribeToWatchlistChanges(supabase, userId, reload), [supabase, userId, reload]);

  const active = watchlists.find(w => w.id === activeId);
  const sections = useMemo(() => activeId === SUPER ? watchlists.map(w => ({ id: `super-${w.id}`, name: w.name, isCollapsed: false, symbols: w.sections.flatMap(s => s.symbols), readOnly: true })) : (active?.sections || []), [activeId, active, watchlists]);
  const symbolCount = watchlists.reduce((a,w) => a + w.sections.reduce((b,s) => b + s.symbols.length, 0), 0);
  const sectionCount = watchlists.reduce((a,w) => a + w.sections.length, 0);

  async function newWatchlist() {
    const name = prompt('New watchlist name'); if (!name) return;
    setBusy(true); try { const id = await createWatchlist(supabase, userId, name); await reload(); setActiveId(id); } finally { setBusy(false); }
  }
  async function renameWL() { if (!active) return; const name = prompt('Rename watchlist', active.name); if (name && name !== active.name) { await renameWatchlist(supabase, active.id, name); await reload(); } }
  async function deleteWL() { if (!active || !confirm(`Delete "${active.name}" and everything in it?`)) return; await deleteWatchlist(supabase, active.id); setActiveId(SUPER); await reload(); }
  async function newSection() { if (!active) return; const name = prompt('New section name', 'Section'); if (name) { await addSection(supabase, userId, active.id, name); await reload(); } }

  return <div className="space-y-6">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div><div className="text-[11px] uppercase tracking-[.18em] text-blue-300/60">Trading workspace</div><h1 className="mt-2 text-3xl font-semibold tracking-[-.03em] text-white sm:text-4xl">Your watchlists</h1><p className="mt-2 text-sm text-white/35">Organize the symbols you watch and keep them synced with your extension.</p></div>
      <button onClick={newWatchlist} disabled={busy} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white/90 disabled:opacity-50">+ New watchlist</button>
    </div>

    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><Stat label="Watchlists" value={watchlists.length} sub="saved"/><Stat label="Symbols" value={symbolCount} sub="tracked"/><Stat label="Sections" value={sectionCount} sub="organized"/><Stat label="Connection" value="Ready" sub="realtime"/></div>

    <div className="overflow-hidden rounded-2xl border border-white/[.08] bg-[#0b0e13] shadow-2xl shadow-black/20">
      <div className="border-b border-white/[.07] p-3 sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-2 overflow-x-auto">
            <button onClick={() => setActiveId(SUPER)} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-medium ${activeId === SUPER ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/[.04] text-white/45 hover:text-white'}`}>★ Super Watchlist</button>
            {watchlists.map(w => <button key={w.id} onClick={() => setActiveId(w.id)} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-medium ${activeId === w.id ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/[.04] text-white/45 hover:text-white'}`}>{w.name}</button>)}
            <button onClick={newWatchlist} className="whitespace-nowrap rounded-xl border border-dashed border-white/10 px-4 py-2.5 text-xs text-white/30 hover:border-blue-400/30 hover:text-blue-300">+ Watchlist</button>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 rounded-xl bg-white/[.03] px-3 py-2 text-xs text-white/40"><input type="checkbox" checked={compact} onChange={e => setCompact(e.target.checked)} className="accent-blue-500"/> Compact</label>
            {activeId !== SUPER && active && <><button onClick={newSection} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white/50 hover:bg-white/[.05]">+ Section</button><button onClick={renameWL} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white/50 hover:bg-white/[.05]">Rename</button><button onClick={deleteWL} className="rounded-xl border border-red-400/15 px-3 py-2 text-xs text-red-300 hover:bg-red-400/10">Delete</button></>}
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-5">{sections.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-500/10 text-xl text-blue-300">＋</div><h3 className="mt-4 font-semibold">Start your workspace</h3><p className="mx-auto mt-2 max-w-sm text-sm text-white/30">Create a section and add symbols. Your extension and other devices will stay synchronized.</p>{activeId !== SUPER && <button onClick={newSection} className="mt-5 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-slate-950">Create section</button>}</div> : <div className="space-y-4">{sections.map(s => <Section key={s.id} section={s} supabase={supabase} userId={userId} watchlistId={active?.id} compact={compact} readOnly={activeId === SUPER} onChange={reload}/>)}</div>}</div>
    </div>
    <p className="text-center text-[11px] text-white/20">● Changes sync automatically across your connected devices</p>
  </div>;
}

function Section({ section, supabase, userId, watchlistId, compact, readOnly, onChange }) {
  const [collapsed, setCollapsed] = useState(section.isCollapsed); const [adding, setAdding] = useState(false);
  async function rename() { const name = prompt('Rename section', section.name); if (name && name !== section.name) { await renameSection(supabase, section.id, name); onChange(); } }
  async function remove() { if (confirm(`Delete section "${section.name}"?`)) { await deleteSection(supabase, section.id); onChange(); } }
  async function collapse() { const next = !collapsed; setCollapsed(next); if (!readOnly) await toggleSectionCollapsed(supabase, section.id, next); }
  return <div className="overflow-hidden rounded-2xl border border-white/[.08] bg-[#090c11]">
    <div className="flex flex-col gap-2 border-b border-white/[.06] bg-white/[.018] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><button onClick={collapse} className="flex items-center gap-2 text-left"><span className="grid h-6 w-6 place-items-center rounded-lg bg-white/[.05] text-xs text-white/45">{collapsed ? '›' : '⌄'}</span><b className="text-sm text-white/85">{section.name}</b><span className="rounded-full bg-white/[.05] px-2 py-0.5 text-[10px] text-white/30">{section.symbols.length}</span></button>{!readOnly && <div className="flex gap-4 pl-8 text-[11px] sm:pl-0"><button onClick={() => setAdding(v => !v)} className="text-blue-300">+ Symbol</button><button onClick={rename} className="text-white/35 hover:text-white">Rename</button><button onClick={remove} className="text-red-300/80">Delete</button></div>}</div>
    {!collapsed && <>{adding && <AddForm supabase={supabase} userId={userId} watchlistId={watchlistId} sectionId={section.id} done={() => {setAdding(false);onChange();}}/>}<div className="overflow-x-auto"><table className="w-full min-w-[820px] text-sm"><thead><tr className="border-b border-white/[.06] text-[10px] uppercase tracking-[.12em] text-white/25"><th className="w-10 px-3 py-3"/><th className="px-4 py-3 text-left">Symbol</th><th className="px-4 py-3 text-right">CMP</th><th className="px-4 py-3 text-right">Prev Day High</th><th className="px-4 py-3 text-right">Today's Move</th><th className="px-4 py-3 text-right">RVOL</th><th className="px-4 py-3 text-left">Note</th>{!readOnly&&<th className="w-10"/>}</tr></thead><tbody>{section.symbols.map(s=><Row key={s.id} symbol={s} supabase={supabase} compact={compact} readOnly={readOnly} onChange={onChange}/>)}{!section.symbols.length&&<tr><td colSpan={8} className="py-10 text-center text-xs text-white/25">No symbols yet. Add one using + Symbol.</td></tr>}</tbody></table></div></>}
  </div>;
}

function AddForm({ supabase, userId, watchlistId, sectionId, done }) {
  const [ticker,setTicker]=useState(''); const [exchange,setExchange]=useState('NSE'); const [saving,setSaving]=useState(false); const [error,setError]=useState('');
  async function submit(e){e.preventDefault();if(!ticker.trim())return;setSaving(true);setError('');try{await addSymbol(supabase,userId,{watchlistId,sectionId,ticker:ticker.trim(),exchange});done();}catch(err){setError(err.code==='23505'?'Already in this section.':err.message);}finally{setSaving(false);}}
  return <form onSubmit={submit} className="flex flex-wrap items-center gap-2 border-b border-white/[.06] bg-blue-500/[.035] px-4 py-3"><input autoFocus value={ticker} onChange={e=>setTicker(e.target.value.toUpperCase())} placeholder="Ticker e.g. TCS" className="h-9 w-36 rounded-xl border border-white/10 bg-[#080b10] px-3 text-xs text-white outline-none placeholder:text-white/20 focus:border-blue-400/50"/><select value={exchange} onChange={e=>setExchange(e.target.value)} className="h-9 rounded-xl border border-white/10 bg-[#080b10] px-3 text-xs text-white/60"><option>NSE</option><option>BSE</option><option>MCX</option></select><button disabled={saving} className="h-9 rounded-xl bg-blue-500 px-4 text-xs font-semibold text-white">{saving?'Adding…':'Add symbol'}</button>{error&&<span className="text-xs text-red-300">{error}</span>}</form>;
}

function Row({ symbol, supabase, compact, readOnly, onChange }) {
  const [note,setNote]=useState(symbol.note);
  async function color(c){if(!readOnly){await updateSymbol(supabase,symbol.id,{color:c});onChange();}}
  async function blur(){if(!readOnly&&note!==symbol.note)await updateSymbol(supabase,symbol.id,{note});}
  async function remove(){if(!readOnly){await removeSymbol(supabase,symbol.id);onChange();}}
  return <tr className={`border-b border-white/[.045] last:border-0 hover:bg-white/[.025] ${compact?'':'h-[54px]'}`}><td className="px-3"><ColorDot color={symbol.color} onChange={color}/></td><td className="px-4 py-3"><div className="flex items-center gap-2"><span className="font-semibold tracking-wide text-white/90">{symbol.ticker}</span><span className="rounded-md bg-white/[.045] px-1.5 py-0.5 text-[9px] text-white/30">{symbol.exchange}</span></div></td><LiveCells/><td className="px-4"><input value={note} disabled={readOnly} onChange={e=>setNote(e.target.value)} onBlur={blur} placeholder="Add note…" className="w-full min-w-[10rem] bg-transparent text-xs text-white/45 outline-none placeholder:text-white/15 focus:text-white/80"/></td>{!readOnly&&<td className="px-3 text-right"><button onClick={remove} className="grid h-7 w-7 place-items-center rounded-lg text-white/20 hover:bg-red-400/10 hover:text-red-300">×</button></td>}</tr>;
}
