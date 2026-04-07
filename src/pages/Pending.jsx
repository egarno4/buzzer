import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OnboardingChrome } from '../components/OnboardingChrome'
import { useOnboarding } from '../context/OnboardingContext'
import { supabase } from '../lib/supabase'
import './Pending.css'

export default function Pending() {
  const { clearStorage } = useOnboarding()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (cancelled) return
      if (!sessionData.session) {
        navigate('/', { replace: true })
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, proof_file_url, email')
        .eq('id', sessionData.session.user.id)
        .maybeSingle()

      if (cancelled) return
      if (!profile?.proof_file_url) {
        navigate('/onboarding/proof', { replace: true })
        return
      }

      setFirstName(profile.first_name || '')
      setEmail(profile.email || '')
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [navigate])

  if (loading) {
    return (
      <OnboardingChrome eyebrow="Verification" title="Loading…" subtitle={null} />
    )
  }

  return (
    <OnboardingChrome
      eyebrow="Verification"
      title={"You're on the list"}
      subtitle={
        <>
          Thanks{firstName ? `, ${firstName}` : ''}. We&apos;re reviewing your proof of residence.
          When you&apos;re approved, you&apos;ll get an email — then you can use Buzzer with your
          building.
        </>
      }
    >
      <div className="pending-card">
        <div className="pending-badge" aria-hidden="true">
          <span className="pending-dot" />
        </div>
        <p className="pending-note">
          Your account is <strong>pending verification</strong>.
          {email ? (
            <>
              {' '}
              We&apos;ll email you at <strong>{email}</strong> when you&apos;re approved.
            </>
          ) : (
            <> We&apos;ll email you when you&apos;re approved.</>
          )}
        </p>
        <button
          type="button"
          className="ref-btn-submit pending-done-btn"
          style={{ background: 'transparent', color: '#1c1812', border: '2px solid #1c1812' }}
          onClick={async () => {
            clearStorage()
            await supabase.auth.signOut()
            navigate('/', { replace: true })
          }}
        >
          Done
        </button>
      </div>
    </OnboardingChrome>
  )
}
