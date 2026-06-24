'use client'

import { usePWA } from '@/hooks/usePWA'

export function PWAProvider({ children }: { children: React.ReactNode }) {
  usePWA()
  return <>{children}</>
}
