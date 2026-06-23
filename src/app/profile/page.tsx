'use client'

import { useState } from 'react'
import { useAuthStore } from '@/hooks/useAuthStore'
import { createClient } from '@/lib/supabase/client'
import { User, Star, Shield, Pencil, Check, X, LogOut } from 'lucide-react'

export default function ProfilePage() {
  const { user, isAuthenticated, logout, setUser } = useAuthStore()
  const [editingBio, setEditingBio] = useState(false)
  const [bioText, setBioText] = useState(user?.bio || '')
  const [saving, setSaving] = useState(false)

  const saveBio = async () => {
    if (!user) return
    setSaving(true)
    const supabase = createClient()
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

  if (!isAuthenticated || !user) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">Профиль</h1>
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <User className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <a href="/login" className="mt-2 inline-block px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">Войти</a>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Профиль</h1>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
        <div className="flex items-center gap-4">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.display_name}
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold">{user.display_name}</h2>
            {user.username && (
              <p className="text-gray-500">@{user.username}</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-500 font-medium">О себе</span>
            {!editingBio && (
              <button onClick={() => { setBioText(user.bio || ''); setEditingBio(true) }} className="text-blue-600 text-sm flex items-center gap-1">
                <Pencil className="w-3 h-3" /> {user.bio ? 'Изменить' : 'Добавить'}
              </button>
            )}
          </div>

          {editingBio ? (
            <div className="space-y-2">
              <textarea
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                placeholder="Расскажите о себе..."
                maxLength={300}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{bioText.length}/300</span>
                <div className="flex gap-2">
                  <button onClick={() => setEditingBio(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                    <X className="w-4 h-4" />
                  </button>
                  <button onClick={saveBio} disabled={saving} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full disabled:opacity-50">
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 text-sm">{user.bio || 'Пока ничего не рассказано'}</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm divide-y">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-yellow-500" />
            <span>Рейтинг</span>
          </div>
          <span className="font-semibold">{user.rating.toFixed(1)}</span>
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-green-500" />
            <span>Верификация</span>
          </div>
          <span className={user.is_verified ? 'text-green-600' : 'text-gray-400'}>
            {user.is_verified ? 'Подтверждён' : 'Не подтверждён'}
          </span>
        </div>

        <button
          onClick={logout}
          className="p-4 flex items-center gap-3 w-full text-left text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5" />
          <span>Выйти</span>
        </button>
      </div>
    </div>
  )
}
