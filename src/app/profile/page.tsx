'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/hooks/useAuthStore'
import { User, Star, Shield, Check, X, LogOut, Smartphone, MapPin, Clock, Calendar, ChevronRight, Camera, Settings, Info } from 'lucide-react'
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
  creator_id: string
  creator_name?: string
}

interface ReviewCard {
  id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer_name?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, logout, setUser } = useAuthStore()
  const supabase = createClient()
  const [editingBio, setEditingBio] = useState(false)
  const [bioText, setBioText] = useState(user?.bio || '')
  const [saving, setSaving] = useState(false)
  const [showInstall, setShowInstall] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [activeWalks, setActiveWalks] = useState<WalkCard[]>([])
  const [historyWalks, setHistoryWalks] = useState<WalkCard[]>([])
  const [reviews, setReviews] = useState<ReviewCard[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const saveBio = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ bio: bioText.trim() || null })
      .eq('id', user.id)

    if (!error) {
      setUser({ ...user, bio: bioText.trim() || null })
      setEditingBio(false)
    }
    setSaving(false)
  }

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      if (!user || !isAuthenticated) {
        if (!cancelled) setLoadingData(false)
        return
      }

      const { data: myWalks } = await supabase
        .from('walks')
        .select('*')
        .or(`creator_id.eq.${user.id},and(walk_participants.user_id.eq.${user.id})`)
        .order('created_at', { ascending: false })

      if (myWalks) {
        const active: WalkCard[] = []
        const history: WalkCard[] = []

        interface RawWalk { id: string; title: string; format: string; district: string | null; status: string; current_count: number; max_people: number; scheduled_at: string; creator_id: string; }

        for (const raw of myWalks as RawWalk[]) {
          const card: WalkCard = {
            id: raw.id, title: raw.title, format: raw.format, district: raw.district,
            status: raw.status, current_count: raw.current_count, max_people: raw.max_people,
            scheduled_at: raw.scheduled_at, creator_id: raw.creator_id,
          }

          if (raw.status === 'open' || raw.status === 'matching') active.push(card)
          else if (raw.status === 'completed' || raw.status === 'cancelled') history.push(card)
        }

        setActiveWalks(active)
        setHistoryWalks(history.slice(0, 10))
      }

      const { data: myReviews } = await supabase
        .from('reviews')
        .select('*, reviewer:profiles!reviews_reviewer_id_fkey(display_name)')
        .eq('target_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (myReviews) {
        setReviews(myReviews.map((r: Record<string, unknown>) => ({
          id: r.id as string,
          rating: r.rating as number,
          comment: r.comment as string | null,
          created_at: r.created_at as string,
          reviewer_name: (r.reviewer as Record<string, string> | null)?.display_name,
        })))
      }

      if (!cancelled) setLoadingData(false)
    }

    fetchData()
    return () => { cancelled = true }
  }, [user, isAuthenticated, supabase])

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Профиль</h1>
          <p className="text-gray-500 mb-6 text-center">Войдите, чтобы увидеть свой профиль</p>
          <button
            onClick={() => router.push('/login')}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Войти
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-24">
      <div className="relative bg-gradient-to-b from-blue-50 to-white px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Профиль</h1>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-full transition-colors ${showSettings ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold shadow-md">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.display_name} className="w-full h-full rounded-full object-cover" />
              ) : user.display_name?.[0]?.toUpperCase() || '?'}
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full shadow border border-gray-200 flex items-center justify-center hover:bg-gray-50">
              <Camera className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold truncate">{user.display_name}</h2>
              {user.is_verified && <Shield className="w-4 h-4 text-blue-500 fill-blue-500" />}
            </div>
            {user.username && (
              <p className="text-sm text-gray-500">@{user.username}</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            {!editingBio && (
              <button
                onClick={() => { setBioText(user.bio || ''); setEditingBio(true) }}
                className="text-blue-600 text-sm hover:text-blue-700 transition-colors"
              >
                {user.bio ? '✎ Редактировать' : '+ Добавить о себе'}
              </button>
            )}
          </div>

          {editingBio ? (
            <div className="space-y-2">
              <textarea
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                placeholder="Расскажите о себе — любимые места, что ищете..."
                maxLength={300}
                rows={3}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{bioText.length}/300</span>
                <div className="flex gap-2">
                  <button onClick={() => setEditingBio(false)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                  <button onClick={saveBio} disabled={saving} className="w-8 h-8 flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors disabled:opacity-50">
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 text-sm leading-relaxed">
              {user.bio || <span className="text-gray-400 italic">Пока ничего не рассказано</span>}
            </p>
          )}
        </div>
      </div>

      <div className="px-4 -mt-3">
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={<MapPin className="w-4 h-4" />} label="Прогулки" value={String(user.walk_count || 0)} />
          <StatCard icon={<Star className="w-4 h-4" />} label="Рейтинг" value={String(user.rating?.toFixed(1) || '5.0')} />
          <StatCard icon={<Calendar className="w-4 h-4" />} label="В системе" value={new Date(user.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} />
        </div>
      </div>

      {showSettings && (
        <div className="px-4 mt-4 space-y-3 animate-fadeIn">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-50 overflow-hidden">
            <SettingsRow icon={<Shield className="w-4 h-4" />} label="Верификация" value={user.is_verified ? 'Подтверждён' : 'Не подтверждён'} color={user.is_verified ? 'text-green-600' : 'text-gray-400'} />
            <SettingsRow icon={<Smartphone className="w-4 h-4" />} label="На экран домой" onClick={() => setShowInstall(!showInstall)} />
            {showInstall && (
              <div className="px-4 py-3 bg-blue-50 text-sm text-blue-800">
                Нажмите ⋮ → «Добавить на главный экран»
              </div>
            )}
            <SettingsRow icon={<Info className="w-4 h-4" />} label="О приложении" value="v0.1.0" />
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-red-200 text-red-600 rounded-2xl font-medium hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Выйти
          </button>
        </div>
      )}

      {loadingData ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {activeWalks.length > 0 && (
            <Section title={activeWalks.length === 1 ? 'Открытая прогулка' : 'Открытые прогулки'} count={activeWalks.length}>
              <div className="space-y-2">
                {activeWalks.map(w => (
                  <WalkRow key={w.id} walk={w} onClick={() => router.push(`/chats/${w.id}`)} />
                ))}
              </div>
            </Section>
          )}

          {reviews.length > 0 && (
            <Section title="Отзывы" count={reviews.length}>
              <div className="space-y-2">
                {reviews.map(r => (
                  <ReviewRow key={r.id} review={r} />
                ))}
              </div>
            </Section>
          )}

          {historyWalks.length > 0 && (
            <Section title="История" count={historyWalks.length}>
              <div className="space-y-2">
                {historyWalks.slice(0, 5).map(w => (
                  <WalkRow key={w.id} walk={w} isHistory />
                ))}
              </div>
            </Section>
          )}

          {!activeWalks.length && !reviews.length && !historyWalks.length && (
            <div className="px-4 mt-6">
              <div className="bg-gray-50 rounded-2xl p-8 text-center">
                <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-600 font-medium">Добро пожаловать!</p>
                <p className="text-sm text-gray-400 mt-1">Создайте прогулку и начните знакомиться</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-3.5 text-center shadow-sm">
      <div className="flex items-center justify-center gap-1.5 text-gray-500 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-lg font-bold text-gray-900">{value}</span>
    </div>
  )
}

function SettingsRow({ icon, label, value, onClick, color }: { icon: React.ReactNode; label: string; value?: string; onClick?: () => void; color?: string }) {
  return (
    <button disabled={!onClick} onClick={onClick} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors disabled:cursor-default">
      <div className="flex items-center gap-3">
        <span className="text-gray-500">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        {value && <span className={`text-sm ${color || 'text-gray-500'}`}>{value}</span>}
        {onClick && <ChevronRight className="w-4 h-4 text-gray-400" />}
      </div>
    </button>
  )
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="px-4 mt-6">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-base font-semibold">{title}</h3>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{count}</span>
      </div>
      {children}
    </div>
  )
}

function WalkRow({ walk, onClick, isHistory }: { walk: WalkCard; onClick?: () => void; isHistory?: boolean }) {
  const fmt = WALK_FORMATS[walk.format as keyof typeof WALK_FORMATS]
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="w-full bg-white border border-gray-100 rounded-xl p-3.5 text-left hover:bg-gray-50 transition-colors disabled:cursor-default"
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{fmt?.emoji || '🚶'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{walk.title}</span>
            {isHistory && <span className="text-xs text-gray-400 flex-shrink-0">Завершена</span>}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            {walk.district && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{walk.district}</span>}
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(walk.scheduled_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
            <span>{walk.current_count}/{walk.max_people}</span>
          </div>
        </div>
        {onClick && <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </div>
    </button>
  )
}

function ReviewRow({ review }: { review: ReviewCard }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium">{review.reviewer_name || 'Пользователь'}</span>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
          ))}
        </div>
      </div>
      {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
      <p className="text-xs text-gray-400 mt-1">
        {new Date(review.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
      </p>
    </div>
  )
}
