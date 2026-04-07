/**
 * Supabase magic-link redirect. Add both URLs under Authentication → URL configuration → Redirect URLs.
 */
export const emailAuthRedirectPath = '/onboarding/proof'

const LOCAL_REDIRECT = 'http://localhost:5173/onboarding/proof'
const PRODUCTION_REDIRECT = 'https://buzzer.nyc/onboarding/proof'

export const emailAuthRedirectUrl = (() => {
  if (typeof window === 'undefined') {
    return import.meta.env.DEV ? LOCAL_REDIRECT : PRODUCTION_REDIRECT
  }
  const host = window.location.hostname
  if (host === 'localhost' || host === '127.0.0.1') {
    return `http://${host}:5173${emailAuthRedirectPath}`
  }
  return PRODUCTION_REDIRECT
})()
