'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/hooks/useAuthStore'
import { useTelegram } from '@/lib/telegram/useTelegram'
import { useSettingsStore } from '@/hooks/useSettingsStore'
import { createClient } from '@/lib/supabase/client'
import { SettingsPanel } from './SettingsPanel'
import { Smartphone, Settings } from 'lucide-react'

const IS_LOCAL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
const IS_TELEGRAM = typeof window !== 'undefined' && !!window.Telegram?.WebApp

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: tgUser, isReady } = useTelegram()
  const { setUser, setLoading } = useAuthStore()
  const { theme } = useSettingsStore()
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    const initAuth = async () => {
      const supabase = createClient()

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
            telegram_user: { id: 99999, first_name: 'Тестовый', last_name: 'Пользователь', username: 'test_user' },
          }),
        })
        if (res.ok) {
          const { profile } = await res.json()
          localStorage.setItem('zis_local_user', JSON.stringify(profile))
          setUser(profile)
        }
        return
      }

      if (tgUser) {
        const response = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegram_user: tgUser, init_data: window.Telegram?.WebApp.initData }),
        })
        if (response.ok) {
          const { profile } = await response.json()
          setUser(profile)
          return
        }
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setUser(profile)
          return
        }
      }

      setLoading(false)
    }

    if (isReady) initAuth()
  }, [isReady, tgUser, setUser, setLoading])

  useEffect(() => {
    if (IS_LOCAL) return

    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) setUser(profile)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [setUser])

  return (
    <>
      {children}
      {IS_TELEGRAM && (
        <div className="fixed bottom-20 left-4 right-4 z-40 flex gap-2">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Settings className="w-4 h-4" /> Настройки
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex-1 py-3 bg-white/90 backdrop-blur text-gray-800 rounded-xl text-sm font-medium shadow-lg hover:bg-white transition-colors flex items-center justify-center gap-2"
          >
            <Smartphone className="w-4 h-4" /> На экран домой
          </button>
        </div>
      )}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </>
  )
}
