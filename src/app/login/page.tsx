'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, Lock, ExternalLink } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Здесь и сейчас</h1>
          <p className="text-gray-500">Найди компанию для прогулки</p>
        </div>

        {!isTelegram && (
          <a
            href="https://t.me/here_n_now_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full bg-blue-600 text-white rounded-xl py-3.5 font-medium mb-4 hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
            Войти через Telegram
          </a>
        )}

        {isTelegram && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-center">
            <p className="text-blue-700 text-sm">Вы в Telegram Mini App</p>
            <p className="text-blue-600 text-xs mt-1">Авторизация через Telegram работает автоматически</p>
          </div>
        )}

        {!isTelegram && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-300" />
              <span className="text-sm text-gray-400">или</span>
              <div className="flex-1 h-px bg-gray-300" />
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Пароль</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Не менее 6 символов"
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white rounded-xl py-3.5 font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Загрузка...' : 'Войти / Зарегистрироваться'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
