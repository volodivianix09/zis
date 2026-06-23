import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const ALLOWED_TABLES = ['profiles', 'walks', 'walk_participants', 'messages', 'reviews']

export async function GET(request: NextRequest) {
  const table = request.nextUrl.searchParams.get('table') || 'profiles'
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50')

  if (!ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
  }

  try {
    const { data: rows, error } = await supabaseAdmin
      .from(table)
      .select('*')
      .limit(limit)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ rows, total: rows?.length || 0 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, rows: [] }, { status: 500 })
  }
}
