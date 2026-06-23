'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWalkStore } from '@/hooks/useWalkStore'
import { useAuthStore } from '@/hooks/useAuthStore'
import { createClient } from '@/lib/supabase/client'
import { WALK_FORMATS } from '@/lib/constants'
import type { WalkFormat } from '@/types'
import { ArrowLeft, MapPin, Clock, Users } from 'lucide-react'
import Link from 'next/link'

export default function CreateWalkPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { userLocation, addWalk } = useWalkStore()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [format, setFormat] = useState<WalkFormat>('walk')
  const [district, setDistrict] = useState('')
  const [maxPeople, setMaxPeople] = useState(3)
  const [scheduledAt, setScheduledAt] = useState('now')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !userLocation) return

    setIsSubmitting(true)

    const supabase = createClient()
    const scheduledTime = scheduledAt === 'now'
      ? new Date().toISOString()
      : new Date(Date.now() + 30 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('walks')
      .insert({
        creator_id: user.id,
        title,
        description: description || null,
        format,
        district: district || null,
        location: `POINT(${userLocation.lng} ${userLocation.lat})`,
        max_people: maxPeople,
        scheduled_at: scheduledTime,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create walk:', error)
      setIsSubmitting(false)
      return
    }

    await supabase.from('walk_participants').insert({
      walk_id: data.id,
      user_id: user.id,
      role: 'creator',
      status: 'accepted',
      liveness_verified: true,
    })

    addWalk(data)
    router.push('/')
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold">Создать прогулку</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Название</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Прогулка по парку"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Описание (необязательно)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Что будем делать?"
            rows={3}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Формат</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(WALK_FORMATS).map(([key, { label, emoji }]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFormat(key as WalkFormat)}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  format === key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{emoji}</div>
                <div className="text-sm">{label}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Район
          </label>
          <input
            type="text"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="Центр, Арбат..."
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            <Users className="w-4 h-4 inline mr-1" />
            Максимум людей: {maxPeople}
          </label>
          <input
            type="range"
            min="2"
            max="10"
            value={maxPeople}
            onChange={(e) => setMaxPeople(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>2</span>
            <span>10</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            Когда
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setScheduledAt('now')}
              className={`p-3 rounded-lg border-2 transition-colors ${
                scheduledAt === 'now'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              Сейчас
            </button>
            <button
              type="button"
              onClick={() => setScheduledAt('soon')}
              className={`p-3 rounded-lg border-2 transition-colors ${
                scheduledAt === 'soon'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              Через 30 мин
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !title}
          className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Создание...' : 'Создать прогулку'}
        </button>
      </form>
    </div>
  )
}
