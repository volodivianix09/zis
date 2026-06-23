import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const { challenge_id, score, device_fingerprint, timing_ms } = await request.json()

  if (!challenge_id || score === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (timing_ms < 1000 || timing_ms > 15000) {
    return NextResponse.json({
      passed: false,
      reason: 'Invalid timing',
    })
  }

  if (score < 0.6) {
    return NextResponse.json({
      passed: false,
      reason: 'Low liveness score',
    })
  }

  const hash = crypto
    .createHash('sha256')
    .update(`${challenge_id}:${score}:${device_fingerprint}:${timing_ms}`)
    .digest('hex')

  return NextResponse.json({
    passed: true,
    verification_hash: hash,
    score,
  })
}
