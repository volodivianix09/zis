'use client'

import { useState } from 'react'
import { WALK_FORMATS } from '@/lib/constants'
import { Clock, Users, MapPin, Navigation, X, Heart, Star, Compass } from 'lucide-react'

const MOCK_WALKS = [
  { id: '1', title: 'Вечерняя прогулка по Патрикам', format: 'walk', district: 'Патриаршие пруды', description: 'Пройдёмся от Патриков до Тверской, посмотрим на огни', creator: { display_name: 'Анна', avatar_url: null }, current_count: 1, max_people: 4, scheduled_at: new Date(Date.now() + 7200000).toISOString(), distance_km: 0.8, rating: 4.8 },
  { id: '2', title: 'Кофе в Чернышевском', format: 'coffee', district: 'Чистые пруды', description: 'Открою для вас лучший specialty кофе в городе', creator: { display_name: 'Михаил', avatar_url: null }, current_count: 2, max_people: 4, scheduled_at: new Date(Date.now() + 3600000).toISOString(), distance_km: 0.3, rating: 4.5 },
  { id: '3', title: 'Футбол в «Сокольниках»', format: 'sport', district: 'Сокольники', description: 'Нужен ещё один игрок в мини-футбол, 6 на 6', creator: { display_name: 'Дмитрий', avatar_url: null }, current_count: 3, max_people: 4, scheduled_at: new Date(Date.now() + 10800000).toISOString(), distance_km: 2.1, rating: 4.2 },
  { id: '4', title: 'Пицца на Пятницкой', format: 'food', district: 'Пятницкая', description: 'Новая пиццерия открылась, нужно всё попробовать', creator: { display_name: 'Екатерина', avatar_url: null }, current_count: 1, max_people: 5, scheduled_at: new Date(Date.now() + 5400000).toISOString(), distance_km: 1.2, rating: 4.9 },
  { id: '5', title: 'Выставка в Музеоне', format: 'culture', district: 'Парк Горького', description: 'Бесплатный вход на современную выставку под открытым небом', creator: { display_name: 'Сергей', avatar_url: null }, current_count: 0, max_people: 6, scheduled_at: new Date(Date.now() + 14400000).toISOString(), distance_km: 1.5, rating: 4.6 },
  { id: '6', title: 'Пробежка по набережной', format: 'sport', district: 'Крымская наб.', description: '5 км в комфортном темпе, набережная почти без людей', creator: { display_name: 'Ольга', avatar_url: null }, current_count: 1, max_people: 3, scheduled_at: new Date(Date.now() + 18000000).toISOString(), distance_km: 0.5, rating: 4.7 },
  { id: '7', title: 'Китайская лапша на Арбате', format: 'food', district: 'Старый Арбат', description: 'Нашли новый wok-бар, ищем компанию', creator: { display_name: 'Илья', avatar_url: null }, current_count: 2, max_people: 4, scheduled_at: new Date(Date.now() + 25200000).toISOString(), distance_km: 0.9, rating: 4.3 },
  { id: '8', title: 'Кино в «Художественном»', format: 'culture', district: 'Арбатская', description: 'Поздний сеанс артхауса, после обсудим за бокалом', creator: { display_name: 'Алиса', avatar_url: null }, current_count: 0, max_people: 5, scheduled_at: new Date(Date.now() + 32400000).toISOString(), distance_km: 0.4, rating: 4.8 },
]

const INITIAL = { x: 0, y: 0, rotation: 0 }

export default function SwipePage() {
  const [stack, setStack] = useState(MOCK_WALKS)
  const [current, setCurrent] = useState(0)
  const [drag, setDrag] = useState(INITIAL)
  const [decided, setDecided] = useState<'like' | 'nope' | null>(null)

  const walk = stack[current]

  const handleDrag = (clientX: number) => {
    const x = (clientX - window.innerWidth / 2) * 1.5
    const rotation = x / 20
    setDrag({ x, y: 0, rotation })
    if (x > 80) setDecided('like')
    else if (x < -80) setDecided('nope')
    else setDecided(null)
  }

  const handleEnd = () => {
    if (decided) {
      setCurrent((p) => p + 1)
      setStack((p) => p.slice(1))
    }
    setDrag(INITIAL)
    setDecided(null)
  }

  const swipe = (dir: 'like' | 'nope') => {
    setDecided(dir)
    setTimeout(handleEnd, 200)
  }

  if (!walk) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[70vh]">
        <Compass className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">На сегодня всё</h2>
        <p className="text-gray-500 text-center">Новые прогулки появятся позже</p>
      </div>
    )
  }

  const format = WALK_FORMATS[walk.format as keyof typeof WALK_FORMATS]

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Свайп</h1>
        <span className="text-sm text-gray-500">{stack.length} прогулок</span>
      </div>

      <div
        className="relative w-full aspect-[3/4] mx-auto select-none"
        onMouseMove={(e) => { if (e.buttons === 1) handleDrag(e.clientX) }}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchMove={(e) => handleDrag(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
      >
        {stack.slice(1, 4).reverse().map((w, i) => {
          const scale = 1 - (stack.slice(1, 4).length - i) * 0.03
          const y = (stack.slice(1, 4).length - i) * 6
          return (
            <div
              key={w.id}
              className="absolute inset-0 bg-white rounded-2xl border border-gray-200 shadow"
              style={{ transform: `scale(${scale}) translateY(${y}px)`, zIndex: i }}
            />
          )
        })}

        <div
          className="absolute inset-0 bg-white rounded-2xl border border-gray-200 shadow-lg cursor-grab active:cursor-grabbing overflow-hidden"
          style={{
            transform: `translate(${drag.x}px, ${drag.y}px) rotate(${drag.rotation}deg)`,
            transition: decided ? 'none' : 'transform 0.1s ease',
            zIndex: 10,
          }}
        >
          {drag.x > 50 && (
            <div className="absolute top-6 left-6 z-20 border-4 border-green-500 rounded-xl px-4 py-1.5 -rotate-12">
              <span className="text-green-500 text-xl font-bold">ИДУ</span>
            </div>
          )}
          {drag.x < -50 && (
            <div className="absolute top-6 right-6 z-20 border-4 border-red-500 rounded-xl px-4 py-1.5 rotate-12">
              <span className="text-red-500 text-xl font-bold">МИМО</span>
            </div>
          )}

          <div className="h-32 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-end p-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center text-white text-lg font-bold">
                {walk.creator.display_name[0]}
              </div>
              <span className="text-white font-semibold text-lg">{walk.creator.display_name}</span>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">{walk.title}</h2>
                <span className="text-sm text-gray-500">{format?.emoji} {format?.label}</span>
              </div>
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium text-gray-700">{walk.rating}</span>
              </div>
            </div>

            <p className="text-sm text-gray-600">{walk.description}</p>

            <div className="flex flex-wrap gap-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {walk.district}
              </span>
              <span className="flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5" /> {walk.distance_km < 1 ? `${Math.round(walk.distance_km * 1000)}м` : `${walk.distance_km.toFixed(1)}км`}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {new Date(walk.scheduled_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {walk.current_count}/{walk.max_people}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 mt-6">
        <button
          onClick={() => swipe('nope')}
          className="w-14 h-14 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-red-50 transition-colors"
        >
          <X className="w-7 h-7 text-red-500" />
        </button>
        <button
          onClick={() => swipe('like')}
          className="w-14 h-14 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-green-50 transition-colors"
        >
          <Heart className="w-7 h-7 text-green-500" />
        </button>
      </div>
    </div>
  )
}
