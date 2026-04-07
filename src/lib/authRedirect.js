/**
 * Supabase magic-link redirect. Add this exact URL under Authentication → URL configuration → Redirect URLs.
 * For production, switch to your deployed origin (e.g. https://buzzer.nyc/onboarding/proof).
 */
export const emailAuthRedirectUrl = 'http://localhost:5173/onboarding/proof'

export const emailAuthRedirectPath = '/onboarding/proof'
