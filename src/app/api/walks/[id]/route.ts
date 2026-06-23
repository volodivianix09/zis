import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: walk, error } = await supabase
    .from('walks')
    .select(`
      *,
      creator:profiles!walks_creator_id_fkey(*),
      participants:walk_participants(
        *,
        profile:profiles(*)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !walk) {
    return NextResponse.json({ error: 'Walk not found' }, { status: 404 })
  }

  return NextResponse.json({ walk })
}
