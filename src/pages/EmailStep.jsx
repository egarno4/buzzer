import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OnboardingChrome } from '../components/OnboardingChrome'
import { useOnboarding } from '../context/OnboardingContext'
import { emailAuthRedirectUrl } from '../lib/authRedirect'
import { supabase } from '../lib/supabase'

export default function EmailStep() {
  const { data, setField } = useOnboarding()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const email = data.email.trim().toLowerCase()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.')
      return
    }
    setField('email', email)
    setError('')
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: emailAuthRedirectUrl,
      },
    })

    setLoading(false)
    if (authError) {
      setError(authError.message || 'Could not send link. Check Supabase email settings.')
      return
    }

    navigate('/onboarding/verify')
  }

  return (
    <OnboardingChrome
      eyebrow="Create account"
      title="Email"
      subtitle={
        "We'll email you a magic link. Tap it on this device to verify — no password needed."
      }
      backTo="/onboarding/address"
    >
      <form onSubmit={handleSubmit}>
        <div className="ref-field">
          <label className="ref-field-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            className="ref-input"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={data.email}
            onChange={(e) => setField('email', e.target.value)}
          />
        </div>
        {error ? <p className="error-text">{error}</p> : null}
        <button type="submit" className="ref-btn-submit" disabled={loading}>
          {loading ? 'Sending…' : 'Send link'}
        </button>
      </form>
    </OnboardingChrome>
  )
}
