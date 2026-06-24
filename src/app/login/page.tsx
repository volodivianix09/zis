'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTelegram } from '@/lib/telegram/useTelegram'
import { LogIn, Mail, Lock, ExternalLink, CheckCircle, Send } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { user: tgUser } = useTelegram()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const isTelegram = typeof window !== 'undefined' && !!window.Telegram?.WebApp

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (authError) {
      if (authError.message.includes('Invalid login')) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: email.split('@')[0] } },
        })
        if (signUpError) {
          setError(signUpError.message)
        } else {
          setError('Проверьте почту для подтверждения регистрации')
        }
      } else {
        setError(authError.message)
      }
    } else {
      router.refresh()
      router.push('/')
    }
    setLoading(false)
  }

  if (isTelegram) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-5 shadow-lg">
            <span className="text-3xl text-white font-bold">
              {tgUser?.first_name?.[0] || '?'}
            </span>
          </div>

          <h1 className="text-2xl font-bold mb-1">
            {tgUser?.first_name || 'Пользователь'}
          </h1>
          {tgUser?.username && (
            <p className="text-gray-500 mb-6">@{tgUser.username}</p>
          )}

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-sm text-green-800">
              Вы авторизованы через Telegram
            </p>
          </div>

          <button
            onClick={() => router.push('/profile')}
            className="w-full bg-blue-600 text-white rounded-xl py-3.5 font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            Перейти в профиль
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-md">
            <Send className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Здесь и сейчас</h1>
          <p className="text-gray-500 mt-1">Найди компанию для прогулки</p>
        </div>

        <a
          href="https://t.me/here_n_now_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full bg-blue-600 text-white rounded-xl py-3.5 font-medium mb-5 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <ExternalLink className="w-5 h-5" />
          Войти через Telegram
        </a>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400">или email</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль (мин. 6 символов)"
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              minLength={6}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white rounded-xl py-3.5 font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Войти / Регистрация
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          Нажимая «Войти», вы соглашаетесь с условиями использования
        </p>
      </div>
    </div>
  )
}
