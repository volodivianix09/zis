'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string
        initDataUnsafe: {
          user?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
            photo_url?: string
          }
        }
        ready: () => void
        expand: () => void
        close: () => void
        MainButton: {
          text: string
          onClick: (cb: () => void) => void
          show: () => void
          hide: () => void
        }
        BackButton: {
          onClick: (cb: () => void) => void
          show: () => void
          hide: () => void
        }
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void
          selectionChanged: () => void
        }
        themeParams: {
          bg_color?: string
          text_color?: string
          hint_color?: string
          link_color?: string
          button_color?: string
          button_text_color?: string
        }
        colorScheme: 'light' | 'dark'
        viewportHeight: number
        viewportStableHeight: number
      }
    }
  }
}

export function useTelegram() {
  const [isReady, setIsReady] = useState(false)
  const [user, setUser] = useState<Window['Telegram'] extends undefined ? never : NonNullable<Window['Telegram']>['WebApp']['initDataUnsafe']['user']>(undefined)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      tg.expand()
      setUser(tg.initDataUnsafe.user || undefined)
      setIsReady(true)
    } else {
      setIsReady(true)
    }
  }, [])

  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined

  return {
    isReady,
    user,
    initData: tg?.initData,
    themeParams: tg?.themeParams,
    colorScheme: tg?.colorScheme || 'light',
    viewportHeight: tg?.viewportHeight || 0,
    MainButton: tg?.MainButton,
    BackButton: tg?.BackButton,
    HapticFeedback: tg?.HapticFeedback,
  }
}
