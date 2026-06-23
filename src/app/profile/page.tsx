'use client'

import { useAuthStore } from '@/hooks/useAuthStore'
import { User, Star, Shield, Settings, LogOut } from 'lucide-react'

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuthStore()

  if (!isAuthenticated || !user) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">Профиль</h1>
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <User className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600">Войдите через Telegram</p>
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

        {user.bio && (
          <p className="mt-4 text-gray-700">{user.bio}</p>
        )}
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
            {user.is_verified ? 'Пройдена' : 'Не пройдена'}
          </span>
        </div>

        <button className="p-4 flex items-center gap-3 w-full text-left hover:bg-gray-50">
          <Settings className="w-5 h-5 text-gray-500" />
          <span>Настройки</span>
        </button>

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
