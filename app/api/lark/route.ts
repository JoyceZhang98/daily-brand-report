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

  const { data: rows } = await supabase
    .from('daily_brand_report')
    .select('*')
    .eq('report_date', date)
    .order('new_videos', { ascending: false })

  if (!rows?.length) return NextResponse.json({ error: 'No data for date' }, { status: 404 })

  const totalVideos = rows.reduce((s, r) => s + (r.new_videos ?? 0), 0)
  const totalGmv = rows.reduce((s, r) => s + (r.gmv ?? 0), 0)
  const totalSampleReq = rows.reduce((s, r) => s + (r.sample_request ?? 0), 0)
  const totalTpSent = rows.reduce((s, r) => s + (r.tp_sent ?? 0), 0)
  const activeBrands = rows.filter((r) => (r.new_videos ?? 0) > 0).length

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
            { is_short: true, text: { tag: 'lark_md', content: `**Active Brands**\n${activeBrands}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**New Videos**\n${totalVideos.toLocaleString()}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**Total GMV**\n$${totalGmv.toLocaleString('en-US', { maximumFractionDigits: 0 })}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**Sample Requests**\n${totalSampleReq.toLocaleString()}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**TP Outreach**\n${totalTpSent.toLocaleString()}` } },
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
