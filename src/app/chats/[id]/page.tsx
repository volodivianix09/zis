'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Send, MapPin, MoreVertical, Calendar, Users, Check, CheckCheck } from 'lucide-react'
import { WALK_FORMATS } from '@/lib/constants'

interface ChatMessage {
  id: string
  content: string
  time: string
  isOwn: boolean
  read: boolean
}

interface WalkInfo {
  title: string
  format: string
  district: string
  time: string
  participants: { name: string; initial: string }[]
}

const WALK_INFO: Record<string, WalkInfo> = {
  'mock-1': { title: 'Вечерняя прогулка по Патрикам', format: 'walk', district: 'Патриаршие пруды', time: '19:00', participants: [{ name: 'Анна', initial: 'А' }, { name: 'Вы', initial: 'Я' }] },
  'mock-2': { title: 'Кофе в Чернышевском', format: 'coffee', district: 'Чистые пруды', time: '16:00', participants: [{ name: 'Михаил', initial: 'М' }, { name: 'Елена', initial: 'Е' }, { name: 'Вы', initial: 'Я' }] },
  'mock-3': { title: 'Футбол в Сокольниках', format: 'sport', district: 'Сокольники', time: '14:30', participants: [{ name: 'Дмитрий', initial: 'Д' }, { name: 'Алексей', initial: 'А' }, { name: 'Вы', initial: 'Я' }] },
  'mock-4': { title: 'Выставка в Музеоне', format: 'culture', district: 'Парк Горького', time: '15:00', participants: [{ name: 'Сергей', initial: 'С' }, { name: 'Вы', initial: 'Я' }] },
  'mock-5': { title: 'Китайская лапша на Арбате', format: 'food', district: 'Старый Арбат', time: '20:00', participants: [{ name: 'Илья', initial: 'И' }, { name: 'Марина', initial: 'М' }, { name: 'Вы', initial: 'Я' }] },
  'mock-6': { title: 'Пробежка по набережной', format: 'sport', district: 'Крымская наб.', time: '07:00', participants: [{ name: 'Ольга', initial: 'О' }, { name: 'Вы', initial: 'Я' }] },
  'mock-7': { title: 'Пицца на Пятницкой', format: 'food', district: 'Пятницкая', time: '19:30', participants: [{ name: 'Екатерина', initial: 'Е' }, { name: 'Вы', initial: 'Я' }] },
  'mock-8': { title: 'Кино в Художественном', format: 'culture', district: 'Арбатская', time: '21:00', participants: [{ name: 'Алиса', initial: 'А' }, { name: 'Вы', initial: 'Я' }] },
}

const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  'mock-1': [
    { id: 'm1', content: 'Привет! Ты уже вышла?', time: '12:30', isOwn: true, read: true },
    { id: 'm2', content: 'Да, я уже около Патриков', time: '12:35', isOwn: false, read: true },
    { id: 'm3', content: 'Отлично, я буду через 5 минут', time: '12:36', isOwn: true, read: true },
    { id: 'm4', content: 'Я на месте, ты где?', time: '12:45', isOwn: false, read: false },
  ],
  'mock-2': [
    { id: 'm2-1', content: 'Ребята, я уже в кофейне', time: '15:45', isOwn: false, read: true },
    { id: 'm2-2', content: 'Я буду через 10 минут', time: '15:48', isOwn: true, read: true },
    { id: 'm2-3', content: 'Я тоже скоро подойду', time: '15:50', isOwn: false, read: true },
    { id: 'm2-4', content: 'Отличный кофе, спасибо за рекомендацию!', time: '16:30', isOwn: false, read: true },
  ],
  'mock-3': [
    { id: 'm3-1', content: 'Народ, собираемся на поле у входа в парк', time: '14:00', isOwn: false, read: true },
    { id: 'm3-2', content: 'Я уже разминаюсь', time: '14:05', isOwn: false, read: true },
    { id: 'm3-3', content: 'Форма любая, главное — настроение 🔥', time: '14:10', isOwn: false, read: false },
  ],
  'mock-4': [
    { id: 'm4-1', content: 'Кто уже на месте?', time: '14:30', isOwn: true, read: true },
    { id: 'm4-2', content: 'Я подхожу, буду через 5 минут', time: '14:35', isOwn: false, read: true },
    { id: 'm4-3', content: 'Встречаемся у главного входа в 15:00', time: '14:40', isOwn: false, read: true },
  ],
  'mock-5': [
    { id: 'm5-1', content: 'Заказали уже?', time: '19:50', isOwn: true, read: true },
    { id: 'm5-2', content: 'Ждём вас!', time: '19:55', isOwn: false, read: true },
    { id: 'm5-3', content: 'Я уже тут, столик на четверых', time: '20:00', isOwn: false, read: false },
    { id: 'm5-4', content: 'Сейчас будем', time: '20:02', isOwn: true, read: true },
  ],
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const walkId = params.id as string
  const walkInfo = WALK_INFO[walkId]
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES[walkId] || [])
  const [newMessage, setNewMessage] = useState('')
  const [showInfo, setShowInfo] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      content: newMessage.trim(),
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
      read: false,
    }
    setMessages((prev) => [...prev, msg])
    setNewMessage('')

    setTimeout(() => {
      const replies: Record<string, string> = {
        'mock-1': 'Отлично, жду!',
        'mock-2': 'Супер!',
      }
      const reply = replies[walkId]
      if (reply) {
        setMessages((prev) => [...prev, {
          id: `reply-${Date.now()}`,
          content: reply,
          time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          isOwn: false,
          read: false,
        }])
      }
    }, 2000)
  }

  const fmt = walkInfo ? WALK_FORMATS[walkInfo.format as keyof typeof WALK_FORMATS] : null

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex items-center gap-2 px-2 py-2 bg-white border-b">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {walkInfo && (
          <button className="flex-1 flex items-center gap-3 min-w-0 text-left" onClick={() => setShowInfo(!showInfo)}>
            <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold shrink-0">
              {walkInfo.participants.find(p => p.name !== 'Вы')?.initial || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{walkInfo.title}</p>
              <p className="text-xs text-gray-500">{fmt?.emoji} {fmt?.label} • {walkInfo.district}</p>
            </div>
          </button>
        )}
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {showInfo && walkInfo && (
        <div className="bg-white border-b px-4 py-3 animate-fadeIn">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Calendar className="w-4 h-4" /> Сегодня в {walkInfo.time}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <MapPin className="w-4 h-4" /> {walkInfo.district}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <div className="flex gap-1">
              {walkInfo.participants.map((p, i) => (
                <span key={i} className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {messages.map((msg, i) => {
          const showTime = i === 0 || messages[i - 1].time !== msg.time
          return (
            <div key={msg.id}>
              {showTime && (
                <div className="flex justify-center my-2">
                  <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{msg.time}</span>
                </div>
              )}
              <div className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
                <div className={`max-w-[80%] px-3.5 py-2 ${
                  msg.isOwn
                    ? 'bg-blue-600 text-white rounded-2xl rounded-br-md'
                    : 'bg-white text-gray-900 rounded-2xl rounded-bl-md shadow-sm border border-gray-100'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  {msg.isOwn && (
                    <div className="flex items-center justify-end gap-0.5 mt-0.5">
                      {msg.read ? (
                        <CheckCheck className="w-3.5 h-3.5 text-blue-200" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-blue-200" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 bg-white border-t">
        <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-1.5">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Сообщение..."
            className="flex-1 bg-transparent py-2 text-sm focus:outline-none"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white disabled:bg-gray-300 shrink-0 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
