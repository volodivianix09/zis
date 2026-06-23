import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function DELETE() {
  const { error: delMessages } = await supabaseAdmin
    .from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const { error: delParticipants } = await supabaseAdmin
    .from('walk_participants').delete().neq('walk_id', '00000000-0000-0000-0000-000000000000')

  const { error: delWalks } = await supabaseAdmin
    .from('walks').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  if (delMessages || delParticipants || delWalks) {
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true, cleaned: true })
}
