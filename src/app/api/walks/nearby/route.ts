import { NextRequest, NextResponse } from 'next/server'
import { isLocal } from '@/lib/db'
import * as local from '@/lib/db/local'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get('lat') || '55.7558')
  const lng = parseFloat(searchParams.get('lng') || '37.6173')
  const radius = parseFloat(searchParams.get('radius') || '3')
  const status = searchParams.get('status') || 'open'

  if (isLocal()) {
    const walks = local.getNearbyWalks(lat, lng, radius, status)
    return NextResponse.json({ walks })
  }

  const supabase = await (await import('@/lib/supabase/server')).createClient()
  const { data, error } = await supabase.rpc('get_nearby_walks', {
    user_lat: lat,
    user_lng: lng,
    radius_km: radius,
    walk_status: status,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ walks: data })
}
