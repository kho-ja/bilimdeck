"use client"

import * as React from "react"
import { translations, Language } from "./translations"

type TranslationValue = string | { [key: string]: TranslationValue }

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(
  undefined
)

const LANGUAGE_KEY = "bilimdeck-language"

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = React.useState<Language>("en")
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(LANGUAGE_KEY) as Language | null
    if (stored && translations[stored]) {
      setLanguageState(stored)
    }
  }, [])

  const setLanguage = React.useCallback((lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(LANGUAGE_KEY, lang)
  }, [])

  const t = React.useCallback(
    (key: string): string => {
      const keys = key.split(".")
      let value: TranslationValue = translations[language]
      
      for (const k of keys) {
        if (typeof value === "object" && value !== null && k in value) {
          value = value[k as keyof typeof value]
        } else {
          return key
        }
      }
      
      return typeof value === "string" ? value : key
    },
    [language]
  )

  if (!mounted) {
    return null
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = React.useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
