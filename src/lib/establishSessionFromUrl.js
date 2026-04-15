import { supabase } from './supabase'

/**
 * Ensures Supabase has parsed magic-link / OAuth return params from the current URL
 * (PKCE ?code=, token_hash + type=, or #access_token implicit) before callers use getSession().
 */
export async function establishSessionFromUrl() {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.warn('Buzzer: exchangeCodeForSession failed', error.message)
    } else {
      window.history.replaceState({}, document.title, url.pathname)
    }
    return
  }

  const token_hash = url.searchParams.get('token_hash')
  if (token_hash) {
    const rawType = (url.searchParams.get('type') || 'magiclink').toLowerCase()
    const allowed = new Set(['signup', 'magiclink', 'recovery', 'email_change', 'invite', 'email'])
    const otpType = allowed.has(rawType) ? rawType : 'magiclink'

    const { error } = await supabase.auth.verifyOtp({ type: otpType, token_hash })
    if (error) {
      console.warn('Buzzer: verifyOtp failed', error.message)
    } else {
      window.history.replaceState({}, document.title, url.pathname)
    }
    return
  }

  await supabase.auth.getSession()

  const hash = window.location.hash || ''
  if (hash.includes('access_token') || hash.includes('refresh_token')) {
    for (let i = 0; i < 40; i++) {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) break
      await new Promise((r) => setTimeout(r, 50))
    }
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }
}
