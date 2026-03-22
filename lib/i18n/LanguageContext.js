'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import translations from './translations'

const LanguageContext = createContext()

export const LANGS = [
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { code: 'nl', flag: '🇳🇱', label: 'Nederlands' },
]

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('es')

  useEffect(() => {
    const saved = localStorage.getItem('lang')
    if (saved && translations[saved]) setLang(saved)
  }, [])

  const changeLang = (code) => {
    setLang(code)
    localStorage.setItem('lang', code)
  }

  const t = (section, key) => {
    return translations[lang]?.[section]?.[key] ?? translations['es']?.[section]?.[key] ?? key
  }

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t, LANGS }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
