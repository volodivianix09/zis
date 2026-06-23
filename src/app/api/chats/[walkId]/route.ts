import { NextRequest, NextResponse } from 'next/server'
import { isLocal } from '@/lib/db'
import * as local from '@/lib/db/local'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ walkId: string }> }
) {
  const { walkId } = await params
  const body = await request.json()
  const { content } = body

  if (isLocal()) {
    if (!content?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 })
    const message = local.sendMessage(walkId, 'dev-user', content.trim())
    return NextResponse.json({ message })
  }

  const supabase = await (await import('@/lib/supabase/server')).createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: participant } = await supabase
    .from('walk_participants')
    .select('*')
    .eq('walk_id', walkId)
    .eq('user_id', user.id)
    .eq('status', 'accepted')
    .single()

  if (!participant) return NextResponse.json({ error: 'Not a participant' }, { status: 403 })

  const { data: message, error } = await supabase
    .from('messages')
    .insert({ walk_id: walkId, sender_id: user.id, content: content.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walkId: string }> }
) {
  const { walkId } = await params

  if (isLocal()) {
    const messages = local.getMessages(walkId)
    return NextResponse.json({ messages })
  }

  const supabase = await (await import('@/lib/supabase/server')).createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('walk_id', walkId)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ messages })
}
