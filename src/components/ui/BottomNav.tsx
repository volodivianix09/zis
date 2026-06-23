'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Map, Activity, MessageCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/chats', label: 'Чаты', icon: MessageCircle },
  { href: '/', label: 'Карта', icon: Map },
  { href: '/activity', label: 'Активность', icon: Activity },
  { href: '/profile', label: 'Профиль', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full transition-colors',
                isActive ? 'text-blue-600' : 'text-gray-500'
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
