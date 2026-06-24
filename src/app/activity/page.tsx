'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/hooks/useAuthStore'
import { Check, X, MessageCircle, Users, MapPin, Clock } from 'lucide-react'
import { WALK_FORMATS } from '@/lib/constants'

interface WalkCard {
  id: string
  title: string
  format: string
  district: string | null
  status: string
  current_count: number
  max_people: number
  scheduled_at: string
  creator_name?: string
  participants?: { user_id: string; status: string; profile: { display_name: string } | null }[]
}

export default function ActivityPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const supabase = createClient()
  const [data, setData] = useState<{ active: WalkCard[]; requests: WalkCard[]; mine: WalkCard[]; history: WalkCard[] }>({ active: [], requests: [], mine: [], history: [] })
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    if (!user) { setLoading(false); return }

    const { data: myWalks } = await supabase
      .from('walks')
      .select('*, creator:profiles!walks_creator_id_fkey(display_name)')
      .or(`creator_id.eq.${user.id},and(status.eq.active,walk_participants.user_id.eq.${user.id})`)
      .order('created_at', { ascending: false })

    if (!myWalks) { setLoading(false); return }

    const active: WalkCard[] = []
    const requests: WalkCard[] = []
    const mine: WalkCard[] = []
    const history: WalkCard[] = []

    for (const w of myWalks as any[]) {
      const card: WalkCard = { id: w.id, title: w.title, format: w.format, district: w.district, status: w.status, current_count: w.current_count, max_people: w.max_people, scheduled_at: w.scheduled_at, creator_name: w.creator?.display_name }

      if (w.status === 'active') active.push(card)
      else if (w.status === 'completed') history.push(card)
      else if (w.creator_id === user.id && w.status === 'open') mine.push(card)
    }

    if (mine.length > 0) {
      const { data: reqs } = await supabase
        .from('walk_participants')
        .select('walk_id, user_id, status, profile:profiles(display_name)')
        .in('walk_id', mine.map(w => w.id))
        .eq('status', 'pending')

      if (reqs) {
        const walkReqs = new Map<string, any[]>()
        reqs.forEach(r => {
          if (!walkReqs.has(r.walk_id)) walkReqs.set(r.walk_id, [])
          walkReqs.get(r.walk_id)!.push(r)
        })
        for (const w of mine) {
          const r = walkReqs.get(w.id)
          if (r) requests.push({ ...w, participants: r })
        }
      }
    }

    setData({ active, requests, mine, history })
    setLoading(false)
  }

  useEffect(() => {
    if (!user) { setLoading(false); return }
    fetchAll()

    const channel = supabase.channel('activity-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'walk_participants' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'walks' }, fetchAll)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  const handleRespond = async (walkId: string, action: string) => {
    await fetch(`/api/walks/${walkId}/respond`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
  }

  if (loading) return <div className="p-4"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mt-20" /></div>

  return (
    <div className="p-4 pb-24 space-y-6">
      <h1 className="text-2xl font-bold">Активность</h1>

      {data.active.length > 0 && <Section title="Активные прогулки" count={data.active.length} children={data.active.map(w => <WalkCard key={w.id} walk={w} onChat={() => router.push(`/chats/${w.id}`)} />)} />}
      {data.requests.length > 0 && <Section title="Заявки" count={data.requests.length} children={data.requests.map(w => <RequestCard key={w.id} walk={w} onRespond={handleRespond} />)} />}
      {data.mine.length > 0 && <Section title="Мои прогулки" count={data.mine.length} children={data.mine.map(w => <WalkCard key={w.id} walk={w} />)} />}
      {data.history.length > 0 && <Section title="История" count={data.history.length} children={data.history.map(w => <WalkCard key={w.id} walk={w} isHistory />)} />}

      {!data.active.length && !data.requests.length && !data.mine.length && !data.history.length && (
        <div className="bg-gray-50 rounded-xl p-8 text-center mt-8">
          <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 font-medium">Пока ничего нет</p>
          <p className="text-sm text-gray-400 mt-1">Создайте прогулку на карте или откликнитесь на чужую</p>
        </div>
      )}
    </div>
  )
}

function Section({ title, count, children }: { title: string; count: number; children: any }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{count}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function WalkCard({ walk, onChat, isHistory }: { walk: WalkCard; onChat?: () => void; isHistory?: boolean }) {
  const fmt = WALK_FORMATS[walk.format as keyof typeof WALK_FORMATS]
  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{fmt?.emoji || '🚶'}</span>
            <h3 className="font-semibold truncate">{walk.title}</h3>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
            {walk.district && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{walk.district}</span>}
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(walk.scheduled_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
            <span>{walk.current_count}/{walk.max_people}</span>
          </div>
          {walk.creator_name && !isHistory && <p className="text-xs text-gray-400 mt-1">Создатель: {walk.creator_name}</p>}
        </div>
        {onChat && (
          <button onClick={onChat} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 ml-2 flex-shrink-0">
            <MessageCircle className="w-5 h-5" />
          </button>
        )}
        {isHistory && <span className="text-xs text-gray-400 flex-shrink-0">Завершена</span>}
      </div>
    </div>
  )
}

function RequestCard({ walk, onRespond }: { walk: WalkCard; onRespond: (id: string, action: string) => void }) {
  return (
    <div className="bg-white border border-amber-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{WALK_FORMATS[walk.format as keyof typeof WALK_FORMATS]?.emoji || '🚶'}</span>
          <h3 className="font-semibold">{walk.title}</h3>
        </div>
      </div>
      <div className="space-y-2">
        {walk.participants?.map(p => (
          <div key={p.user_id} className="flex items-center justify-between bg-amber-50 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-amber-200 flex items-center justify-center text-sm font-medium text-amber-700">
                {p.profile?.display_name?.[0] || '?'}
              </div>
              <span className="font-medium text-sm">{p.profile?.display_name || 'Пользователь'}</span>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => onRespond(walk.id, 'accepted')} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><Check className="w-4 h-4" /></button>
              <button onClick={() => onRespond(walk.id, 'declined')} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><X className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
