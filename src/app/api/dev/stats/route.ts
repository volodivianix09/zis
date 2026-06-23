import { NextResponse } from 'next/server'
import { isLocal } from '@/lib/db'
import * as local from '@/lib/db/local'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (isLocal()) {
    return NextResponse.json(local.getStats())
  }

  try {
    const { supabaseAdmin } = await import('@/lib/supabase/admin')
    
    const { count: profiles } = await supabaseAdmin
      .from('profiles').select('*', { count: 'exact', head: true })
    const { count: walks } = await supabaseAdmin
      .from('walks').select('*', { count: 'exact', head: true })
    const { count: messages } = await supabaseAdmin
      .from('messages').select('*', { count: 'exact', head: true })
    const { count: active_walks } = await supabaseAdmin
      .from('walks').select('*', { count: 'exact', head: true }).eq('status', 'active')
    const { count: pending_requests } = await supabaseAdmin
      .from('walk_participants').select('*', { count: 'exact', head: true }).eq('status', 'pending')

    return NextResponse.json({
      profiles: profiles || 0,
      walks: walks || 0,
      messages: messages || 0,
      active_walks: active_walks || 0,
      pending_requests: pending_requests || 0,
      supabase_connected: true,
    })
  } catch (e: any) {
    return NextResponse.json({
      profiles: 0, walks: 0, messages: 0,
      active_walks: 0, pending_requests: 0,
      supabase_connected: false,
      error: e.message,
    })
  }
}
