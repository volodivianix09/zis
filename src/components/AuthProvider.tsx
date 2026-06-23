'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/hooks/useAuthStore'
import { useTelegram } from '@/lib/telegram/useTelegram'
import { createClient } from '@/lib/supabase/client'

const IS_LOCAL = typeof window !== 'undefined' && window.location.hostname === 'localhost'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: tgUser, isReady } = useTelegram()
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    if (!isReady && !IS_LOCAL) return

    const initAuth = async () => {
      if (IS_LOCAL) {
        const existing = localStorage.getItem('zis_local_user')
        if (existing) {
          setUser(JSON.parse(existing))
          return
        }

        const res = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegram_user: {
              id: 99999,
              first_name: 'Тестовый',
              last_name: 'Пользователь',
              username: 'test_user',
            },
          }),
        })

        if (res.ok) {
          const { profile } = await res.json()
          localStorage.setItem('zis_local_user', JSON.stringify(profile))
          setUser(profile)
        }
        return
      }

      const supabase = createClient()

      if (tgUser) {
        const response = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegram_user: tgUser,
            init_data: window.Telegram?.WebApp.initData,
          }),
        })

        if (response.ok) {
          const { profile } = await response.json()
          setUser(profile)
        } else {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    initAuth()
  }, [isReady, tgUser, setUser, setLoading])

  return <>{children}</>
}
