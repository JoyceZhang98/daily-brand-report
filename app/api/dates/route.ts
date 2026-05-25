import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabase
    .from('daily_brand_report')
    .select('report_date')
    .order('report_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const dates = [...new Set(data.map((r) => r.report_date))]
  return NextResponse.json(dates)
}
