import crypto from 'crypto'

interface TelegramInitData {
  user?: {
    id: number
    first_name: string
    last_name?: string
    username?: string
    photo_url?: string
  }
  auth_date: number
  hash: string
}

export function verifyTelegramInitData(initData: string, botToken: string): TelegramInitData | null {
  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) return null

    const checkString = Array.from(params.entries())
      .filter(([key]) => key !== 'hash')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest()

    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(checkString)
      .digest('hex')

    if (computedHash !== hash) return null

    const authDate = parseInt(params.get('auth_date') || '0')
    const now = Math.floor(Date.now() / 1000)
    if (now - authDate > 86400) return null

    const userParam = params.get('user')
    const user = userParam ? JSON.parse(userParam) : undefined

    return {
      user,
      auth_date: authDate,
      hash,
    }
  } catch {
    return null
  }
}
