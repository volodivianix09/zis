'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/hooks/useAuthStore'
import { useWalkStore } from '@/hooks/useWalkStore'
import type { Walk, WalkParticipant } from '@/types'
import { WALK_FORMATS } from '@/lib/constants'
import { Activity, Clock, Calendar, Users, Check, X, MessageCircle, Eye } from 'lucide-react'

interface WalkWithCreator extends Walk {
  creator: { display_name: string; avatar_url: string | null }
}

interface ParticipantWithProfile extends WalkParticipant {
  profile: { display_name: string; avatar_url: string | null }
}

interface WalkWithParticipants extends Walk {
  participants: ParticipantWithProfile[]
  creator: { display_name: string; avatar_url: string | null }
}

export default function ActivityPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const supabase = createClient()

  const [myWalks, setMyWalks] = useState<WalkWithCreator[]>([])
  const [joinedWalks, setJoinedWalks] = useState<WalkWithParticipants[]>([])
  const [incomingRequests, setIncomingRequests] = useState<WalkWithParticipants[]>([])
  const [activeWalks, setActiveWalks] = useState<WalkWithParticipants[]>([])
  const [history, setHistory] = useState<WalkWithCreator[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'requests' | 'my' | 'history'>('active')

  const { setActiveWalk, setSelectedWalk } = useWalkStore()

  useEffect(() => {
    if (!user) { setLoading(false); return }

    const fetchAll = async () => {
      const [myRes, activeRes, historyRes] = await Promise.all([
        supabase.from('walks').select('*, creator:profiles!walks_creator_id_fkey(display_name, avatar_url)').eq('creator_id', user.id).order('created_at', { ascending: false }),
        supabase.from('walks').select('*, creator:profiles!walks_creator_id_fkey(display_name, avatar_url), participants:walk_participants(*, profile:profiles(display_name, avatar_url))').eq('status', 'active'),
        supabase.from('walks').select('*, creator:profiles!walks_creator_id_fkey(display_name, avatar_url)').eq('status', 'completed').order('created_at', { ascending: false }),
      ])

      if (myRes.data) {
        const created = myRes.data.filter((w: any) => w.status !== 'cancelled')
        const activeFromCreated = created.filter((w: any) => w.status === 'active')
        setMyWalks(created.filter((w: any) => w.status === 'open' || w.status === 'matching'))
        setActiveWalks(prev => [...prev, ...activeFromCreated])

        const pending = created.filter((w: Walk) => w.status === 'open')
        if (pending.length > 0) {
          const pendingIds = pending.map(w => w.id)
          const { data: reqs } = await supabase
            .from('walk_participants')
            .select('walk_id, user_id, status, joined_at, role, liveness_verified, profile:profiles(display_name, avatar_url)')
            .in('walk_id', pendingIds)
            .eq('status', 'pending')

          if (reqs) {
            const walkMap = new Map(created.map(w => [w.id, w]))
            const withReqs = pending
              .filter(w => reqs.some(r => r.walk_id === w.id))
              .map(w => ({ ...w, participants: reqs.filter(r => r.walk_id === w.id) }))
            setIncomingRequests(withReqs as any)
          }
        }
      }

      if (activeRes.data) {
        setActiveWalks(prev => {
          const ids = new Set(prev.map(w => w.id))
          const newOnes = activeRes.data.filter((w: any) => !ids.has(w.id))
          return [...prev, ...newOnes]
        })
      }

      if (historyRes.data) setHistory(historyRes.data as any)
      setLoading(false)
    }

    fetchAll()

    const channel = supabase.channel('activity-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'walk_participants' }, () => { fetchAll() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'walks' }, () => { fetchAll() })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  const handleRespond = async (walkId: string, action: 'accepted' | 'declined') => {
    await fetch(`/api/walks/${walkId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
  }

  const openChat = (walkId: string) => {
    router.push(`/chats/${walkId}`)
  }

  if (loading) {
    return <div className="p-4"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mt-20" /></div>
  }

  const tabs = [
    { key: 'active', label: 'Активные', count: activeWalks.length },
    { key: 'requests', label: 'Заявки', count: incomingRequests.length },
    { key: 'my', label: 'Мои', count: myWalks.length },
    { key: 'history', label: 'История', count: history.length },
  ] as const

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Активность</h1>

      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.key ? 'bg-white shadow-sm font-medium' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
              }`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'active' && (
        activeWalks.length === 0 ? <EmptyState icon={Activity} text="Нет активных встреч" sub="После принятия заявки прогулка появится здесь" /> :
        <div className="space-y-3">
          {activeWalks.map(walk => (
            <WalkCard key={walk.id} walk={walk} onChat={openChat} showChat />
          ))}
        </div>
      )}

      {activeTab === 'requests' && (
        incomingRequests.length === 0 ? <EmptyState icon={Clock} text="Нет входящих заявок" sub="Когда кто-то откликнется на вашу прогулку, вы увидите это здесь" /> :
        <div className="space-y-3">
          {incomingRequests.map(walk => (
            <div key={walk.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{walk.title}</h3>
                <span className="text-xs text-gray-500">{WALK_FORMATS[walk.format as keyof typeof WALK_FORMATS]?.label || walk.format}</span>
              </div>
              <div className="space-y-2">
                {walk.participants?.filter(p => p.status === 'pending').map(p => (
                  <div key={p.user_id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                        {p.profile?.display_name?.[0] || '?'}
                      </div>
                      <span className="text-sm font-medium">{p.profile?.display_name || 'Неизвестно'}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleRespond(walk.id, 'accepted')} className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleRespond(walk.id, 'declined')} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'my' && (
        myWalks.length === 0 ? <EmptyState icon={Calendar} text="Нет активных прогулок" sub="Создайте прогулку на карте" /> :
        <div className="space-y-3">
          {myWalks.map(walk => (
            <WalkCard key={walk.id} walk={walk} />
          ))}
        </div>
      )}

      {activeTab === 'history' && (
        history.length === 0 ? <EmptyState icon={Users} text="История пуста" sub="Завершённые прогулки будут здесь" /> :
        <div className="space-y-3">
          {history.map(walk => (
            <WalkCard key={walk.id} walk={walk} isHistory />
          ))}
        </div>
      )}
    </div>
  )
}

function WalkCard({ walk, onChat, showChat, isHistory }: {
  walk: any
  onChat?: (id: string) => void
  showChat?: boolean
  isHistory?: boolean
}) {
  const format = WALK_FORMATS[walk.format as keyof typeof WALK_FORMATS]
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{walk.title}</h3>
            {format && <span className="text-sm">{format.emoji}</span>}
          </div>
          {walk.district && <p className="text-sm text-gray-500 mt-0.5">{walk.district}</p>}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span>{walk.current_count}/{walk.max_people} чел</span>
            <span>{new Date(walk.scheduled_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              walk.status === 'open' ? 'bg-green-100 text-green-700' :
              walk.status === 'active' ? 'bg-blue-100 text-blue-700' :
              walk.status === 'completed' ? 'bg-gray-100 text-gray-500' : ''
            }`}>{walk.status}</span>
          </div>
          {walk.creator && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
              <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px]">
                {walk.creator.display_name?.[0] || '?'}
              </div>
              {walk.creator.display_name}
            </div>
          )}
        </div>
        {showChat && onChat && (
          <button onClick={() => onChat(walk.id)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 ml-2">
            <MessageCircle className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, text, sub }: { icon: any; text: string; sub: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-8 text-center">
      <Icon className="w-10 h-10 mx-auto text-gray-300 mb-3" />
      <p className="text-gray-600 font-medium">{text}</p>
      <p className="text-sm text-gray-400 mt-1">{sub}</p>
    </div>
  )
}
