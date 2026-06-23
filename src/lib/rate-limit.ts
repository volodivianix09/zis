const LIMITS: Record<string, { windowMs: number; maxActions: number }> = {
  create_walk: { windowMs: 3600000, maxActions: 5 },
  join_walk: { windowMs: 3600000, maxActions: 10 },
}

export function getRateLimitConfig(action: string) {
  return LIMITS[action]
}

export async function checkRateLimit(
  userId: string,
  action: string
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const config = LIMITS[action]
  if (!config) return { allowed: true, remaining: Infinity, resetAt: new Date() }

  const { isLocal } = await import('@/lib/db')
  if (isLocal()) {
    const local = await import('@/lib/db/local')
    return local.checkRateLimit(userId, action, config.windowMs, config.maxActions)
  }

  const supabase = await (await import('@/lib/supabase/server')).createClient()
  const since = new Date(Date.now() - config.windowMs).toISOString()

  const { count, error } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', action)
    .gte('created_at', since)

  if (error) {
    console.error('Rate limit error:', error)
    return { allowed: true, remaining: 1, resetAt: new Date() }
  }

  const currentCount = count || 0
  const allowed = currentCount < config.maxActions
  const remaining = Math.max(0, config.maxActions - currentCount)
  const resetAt = new Date(Date.now() + config.windowMs)

  return { allowed, remaining, resetAt }
}

export async function recordAction(userId: string, action: string): Promise<void> {
  const { isLocal } = await import('@/lib/db')
  if (isLocal()) {
    const local = await import('@/lib/db/local')
    local.recordRateAction(userId, action)
    return
  }

  const supabase = await (await import('@/lib/supabase/server')).createClient()
  await supabase.from('rate_limits').insert({
    user_id: userId,
    action,
  })
}
