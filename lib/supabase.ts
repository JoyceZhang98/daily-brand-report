import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type BrandReport = {
  report_date: string
  brand_name: string
  new_videos: number | null
  dod: number | null
  l3_plus: number | null
  l3_ratio: number | null
  below_l3: number | null
  sample_request: number | null
  sample_approved: number | null
  l3_sample: number | null
  l3_sample_pct: number | null
  l3_sample_approved: number | null
  l3_sample_approved_pct: number | null
  l1: number | null
  l2: number | null
  l3: number | null
  l4: number | null
  l5: number | null
  l6: number | null
  tp_sent: number | null
  tp_creator_count: number | null
  tp_l3_creator_count: number | null
  tp_accepted: number | null
  tp_l3_accepted: number | null
  tp_accept_rate: number | null
  gmv: number | null
  total_ctr: number | null
  total_ctor: number | null
  video_ctr: number | null
  video_ctor: number | null
  live_ctr: number | null
  live_ctor: number | null
  product_card_ctr: number | null
  product_card_ctor: number | null
  aov: number | null
  video_gmv_pct: number | null
  live_gmv_pct: number | null
  product_card_gmv_pct: number | null
}
