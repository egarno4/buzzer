import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

const STORAGE_KEY = 'buzzer_onboarding_v1'

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
    const legacy = sessionStorage.getItem(STORAGE_KEY)
    if (legacy) {
      localStorage.setItem(STORAGE_KEY, legacy)
      sessionStorage.removeItem(STORAGE_KEY)
      return JSON.parse(legacy)
    }
    return null
  } catch {
    return null
  }
}

const OnboardingContext = createContext(null)

export function OnboardingProvider({ children }) {
  const [data, setData] = useState(() => {
    const s = loadStored()
    return {
      firstName: s?.firstName ?? '',
      lastName: s?.lastName ?? '',
      address: s?.address ?? '',
      unit: s?.unit ?? '',
      borough: s?.borough ?? '',
      email: s?.email ?? '',
    }
  })

  const setField = useCallback((key, value) => {
    setData((prev) => {
      const next = { ...prev, [key]: value }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const setAll = useCallback((partial) => {
    setData((prev) => {
      const next = { ...prev, ...partial }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(
    () => ({ data, setField, setAll, clearStorage }),
    [data, setField, setAll, clearStorage],
  )

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider')
  return ctx
}
