import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const challenges = new Map<string, { action: string; expires: number }>()

export async function POST(request: NextRequest) {
  const actions = ['blink', 'smile', 'turn_left', 'turn_right', 'look_up', 'look_down']
  const action = actions[Math.floor(Math.random() * actions.length)]
  const challengeId = crypto.randomUUID()
  const expires = Date.now() + 30000

  challenges.set(challengeId, { action, expires })

  setTimeout(() => challenges.delete(challengeId), 30000)

  return NextResponse.json({
    challenge_id: challengeId,
    action,
    expires_at: new Date(expires).toISOString(),
  })
}
