import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { isLocal } from '@/lib/db'
import * as local from '@/lib/db/local'
import { verifyTelegramInitData } from '@/lib/telegram/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { telegram_user, init_data } = await request.json()

    if (!telegram_user) {
      return NextResponse.json({ error: 'Missing telegram_user' }, { status: 400 })
    }

    if (isLocal()) {
      const existing = local.getProfileByTelegramId(telegram_user.id)
      if (existing) {
        return NextResponse.json({ profile: existing })
      }
      const profileId = crypto.randomUUID()
      const profile = local.createProfile(
        profileId,
        telegram_user.id,
        `${telegram_user.first_name}${telegram_user.last_name ? ' ' + telegram_user.last_name : ''}`,
        telegram_user.username
      )
      return NextResponse.json({ profile })
    }

    if (!init_data) {
      return NextResponse.json({ error: 'Missing init_data' }, { status: 400 })
    }

    const verified = verifyTelegramInitData(init_data, process.env.TELEGRAM_BOT_TOKEN!)
    if (!verified) {
      return NextResponse.json({ error: 'Invalid init_data' }, { status: 401 })
    }

    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('telegram_id', telegram_user.id)
      .single()

    if (existingProfile) {
      return NextResponse.json({ profile: existingProfile })
    }

    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: `tg_${telegram_user.id}@zdis.app`,
      email_confirm: true,
      user_metadata: {
        telegram_id: telegram_user.id,
        username: telegram_user.username,
        display_name: `${telegram_user.first_name}${telegram_user.last_name ? ' ' + telegram_user.last_name : ''}`,
      },
    })

    if (createUserError) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    const { data: profile, error: createProfileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.user.id,
        telegram_id: telegram_user.id,
        username: telegram_user.username,
        display_name: `${telegram_user.first_name}${telegram_user.last_name ? ' ' + telegram_user.last_name : ''}`,
        avatar_url: telegram_user.photo_url,
        is_verified: false,
        rating: 5.0,
        walk_count: 0,
      })
      .select()
      .single()

    if (createProfileError) {
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
