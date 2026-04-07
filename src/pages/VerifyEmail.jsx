import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OnboardingChrome } from '../components/OnboardingChrome'
import { useOnboarding } from '../context/OnboardingContext'
import { emailAuthRedirectUrl } from '../lib/authRedirect'
import { supabase } from '../lib/supabase'

export default function VerifyEmail() {
  const { data: onboarding } = useOnboarding()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [resendLoading, setResendLoading] = useState(false)

  useEffect(() => {
    if (!onboarding.email.trim()) {
      navigate('/onboarding/email', { replace: true })
    }
  }, [onboarding.email, navigate])

  async function resendLink() {
    const email = onboarding.email.trim().toLowerCase()
    if (!email) return
    setError('')
    setResendLoading(true)
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: emailAuthRedirectUrl,
      },
    })
    setResendLoading(false)
    if (authError) {
      setError(authError.message || 'Could not resend link.')
    }
  }

  return (
    <OnboardingChrome
      eyebrow="Create account"
      title="Check your email"
      subtitle={
        <>
          Check your email and tap the link to verify your account. We sent it to{' '}
          <strong>{onboarding.email}</strong>.
        </>
      }
      backTo="/onboarding/email"
    >
      <p className="verify-magic-copy">
        After you tap the link, you&apos;ll land on <strong>proof of residence</strong> to finish
        signup. Use the same browser you started in (your details are saved there).
      </p>
      {error ? <p className="error-text">{error}</p> : null}
      <button
        type="button"
        className="ref-btn-submit verify-resend-btn"
        disabled={resendLoading}
        onClick={() => resendLink()}
      >
        {resendLoading ? 'Sending…' : 'Resend magic link'}
      </button>
    </OnboardingChrome>
  )
}
