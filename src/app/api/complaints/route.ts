import { NextRequest, NextResponse } from 'next/server'
import { isLocal } from '@/lib/db'
import * as local from '@/lib/db/local'

export async function POST(request: NextRequest) {
  const { walk_id, accused_id, reason, description } = await request.json()

  if (!walk_id || !accused_id || !reason) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (isLocal()) {
    local.createComplaint(walk_id, 'dev-user', accused_id, reason, description)
    return NextResponse.json({ success: true })
  }

  const supabase = await (await import('@/lib/supabase/server')).createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase.from('complaints').insert({
    walk_id,
    complainant_id: user.id,
    accused_id,
    reason,
    description,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
