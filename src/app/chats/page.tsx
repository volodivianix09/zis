'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Check, CheckCheck, MapPin } from 'lucide-react'
import { WALK_FORMATS } from '@/lib/constants'

interface ChatPreview {
  id: string
  name: string
  avatar: string
  lastMessage: string
  time: string
  unread: number
  online: boolean
  format: string
  location: string
  isGroup: boolean
  isRead: boolean
}

const MOCK_CHATS: ChatPreview[] = [
  { id: 'mock-1', name: 'Анна', avatar: 'А', lastMessage: 'Я уже на месте, ты где?', time: '12:45', unread: 2, online: true, format: 'walk', location: 'Патриаршие пруды', isGroup: false, isRead: false },
  { id: 'mock-2', name: 'Михаил, Елена', avatar: 'М', lastMessage: 'Отличный кофе, спасибо!', time: '12:30', unread: 0, online: true, format: 'coffee', location: 'Чистые пруды', isGroup: true, isRead: true },
  { id: 'mock-3', name: 'Дмитрий', avatar: 'Д', lastMessage: 'Форма любая, главное — настроение 🔥', time: '11:50', unread: 1, online: false, format: 'sport', location: 'Сокольники', isGroup: false, isRead: false },
  { id: 'mock-4', name: 'Сергей', avatar: 'С', lastMessage: 'Встречаемся у главного входа в 15:00', time: '10:15', unread: 0, online: true, format: 'culture', location: 'Парк Горького', isGroup: false, isRead: true },
  { id: 'mock-5', name: 'Илья, Марина', avatar: 'И', lastMessage: 'Я уже тут, столик на четверых', time: '09:20', unread: 3, online: false, format: 'food', location: 'Старый Арбат', isGroup: true, isRead: false },
  { id: 'mock-6', name: 'Ольга', avatar: 'О', lastMessage: 'Бежим в 7 утра?', time: 'Вчера', unread: 0, online: false, format: 'sport', location: 'Крымская наб.', isGroup: false, isRead: true },
  { id: 'mock-7', name: 'Екатерина', avatar: 'Е', lastMessage: 'Я заказала ещё пиццу 🍕', time: 'Вчера', unread: 0, online: false, format: 'food', location: 'Пятницкая', isGroup: false, isRead: true },
  { id: 'mock-8', name: 'Алиса', avatar: 'А', lastMessage: 'После кино зайдём в бар?', time: 'Пн', unread: 0, online: false, format: 'culture', location: 'Арбатская', isGroup: false, isRead: true },
]

export default function ChatsPage() {
  const router = useRouter()
  const [chats] = useState(MOCK_CHATS)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const filtered = filter === 'unread' ? chats.filter(c => c.unread > 0) : chats
  const unreadTotal = chats.reduce((s, c) => s + c.unread, 0)

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Чаты</h1>
          {unreadTotal > 0 && (
            <span className="text-xs text-gray-500">{unreadTotal} непрочитанных</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Все
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Непрочитанные
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <MessageCircle className="w-14 h-14 text-gray-200 mb-4" />
          <p className="text-gray-600 font-medium text-lg mb-1">Нет чатов</p>
          <p className="text-sm text-gray-400">Найдите прогулку в свайпе или на карте</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {filtered.map((chat) => {
            const fmt = WALK_FORMATS[chat.format as keyof typeof WALK_FORMATS]
            return (
              <button
                key={chat.id}
                onClick={() => router.push(`/chats/${chat.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50"
              >
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg ${chat.isGroup ? 'bg-indigo-500' : 'bg-blue-500'}`}>
                    {chat.isGroup ? (
                      <span className="text-sm">{chat.avatar}</span>
                    ) : (
                      chat.avatar
                    )}
                  </div>
                  {chat.online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-medium text-sm truncate">{chat.name}</span>
                    <span className="text-xs text-gray-400 ml-2 shrink-0">{chat.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 min-w-0 mr-2">
                      {chat.isRead && !chat.isGroup && (
                        <CheckCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      )}
                      {chat.isRead && chat.isGroup && (
                        <Check className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      )}
                      <span className={`text-sm truncate ${chat.unread > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                        {chat.lastMessage}
                      </span>
                    </div>
                    {chat.unread > 0 && (
                      <span className="shrink-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">{fmt?.emoji} {fmt?.label}</span>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-gray-400 flex items-center gap-0.5">
                      <MapPin className="w-3 h-3" /> {chat.location}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
