import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const webhookUrl = process.env.LARK_WEBHOOK_URL
  if (!webhookUrl) return NextResponse.json({ error: 'LARK_WEBHOOK_URL not set' }, { status: 500 })

  // Get latest date
  const { data: dateRows } = await supabase
    .from('daily_brand_report')
    .select('report_date')
    .order('report_date', { ascending: false })
    .limit(1)

  if (!dateRows?.length) return NextResponse.json({ error: 'No data' }, { status: 404 })

  const date = dateRows[0].report_date

  // Fetch today and yesterday in parallel
  const [{ data: rows }, { data: prevDateRows }] = await Promise.all([
    supabase.from('daily_brand_report').select('*').eq('report_date', date),
    supabase
      .from('daily_brand_report')
      .select('report_date')
      .lt('report_date', date)
      .order('report_date', { ascending: false })
      .limit(1),
  ])

  if (!rows?.length) return NextResponse.json({ error: 'No data for date' }, { status: 404 })

  const prevDate = prevDateRows?.[0]?.report_date ?? null
  const { data: prevRows } = prevDate
    ? await supabase.from('daily_brand_report').select('*').eq('report_date', prevDate)
    : { data: null }

  // Aggregate today
  const sum = (arr: typeof rows, key: keyof typeof rows[0]) =>
    arr.reduce((s, r) => s + ((r[key] as number) ?? 0), 0)

  const totalVideos = sum(rows, 'new_videos')
  const totalGmv = sum(rows, 'gmv')
  const totalSampleReq = sum(rows, 'sample_request')
  const totalTpSent = sum(rows, 'tp_sent')
  const totalL3 = sum(rows, 'l3_plus')
  const activeBrands = rows.length

  // Aggregate yesterday
  const prevVideos = prevRows ? sum(prevRows, 'new_videos') : null
  const prevGmv = prevRows ? sum(prevRows, 'gmv') : null
  const prevSampleReq = prevRows ? sum(prevRows, 'sample_request') : null
  const prevTpSent = prevRows ? sum(prevRows, 'tp_sent') : null
  const prevL3 = prevRows ? sum(prevRows, 'l3_plus') : null
  const prevActiveBrands = prevRows ? prevRows.length : null

  // Format helpers
  const dod = (cur: number, prev: number | null) => {
    if (prev == null || prev === 0) return ''
    const pct = ((cur - prev) / prev) * 100
    return pct >= 0 ? ` ▲ +${pct.toFixed(1)}%` : ` ▼ ${pct.toFixed(1)}%`
  }
  const num = (n: number) => n.toLocaleString('en-US')
  const usd = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app'

  const body = {
    msg_type: 'interactive',
    card: {
      config: { wide_screen_mode: true },
      header: {
        title: { tag: 'plain_text', content: `📊 Daily Brand Report — ${date}` },
        template: 'blue',
      },
      elements: [
        {
          tag: 'div',
          fields: [
            { is_short: true, text: { tag: 'lark_md', content: `**Brands**\n${activeBrands}${dod(activeBrands, prevActiveBrands)}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**New Videos**\n${num(totalVideos)}${dod(totalVideos, prevVideos)}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**L3+ Videos**\n${num(totalL3)}${dod(totalL3, prevL3)}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**Total GMV**\n${usd(totalGmv)}${dod(totalGmv, prevGmv)}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**Sample Requests**\n${num(totalSampleReq)}${dod(totalSampleReq, prevSampleReq)}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**TP Outreach**\n${num(totalTpSent)}${dod(totalTpSent, prevTpSent)}` } },
          ],
        },
        { tag: 'hr' },
        {
          tag: 'action',
          actions: [
            {
              tag: 'button',
              text: { tag: 'plain_text', content: '🔗 View Full Report' },
              type: 'primary',
              url: `${appUrl}?date=${date}`,
            },
          ],
        },
      ],
    },
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const result = await res.text()
  return NextResponse.json({ ok: res.ok, result, date })
}
