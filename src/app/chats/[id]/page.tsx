'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Search, MoreVertical, Check, CheckCheck, Smile, Paperclip, Mic } from 'lucide-react'

interface ChatMessage {
  id: string
  content: string
  time: Date
  isOwn: boolean
  read: boolean
  delivered: boolean
  isSystem?: boolean
}

interface WalkInfo {
  title: string
  format: string
  online: boolean
}

const WALK_INFO: Record<string, WalkInfo> = {
  'mock-1': { title: 'Анна', format: 'walk', online: true },
  'mock-2': { title: 'Михаил и Елена', format: 'coffee', online: false },
  'mock-3': { title: 'Дмитрий', format: 'sport', online: false },
  'mock-4': { title: 'Сергей', format: 'culture', online: true },
  'mock-5': { title: 'Илья и Марина', format: 'food', online: false },
  'mock-6': { title: 'Ольга', format: 'sport', online: false },
  'mock-7': { title: 'Екатерина', format: 'food', online: true },
  'mock-8': { title: 'Алиса', format: 'culture', online: false },
}

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  'mock-1': [
    { id: 'm1', content: 'Привет! Ты уже вышла?', time: new Date(Date.now() - 900000), isOwn: true, read: true, delivered: true },
    { id: 'm2', content: 'Да, я уже около Патриков', time: new Date(Date.now() - 600000), isOwn: false, read: true, delivered: true },
    { id: 'm3', content: 'Отлично, я буду через 5 минут', time: new Date(Date.now() - 540000), isOwn: true, read: true, delivered: true },
    { id: 'm4', content: 'Я на месте, ты где?', time: new Date(Date.now() - 300000), isOwn: false, read: false, delivered: true },
  ],
  'mock-2': [
    { id: 'm2-1', content: 'Ребята, я уже в кофейне', time: new Date(Date.now() - 3600000), isOwn: false, read: true, delivered: true },
    { id: 'm2-2', content: 'Я буду через 10 минут', time: new Date(Date.now() - 3300000), isOwn: true, read: true, delivered: true },
    { id: 'm2-3', content: 'Я тоже скоро подойду', time: new Date(Date.now() - 3000000), isOwn: false, read: true, delivered: true },
    { id: 'm2-4', content: 'Отличный кофе, спасибо за рекомендацию!', time: new Date(Date.now() - 1800000), isOwn: false, read: true, delivered: true },
  ],
  'mock-3': [
    { id: 'm3-1', content: 'Народ, собираемся на поле у входа в парк', time: new Date(Date.now() - 7200000), isOwn: false, read: true, delivered: true },
    { id: 'm3-2', content: 'Я уже разминаюсь ⚽', time: new Date(Date.now() - 6900000), isOwn: false, read: true, delivered: true },
    { id: 'm3-3', content: 'Форма любая, главное — настроение 🔥', time: new Date(Date.now() - 6600000), isOwn: false, read: false, delivered: true },
  ],
  'mock-4': [
    { id: 'm4-1', content: 'Кто уже на месте?', time: new Date(Date.now() - 14400000), isOwn: true, read: true, delivered: true },
    { id: 'm4-2', content: 'Я подхожу, буду через 5 минут', time: new Date(Date.now() - 13800000), isOwn: false, read: true, delivered: true },
    { id: 'm4-3', content: 'Отлично, встретимся у входа', time: new Date(Date.now() - 13200000), isOwn: true, read: true, delivered: true },
  ],
  'mock-5': [
    { id: 'm5-1', content: 'Заказали уже? 🍕', time: new Date(Date.now() - 25200000), isOwn: true, read: true, delivered: true },
    { id: 'm5-2', content: 'Ждём вас!', time: new Date(Date.now() - 21600000), isOwn: false, read: true, delivered: true },
    { id: 'm5-3', content: 'Я уже тут, столик на четверых', time: new Date(Date.now() - 19800000), isOwn: false, read: false, delivered: true },
    { id: 'm5-4', content: 'Сейчас будем', time: new Date(Date.now() - 18000000), isOwn: true, read: true, delivered: true },
  ],
}

const AUTO_REPLIES: Record<string, string[]> = {
  'mock-1': ['Отлично, жду!', 'Ты где?'],
  'mock-2': ['Супер!', 'Договорились'],
  'mock-3': ['Понял, уже еду'],
  'mock-5': ['Хорошо, ждём'],
}

