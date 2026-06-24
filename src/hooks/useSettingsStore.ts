'use client'

import { create } from 'zustand'

type Language = 'ru' | 'en'
type Theme = 'light' | 'dark'

interface SettingsState {
  language: Language
  theme: Theme
  setLanguage: (lang: Language) => void
  setTheme: (theme: Theme) => void
}

const getInitial = () => {
  if (typeof window === 'undefined') return { language: 'ru' as Language, theme: 'light' as Theme }
  return {
    language: (localStorage.getItem('zis_language') as Language) || 'ru',
    theme: (localStorage.getItem('zis_theme') as Theme) || 'light',
  }
}

export const useSettingsStore = create<SettingsState>((set) => {
  const initial = getInitial()
  return {
    language: initial.language,
    theme: initial.theme,
    setLanguage: (language) => {
      localStorage.setItem('zis_language', language)
      set({ language })
    },
    setTheme: (theme) => {
      localStorage.setItem('zis_theme', theme)
      document.documentElement.classList.toggle('dark', theme === 'dark')
      set({ theme })
    },
  }
})
