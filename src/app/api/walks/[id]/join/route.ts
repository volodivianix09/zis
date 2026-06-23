import { NextRequest, NextResponse } from 'next/server'
import { isLocal } from '@/lib/db'
import * as local from '@/lib/db/local'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (isLocal()) {
    const result = local.joinWalk(id, 'dev-user')
    if (result.error) return NextResponse.json(result, { status: 400 })
    return NextResponse.json(result)
  }

  const supabase = await (await import('@/lib/supabase/server')).createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: walk } = await supabase
    .from('walks').select('*').eq('id', id).single()

  if (!walk) return NextResponse.json({ error: 'Walk not found' }, { status: 404 })
  if (walk.current_count >= walk.max_people) return NextResponse.json({ error: 'Walk is full' }, { status: 400 })

  const { data: existing } = await supabase
    .from('walk_participants')
    .select('*')
    .eq('walk_id', id)
    .eq('user_id', user.id)
    .single()

  if (existing) return NextResponse.json({ error: 'Already joined' }, { status: 400 })

  const { error } = await supabase.from('walk_participants').insert({
    walk_id: id,
    user_id: user.id,
    role: 'participant',
    status: 'pending',
    liveness_verified: false,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
