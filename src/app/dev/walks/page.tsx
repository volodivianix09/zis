'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, RefreshCw } from 'lucide-react'

export default function DevWalksPage() {
  const [refreshing, setRefreshing] = useState(false)

  const mockFormats = ['walk', 'coffee', 'sport', 'food', 'culture'] as const

  const createMock = async (format?: string) => {
    const payload = {
      title: format ? `Тест: ${format}` : `Тестовая прогулка #${Date.now()}`,
      description: 'Создано из Dev Panel',
      format: format || 'walk',
      lat: 55.7558 + (Math.random() - 0.5) * 0.05,
      lng: 37.6173 + (Math.random() - 0.5) * 0.05,
      max_people: Math.floor(Math.random() * 5) + 2,
      scheduled_at: new Date(Date.now() + Math.random() * 3600000).toISOString(),
    }
    await fetch('/api/dev/walks/mock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dev" className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Управление прогулками</h1>
      </div>

      <div className="border rounded-lg p-4 mb-6">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Создать тестовые прогулки
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => createMock()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Случайная
          </button>
          {mockFormats.map(f => (
            <button
              key={f}
              onClick={() => createMock(f)}
              className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
            >
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={async () => {
            for (let i = 0; i < 5; i++) await createMock()
          }}
          className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
        >
          Создать 5 штук
        </button>
      </div>

      <div className="border rounded-lg p-4 mb-6">
        <h2 className="font-semibold mb-3">Массовые операции</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={async () => {
              await fetch('/api/dev/walks/expire', { method: 'POST' })
            }}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700"
          >
            <RefreshCw className="w-4 h-4 inline mr-1" />
            Завершить просроченные
          </button>
          <button
            onClick={async () => {
              if (confirm('Удалить все тестовые прогулки?')) {
                await fetch('/api/dev/walks/cleanup', { method: 'DELETE' })
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4 inline mr-1" />
            Очистить тестовые
          </button>
        </div>
      </div>
    </div>
  )
}
