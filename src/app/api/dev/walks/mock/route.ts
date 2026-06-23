import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { title, description, format, lat, lng, max_people, scheduled_at } = body

    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1 })
    const creator_id = users?.[0]?.id

    if (!creator_id) {
      return NextResponse.json({ error: 'No users in DB, create a user first' }, { status: 400 })
    }

    const { data: walk, error } = await supabaseAdmin
      .from('walks')
      .insert({
        creator_id,
        title: title || `Тестовая прогулка #${Date.now()}`,
        description: description || 'Создано из Dev Panel',
        format: format || 'walk',
        location: `POINT(${lng || 37.6173} ${lat || 55.7558})`,
        max_people: max_people || 3,
        scheduled_at: scheduled_at || new Date(Date.now() + 3600000).toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    await supabaseAdmin.from('walk_participants').insert({
      walk_id: walk.id,
      user_id: creator_id,
      role: 'creator',
      status: 'accepted',
      liveness_verified: true,
    })

    return NextResponse.json({ walk })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
