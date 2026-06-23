import { NextRequest, NextResponse } from 'next/server'
import { isLocal } from '@/lib/db'
import * as local from '@/lib/db/local'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { action } = await request.json()

  if (!['accepted', 'declined'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  if (isLocal()) {
    const result = local.respondToWalk(id, 'dev-user', action)
    if (result.error) return NextResponse.json(result, { status: 400 })
    return NextResponse.json(result)
  }

  const supabase = await (await import('@/lib/supabase/server')).createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: walk } = await supabase
    .from('walks').select('creator_id').eq('id', id).single()

  if (!walk || walk.creator_id !== user.id) {
    return NextResponse.json({ error: 'Not your walk' }, { status: 403 })
  }

  const { data: participant } = await supabase
    .from('walk_participants')
    .select('user_id')
    .eq('walk_id', id)
    .eq('status', 'pending')
    .single()

  if (!participant) return NextResponse.json({ error: 'No pending requests' }, { status: 400 })

  const { error } = await supabase
    .from('walk_participants')
    .update({ status: action })
    .eq('walk_id', id)
    .eq('user_id', participant.user_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (action === 'accepted') {
    await supabase.from('walks').update({ status: 'active' }).eq('id', id)

    await supabase.from('messages').insert({
      walk_id: id,
      sender_id: user.id,
      content: 'Участник присоединился к прогулке',
      is_system: true,
    })
  }

  return NextResponse.json({ success: true, status: action })
}
