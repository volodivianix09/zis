import { NextRequest, NextResponse } from 'next/server'
import { isLocal } from '@/lib/db'
import * as local from '@/lib/db/local'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { title, description, format, district, address, lat, lng, max_people, scheduled_at } = body

  if (isLocal()) {
    const { data: { user } } = await (await import('@/lib/supabase/server')).createClient() as any
    const userId = user?.id || 'dev-user'
    
    const walk = local.createWalk({
      creator_id: userId,
      title,
      description,
      format,
      district,
      address,
      lat: lat || 55.7558,
      lng: lng || 37.6173,
      max_people: max_people || 3,
      scheduled_at: scheduled_at || new Date().toISOString(),
    })
    return NextResponse.json({ walk })
  }

  const supabase = await (await import('@/lib/supabase/server')).createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: walk, error } = await supabase
    .from('walks')
    .insert({
      creator_id: user.id,
      title: body.title,
      description: body.description,
      format: body.format,
      district: body.district,
      address: body.address,
      location: `POINT(${body.lng} ${body.lat})`,
      max_people: body.max_people,
      scheduled_at: body.scheduled_at,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('walk_participants').insert({
    walk_id: walk.id,
    user_id: user.id,
    role: 'creator',
    status: 'accepted',
    liveness_verified: true,
  })

  return NextResponse.json({ walk })
}