function formatMsgTime(d: Date) {
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

function formatDateSeparator(d: Date) {
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'Сегодня'
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Вчера'
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const walkId = params.id as string
  const walkInfo = WALK_INFO[walkId]
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES[walkId] || [])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [tappedMsg, setTappedMsg] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const replyIdx = useRef(0)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim()) return
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      content: input.trim(),
      time: new Date(),
      isOwn: true,
      read: false,
      delivered: true,
    }
    setMessages((prev) => [...prev, msg])
    setInput('')
    setTimeout(() => inputRef.current?.focus(), 100)

    const autoReplies = AUTO_REPLIES[walkId]
    if (autoReplies && replyIdx.current < autoReplies.length) {
      const delay = 1500 + Math.random() * 2000
      setTimeout(() => {
        setIsTyping(true)
        setTimeout(() => {
          setIsTyping(false)
          setMessages((prev) => [...prev, {
            id: `reply-${Date.now()}`,
            content: autoReplies[replyIdx.current],
            time: new Date(),
            isOwn: false,
            read: false,
            delivered: true,
          }])
          replyIdx.current++
        }, 1500 + Math.random() * 1000)
      }, delay)
    }
  }, [input, walkId])

  const getAvatar = () => {
    if (!walkInfo?.title) return '?'
    const name = walkInfo.title.replace(' и ', ', ').split(',')[0].trim()
    return name[0].toUpperCase()
  }

  const getOnlineText = () => {
    if (!walkInfo?.online) return 'был(а) недавно'
    const isGroup = walkInfo.title.includes(' и ')
    return isGroup ? '2 участника онлайн' : 'онлайн'
  }

  return (
    <div className="flex flex-col h-screen bg-[#efeae2]">
      <div className="bg-[#f0f2f5] px-3 py-2 flex items-center gap-2 shadow-sm z-10">
        <button onClick={() => router.back()} className="p-1.5 hover:bg-black/5 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-[#54656f]" />
        </button>
        <div className="w-9 h-9 rounded-full bg-[#00a884] flex items-center justify-center text-white font-semibold text-sm shrink-0">
          {getAvatar()}
        </div>
        <div className="flex-1 min-w-0 ml-1">
          <p className="text-sm font-semibold text-[#111b21] truncate">{walkInfo?.title || 'Чат'}</p>
          <p className="text-[11px] text-[#667781]">{isTyping ? 'печатает...' : getOnlineText()}</p>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <Search className="w-5 h-5 text-[#54656f]" />
          </button>
          <button className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5 text-[#54656f]" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5" onClick={() => setTappedMsg(null)}>
        {messages.map((msg, i) => {
          const prev = messages[i - 1]
          const next = messages[i + 1]
          const showDateSep = i === 0 || !isSameDay(msg.time, prev.time)
          const showTime = !next || !isSameDay(msg.time, next.time) || next.isOwn !== msg.isOwn || next.time.getTime() - msg.time.getTime() > 600000
          const isFirstInGroup = !prev || prev.isOwn !== msg.isOwn
          const isLastInGroup = !next || next.isOwn !== msg.isOwn || showTime
          const isTapped = tappedMsg === msg.id

          return (
            <div key={msg.id}>
              {showDateSep && (
                <div className="flex justify-center my-2.5">
                  <span className="text-[11px] text-[#667781] bg-white/80 shadow-sm px-2.5 py-1 rounded-md">
                    {formatDateSeparator(msg.time)}
                  </span>
                </div>
              )}
              <div className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-1.5' : ''}`}>
                <div
                  className="relative group"
                  onClick={(e) => { e.stopPropagation(); setTappedMsg(isTapped ? null : msg.id) }}
                >
                  <div className={[
                    'px-3 py-1.5 text-sm leading-relaxed relative select-none',
                    msg.isOwn
                      ? isLastInGroup
                        ? 'rounded-lg rounded-br-sm'
                        : 'rounded-lg rounded-br-none'
                      : isLastInGroup
                        ? 'rounded-lg rounded-bl-sm'
                        : 'rounded-lg rounded-bl-none',
                    msg.isOwn ? 'bg-[#d9fdd3] text-[#111b21]' : 'bg-white text-[#111b21]',
                    isTapped ? 'shadow-md' : '',
                  ].join(' ')}>
                    {msg.isSystem ? (
                      <p className="text-xs text-gray-500 italic text-center">{msg.content}</p>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap break-words pr-[52px]">{msg.content}</p>
                        <span className="absolute right-1.5 bottom-1 flex items-center gap-0.5 text-[10px] text-[#667781] whitespace-nowrap">
                          {formatMsgTime(msg.time)}
                          {msg.isOwn && (
                            msg.read
                              ? <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                              : msg.delivered
                                ? <CheckCheck className="w-3.5 h-3.5 text-[#54656f]" />
                                : <Check className="w-3.5 h-3.5 text-[#54656f]" />
                          )}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {isTyping && (
          <div className="flex justify-start mt-0.5">
            <div className="bg-white rounded-lg rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="bg-[#f0f2f5] px-3 py-2 pb-4">
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <button type="button" className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <Smile className="w-5 h-5 text-[#54656f]" />
          </button>
          <button type="button" className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <Paperclip className="w-5 h-5 text-[#54656f]" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Сообщение"
            className="flex-1 bg-white px-4 py-2.5 text-sm rounded-lg focus:outline-none shadow-sm"
          />
          {input.trim() ? (
            <button
              type="submit"
              className="p-2 hover:bg-black/5 rounded-full transition-colors"
            >
              <SendIcon className="w-5 h-5 text-[#00a884]" />
            </button>
          ) : (
            <button type="button" className="p-2 hover:bg-black/5 rounded-full transition-colors">
              <Mic className="w-5 h-5 text-[#54656f]" />
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  )
}
