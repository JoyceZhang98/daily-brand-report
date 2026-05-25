'use client'

import { useEffect, useState, useMemo } from 'react'
import type { BrandReport } from '@/lib/supabase'

const fmt = (n: number | null, decimals = 0) =>
  n == null ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

const fmtPct = (n: number | null) =>
  n == null ? '—' : `${(n * 100).toFixed(1)}%`

const fmtUSD = (n: number | null) =>
  n == null ? '—' : `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fmtDod = (n: number | null) => {
  if (n == null) return null
  const pct = (n * 100).toFixed(1)
  return { text: `${n > 0 ? '+' : ''}${pct}%`, up: n >= 0 }
}

type SortKey = keyof BrandReport
type SortDir = 'asc' | 'desc'

export default function Home() {
  const [dates, setDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [rows, setRows] = useState<BrandReport[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('new_videos')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  useEffect(() => {
    fetch('/api/dates')
      .then((r) => r.json())
      .then((d: string[]) => {
        setDates(d)
        if (d.length) setSelectedDate(d[0])
      })
  }, [])

  useEffect(() => {
    if (!selectedDate) return
    setLoading(true)
    fetch(`/api/report?date=${selectedDate}`)
      .then((r) => r.json())
      .then((d: BrandReport[]) => { setRows(d); setLoading(false) })
  }, [selectedDate])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = useMemo(() => {
    let r = rows
    if (search) r = r.filter(x => x.brand_name.toLowerCase().includes(search.toLowerCase()))
    r = [...r].sort((a, b) => {
      const av = a[sortKey] as number | null
      const bv = b[sortKey] as number | null
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })
    return r
  }, [rows, search, sortKey, sortDir])

  const totals = useMemo(() => {
    const sum = (key: keyof BrandReport) => rows.reduce((s, r) => s + ((r[key] as number) ?? 0), 0)
    return {
      new_videos: sum('new_videos'),
      l3_plus: sum('l3_plus'),
      tp_sent: sum('tp_sent'),
      tp_creator_count: sum('tp_creator_count'),
      tp_accepted: sum('tp_accepted'),
      sample_request: sum('sample_request'),
      sample_approved: sum('sample_approved'),
      l3_sample: sum('l3_sample'),
      l3_sample_approved: sum('l3_sample_approved'),
      gmv: sum('gmv'),
    }
  }, [rows])

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className="ml-1 opacity-50 text-xs">
      {sortKey === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  )

  const Th = ({ col, label, className = '' }: { col: SortKey; label: string; className?: string }) => (
    <th
      onClick={() => handleSort(col)}
      className={`px-2 py-2 text-center cursor-pointer hover:bg-gray-700 whitespace-nowrap select-none ${className}`}
    >
      {label}<SortIcon col={col} />
    </th>
  )

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 font-mono text-xs">
      <div className="sticky top-0 z-20 bg-gray-900 border-b border-gray-700 px-4 py-3 flex flex-wrap items-center gap-4">
        <div>
          <div className="text-lg font-bold text-white">Daily Brand Report</div>
          <div className="text-gray-400 text-xs">{rows.length} brands</div>
        </div>

        <select
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
        >
          {dates.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <input
          type="text"
          placeholder="Search brand…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500 w-48"
        />

        <div className="flex gap-4 ml-auto flex-wrap">
          {[
            { label: 'New Videos', value: fmt(totals.new_videos) },
            { label: 'Total GMV', value: fmtUSD(totals.gmv) },
            { label: 'Sample Req', value: fmt(totals.sample_request) },
            { label: 'TP Outreach', value: fmt(totals.tp_sent) },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-gray-400 text-xs">{label}</div>
              <div className="text-white font-bold text-sm">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64 text-gray-400">Loading…</div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="bg-gray-800">
              <tr className="text-gray-300 border-b border-gray-700">
                <th className="px-2 py-1 text-left text-gray-500 bg-gray-800 sticky top-[57px] z-20" rowSpan={2}>#</th>
                <th className="px-2 py-1 text-left bg-gray-800 sticky top-[57px] left-0 z-30" rowSpan={2}>Brand</th>
                <th colSpan={3} className="px-2 py-1 text-center border-l border-gray-700 text-blue-400 bg-gray-800 sticky top-[57px] z-20">VIDEO</th>
                <th colSpan={4} className="px-2 py-1 text-center border-l border-gray-700 text-purple-400 bg-gray-800 sticky top-[57px] z-20">CREATOR</th>
                <th colSpan={4} className="px-2 py-1 text-center border-l border-gray-700 text-green-400 bg-gray-800 sticky top-[57px] z-20">SAMPLES</th>
                <th colSpan={8} className="px-2 py-1 text-center border-l border-gray-700 text-yellow-400 bg-gray-800 sticky top-[57px] z-20">DATA & PERFORMANCE</th>
              </tr>
              <tr className="text-gray-400 border-b border-gray-600">
                <Th col="new_videos" label="New Videos" className="border-l border-gray-700 bg-gray-800 sticky top-[82px] z-20" />
                <Th col="dod" label="DoD%" className="bg-gray-800 sticky top-[82px] z-20" />
                <Th col="l3_plus" label="L3+ Vids" className="bg-gray-800 sticky top-[82px] z-20" />

                <Th col="tp_sent" label="TP Outreach" className="border-l border-gray-700 bg-gray-800 sticky top-[82px] z-20" />
                <Th col="tp_creator_count" label="TP L3+" className="bg-gray-800 sticky top-[82px] z-20" />
                <Th col="tp_accepted" label="L3+ Accept" className="bg-gray-800 sticky top-[82px] z-20" />
                <Th col="tp_accept_rate" label="L3+ Accept%" className="bg-gray-800 sticky top-[82px] z-20" />

                <Th col="sample_request" label="Sample Req" className="border-l border-gray-700 bg-gray-800 sticky top-[82px] z-20" />
                <Th col="sample_approved" label="Approved" className="bg-gray-800 sticky top-[82px] z-20" />
                <Th col="l3_sample" label="L3+ Req" className="bg-gray-800 sticky top-[82px] z-20" />
                <Th col="l3_sample_approved" label="L3+ App%" className="bg-gray-800 sticky top-[82px] z-20" />

                <Th col="gmv" label="GMV" className="border-l border-gray-700 bg-gray-800 sticky top-[82px] z-20" />
                <Th col="video_ctr" label="Video CTR" className="bg-gray-800 sticky top-[82px] z-20" />
                <Th col="video_ctor" label="Video CTOR" className="bg-gray-800 sticky top-[82px] z-20" />
                <Th col="aov" label="AOV" className="bg-gray-800 sticky top-[82px] z-20" />
                <Th col="video_gmv_pct" label="Video GMV%" className="bg-gray-800 sticky top-[82px] z-20" />
                <Th col="live_gmv_pct" label="Live GMV%" className="bg-gray-800 sticky top-[82px] z-20" />
                <Th col="product_card_gmv_pct" label="Card GMV%" className="bg-gray-800 sticky top-[82px] z-20" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const dod = fmtDod(r.dod)
                const rowColor = i % 2 === 0 ? '#030712' : '#111827'
                return (
                  <tr key={r.brand_name} style={{ backgroundColor: rowColor }} className="hover:bg-gray-800 border-b border-gray-800 transition-colors">
                    <td className="px-2 py-1.5 text-gray-400 text-right">{i + 1}</td>
                    <td className="px-2 py-1.5 font-medium text-white sticky left-0 min-w-[160px] max-w-[200px] truncate" style={{ backgroundColor: rowColor }} title={r.brand_name}>
                      {r.brand_name}
                    </td>

                    <td className="px-2 py-1.5 text-center border-l border-gray-800 text-white font-medium">
                      {r.new_videos ?? '—'}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      {dod ? (
                        <span className={`font-medium ${dod.up ? 'text-green-400' : 'text-red-400'}`}>
                          {dod.text}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-2 py-1.5 text-center">{r.l3_plus ?? '—'}</td>

                    <td className="px-2 py-1.5 text-center border-l border-gray-800">{fmt(r.tp_sent)}</td>
                    <td className="px-2 py-1.5 text-center">{fmt(r.tp_creator_count)}</td>
                    <td className="px-2 py-1.5 text-center">{fmt(r.tp_accepted)}</td>
                    <td className="px-2 py-1.5 text-center">{fmtPct(r.tp_accept_rate)}</td>

                    <td className="px-2 py-1.5 text-center border-l border-gray-800">{fmt(r.sample_request)}</td>
                    <td className="px-2 py-1.5 text-center">{fmt(r.sample_approved)}</td>
                    <td className="px-2 py-1.5 text-center">{fmt(r.l3_sample)}</td>
                    <td className="px-2 py-1.5 text-center">
                      {r.l3_sample_approved_pct != null ? (
                        <span className={r.l3_sample_approved_pct > 0.1 ? 'text-green-400' : ''}>
                          {fmtPct(r.l3_sample_approved_pct)}
                        </span>
                      ) : '—'}
                    </td>

                    <td className="px-2 py-1.5 text-right border-l border-gray-800 text-yellow-300 font-medium">
                      {fmtUSD(r.gmv)}
                    </td>
                    <td className="px-2 py-1.5 text-center">{fmtPct(r.video_ctr)}</td>
                    <td className="px-2 py-1.5 text-center">{fmtPct(r.video_ctor)}</td>
                    <td className="px-2 py-1.5 text-right">{fmtUSD(r.aov)}</td>
                    <td className="px-2 py-1.5 text-center">{fmtPct(r.video_gmv_pct)}</td>
                    <td className="px-2 py-1.5 text-center">{fmtPct(r.live_gmv_pct)}</td>
                    <td className="px-2 py-1.5 text-center">{fmtPct(r.product_card_gmv_pct)}</td>
                  </tr>
                )
              })}

              <tr className="bg-gray-800 border-t-2 border-gray-500 font-bold text-white">
                <td className="px-2 py-2 text-gray-400" colSpan={2}>TOTAL ({filtered.length})</td>
                <td className="px-2 py-2 text-center border-l border-gray-600">{fmt(totals.new_videos)}</td>
                <td className="px-2 py-2 text-center">—</td>
                <td className="px-2 py-2 text-center">{fmt(totals.l3_plus)}</td>
                <td className="px-2 py-2 text-center border-l border-gray-600">{fmt(totals.tp_sent)}</td>
                <td className="px-2 py-2 text-center">{fmt(totals.tp_creator_count)}</td>
                <td className="px-2 py-2 text-center">{fmt(totals.tp_accepted)}</td>
                <td className="px-2 py-2 text-center">—</td>
                <td className="px-2 py-2 text-center border-l border-gray-600">{fmt(totals.sample_request)}</td>
                <td className="px-2 py-2 text-center">{fmt(totals.sample_approved)}</td>
                <td className="px-2 py-2 text-center">{fmt(totals.l3_sample)}</td>
                <td className="px-2 py-2 text-center">{fmt(totals.l3_sample_approved)}</td>
                <td className="px-2 py-2 text-right border-l border-gray-600 text-yellow-300">{fmtUSD(totals.gmv)}</td>
                <td colSpan={6} />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {!loading && filtered.length === 0 && selectedDate && (
        <div className="flex justify-center items-center h-64 text-gray-500">
          No data for {selectedDate}
        </div>
      )}
    </main>
  )
}
