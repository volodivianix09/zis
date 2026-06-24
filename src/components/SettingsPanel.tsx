'use client'

import { useSettingsStore } from '@/hooks/useSettingsStore'
import { X, Globe, Moon, Sun, Smartphone } from 'lucide-react'

const languages = [
  { code: 'ru' as const, label: 'Русский' },
  { code: 'en' as const, label: 'English' },
]

const t = {
  ru: {
    title: 'Настройки',
    language: 'Язык',
    theme: 'Тема',
    light: 'Светлая',
    dark: 'Тёмная',
    addToHome: 'Добавить на экран домой',
    addToHomeDesc: 'Откройте меню Telegram ( ⋮ ) и выберите «Добавить на главный экран»',
    close: 'Закрыть',
  },
  en: {
    title: 'Settings',
    language: 'Language',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    addToHome: 'Add to Home Screen',
    addToHomeDesc: 'Open the Telegram menu ( ⋮ ) and select "Add to Home Screen"',
    close: 'Close',
  },
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { language, setLanguage, theme, setTheme } = useSettingsStore()
  const loc = t[language]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl p-5 pb-8 animate-slide-up shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">{loc.title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Globe className="w-4 h-4" /> {loc.language}
            </label>
            <div className="flex gap-2">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    language === l.code
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              {theme === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {loc.theme}
            </label>
            <div className="flex gap-2">
              {[
                { key: 'light' as const, label: loc.light, icon: Sun },
                { key: 'dark' as const, label: loc.dark, icon: Moon },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    theme === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">{loc.addToHome}</p>
                <p className="text-xs text-blue-700 mt-1">{loc.addToHomeDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
