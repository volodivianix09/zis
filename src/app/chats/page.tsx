'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/hooks/useAuthStore'
import { MessageCircle, User } from 'lucide-react'
import type { Walk, WalkParticipant } from '@/types'

interface ChatWalk extends Walk {
  participants: (WalkParticipant & { profile: { display_name: string; avatar_url: string | null } })[]
  last_message?: { content: string; created_at: string; is_system: boolean }
}

export default function ChatsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [chats, setChats] = useState<ChatWalk[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    const fetchChats = async () => {
      const supabase = createClient()

      const { data: myParticipations } = await supabase
        .from('walk_participants')
        .select('walk_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted')

      if (!myParticipations || myParticipations.length === 0) {
        setLoading(false)
        return
      }

      const walkIds = myParticipations.map(p => p.walk_id)

      const { data: walks } = await supabase
        .from('walks')
        .select('*, participants:walk_participants(*, profile:profiles(display_name, avatar_url))')
        .in('id', walkIds)
        .in('status', ['active', 'matching'])

      if (!walks) { setLoading(false); return }

      const chatList: ChatWalk[] = []

      for (const walk of walks) {
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content, created_at, is_system')
          .eq('walk_id', walk.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        chatList.push({
          ...walk,
          participants: walk.participants,
          last_message: lastMsg || undefined,
        })
      }

      setChats(chatList.sort((a, b) => {
        const aTime = a.last_message?.created_at || a.created_at
        const bTime = b.last_message?.created_at || b.created_at
        return new Date(bTime).getTime() - new Date(aTime).getTime()
      }))
      setLoading(false)
    }

    fetchChats()

    const supabase = createClient()
    const channel = supabase.channel('chats-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, fetchChats)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  const openChat = (walkId: string) => router.push(`/chats/${walkId}`)

  if (loading) {
    return <div className="p-4"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mt-20" /></div>
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Чаты</h1>

      {chats.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <MessageCircle className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 font-medium">Нет активных чатов</p>
          <p className="text-sm text-gray-400 mt-1">
            Чаты появятся после того, как кто-то присоединится к вашей прогулке
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {chats.map(chat => {
            const otherParticipants = chat.participants
              .filter(p => p.user_id !== user?.id && p.status === 'accepted')

            return (
              <button
                key={chat.id}
                onClick={() => openChat(chat.id)}
                className="w-full bg-white border rounded-lg p-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    {otherParticipants.length > 1 ? (
                      <User className="w-5 h-5 text-blue-600" />
                    ) : (
                      <span className="text-sm font-medium text-blue-600">
                        {otherParticipants[0]?.profile?.display_name?.[0] || '?'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate">
                        {otherParticipants.length > 1
                          ? `Группа (${otherParticipants.length + 1})`
                          : otherParticipants[0]?.profile?.display_name || 'Чат прогулки'
                        }
                      </span>
                      {chat.last_message && (
                        <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                          {new Date(chat.last_message.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {chat.last_message?.content || chat.title}
                    </p>
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
