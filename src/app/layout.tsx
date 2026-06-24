import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { BottomNav } from '@/components/ui/BottomNav'
import { AuthProvider } from '@/components/AuthProvider'
import { PWAProvider } from '@/components/PWAProvider'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'Здесь и сейчас',
  description: 'Найди компанию для прогулки здесь и сейчас',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" async />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <PWAProvider>
            <main className="pb-20 min-h-screen">
              {children}
            </main>
            <BottomNav />
          </PWAProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
