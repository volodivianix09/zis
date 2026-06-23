'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Database, Users, Route, MessageCircle, Shield, Activity, Wrench, Bug, FlaskConical, Server } from 'lucide-react'

interface DevStats {
  profiles: number
  walks: number
  messages: number
  active_walks: number
  pending_requests: number
  supabase_connected: boolean
}

export default function DevPage() {
  const [stats, setStats] = useState<DevStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dev/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const cards = [
    { href: '/dev/db', label: 'База данных', icon: Database, desc: 'Просмотр и редактирование таблиц', color: 'bg-blue-500' },
    { href: '/dev/walks', label: 'Прогулки', icon: Route, desc: 'Управление прогулками, тестовые данные', color: 'bg-green-500' },
    { href: '/dev/api', label: 'API', icon: Wrench, desc: 'Тестирование endpoint-ов', color: 'bg-purple-500' },
    { href: '/dev/users', label: 'Пользователи', icon: Users, desc: 'Поиск и просмотр', color: 'bg-orange-500' },
    { href: '/dev/liveness', label: 'Liveness', icon: Shield, desc: 'Тестирование проверки', color: 'bg-red-500' },
    { href: '/dev/matching', label: 'Matching', icon: Activity, desc: 'Скоринг и ранжирование', color: 'bg-indigo-500' },
    { href: '/dev/chats', label: 'Чаты', icon: MessageCircle, desc: 'Просмотр сообщений', color: 'bg-pink-500' },
    { href: '/dev/features', label: 'Feature Flags', icon: FlaskConical, desc: 'Управление фичами', color: 'bg-teal-500' },
  ]

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Bug className="w-6 h-6 text-yellow-500" />
        <h1 className="text-2xl font-bold">Dev Panel</h1>
        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">DEV MODE</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Server className="w-6 h-6 animate-pulse text-gray-400" />
          <span className="ml-2 text-gray-500">Загрузка...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">Ошибка подключения: {error}</p>
          <p className="text-red-500 text-sm mt-1">Проверь Supabase credentials в .env.local</p>
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          <MetricCard label="Пользователи" value={stats.profiles} color="text-blue-600" />
          <MetricCard label="Прогулки" value={stats.walks} color="text-green-600" />
          <MetricCard label="Сообщения" value={stats.messages} color="text-purple-600" />
          <MetricCard label="Активных прогулок" value={stats.active_walks} color="text-orange-600" />
          <MetricCard label="Ожидают" value={stats.pending_requests} color="text-yellow-600" />
          <MetricCard
            label="Supabase"
            value={stats.supabase_connected ? '✅' : '❌'}
            color={stats.supabase_connected ? 'text-green-600' : 'text-red-600'}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {cards.map(card => (
          <Link
            key={card.href}
            href={card.href}
            className="block p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
          >
            <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold">{card.label}</h3>
            <p className="text-sm text-gray-500 mt-1">{card.desc}</p>
          </Link>
        ))}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">⚡ Быстрые действия</h3>
        <div className="flex flex-wrap gap-2">
          <QuickAction label="Создать тестовую прогулку" endpoint="/api/dev/walks/mock" method="POST" />
          <QuickAction label="Завершить просроченные" endpoint="/api/dev/walks/expire" method="POST" />
          <QuickAction label="Очистить историю" endpoint="/api/dev/walks/cleanup" method="DELETE" />
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  )
}

function QuickAction({ label, endpoint, method }: { label: string; endpoint: string; method: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={async () => {
        await fetch(endpoint, { method })
        setDone(true)
        setTimeout(() => setDone(false), 2000)
      }}
      className={`px-3 py-1.5 rounded text-sm border transition-colors ${
        done ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-300'
      }`}
    >
      {done ? '✅ Готово' : label}
    </button>
  )
}
