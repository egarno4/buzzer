import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OnboardingChrome } from '../components/OnboardingChrome'
import { useOnboarding } from '../context/OnboardingContext'
import { ensureProfile } from '../lib/ensureProfile'
import { supabase } from '../lib/supabase'
import './Proof.css'

const OPTIONS = [
  {
    id: 'utility_bill',
    title: 'Utility bill',
    description: 'Gas, electric, or internet showing your name and address.',
  },
  {
    id: 'renters_insurance',
    title: 'Renters insurance',
    description: 'Policy or declaration page with your address.',
  },
  {
    id: 'package_photo',
    title: 'Package photo',
    description: 'Label visible at your unit door or mailbox.',
  },
]

function sanitizeFileName(name) {
  return name.replace(/[^\w.\-]+/g, '_').slice(0, 180)
}

export default function Proof() {
  const { data: onboarding, clearStorage } = useOnboarding()
  const navigate = useNavigate()
  const [proofType, setProofType] = useState('')
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [bootstrapError, setBootstrapError] = useState('')
  const inFlightRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    const AUTH_WAIT_MS = 15000

    async function finishWithSession(session) {
      if (cancelled || !session?.user || inFlightRef.current) return
      inFlightRef.current = true
      try {
        if (cancelled) return
        await ensureProfile(session.user, onboarding)
        if (cancelled) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('proof_file_url')
          .eq('id', session.user.id)
          .maybeSingle()

        if (cancelled) return
        if (profile?.proof_file_url) {
          navigate('/onboarding/pending', { replace: true })
          return
        }
        setChecking(false)
      } catch (e) {
        if (!cancelled) {
          setBootstrapError(e.message || 'Could not create your profile.')
          setChecking(false)
        }
      } finally {
        inFlightRef.current = false
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) void finishWithSession(session)
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) void finishWithSession(session)
    })

    const timeoutId = window.setTimeout(() => {
      if (cancelled) return
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (cancelled) return
        if (!session && !inFlightRef.current) {
          navigate('/', { replace: true })
        }
      })
    }, AUTH_WAIT_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [
    navigate,
    onboarding.firstName,
    onboarding.lastName,
    onboarding.address,
    onboarding.unit,
    onboarding.borough,
    onboarding.email,
  ])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!proofType) {
      setError('Choose one type of proof.')
      return
    }
    if (!file) {
      setError('Upload a photo or PDF.')
      return
    }

    setLoading(true)
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession()
    if (sessionErr || !sessionData.session) {
      setLoading(false)
      setError('Session expired. Start again from email.')
      navigate('/onboarding/email', { replace: true })
      return
    }

    const userId = sessionData.session.user.id
    const safeName = sanitizeFileName(file.name || 'upload')
    const path = `${userId}/${Date.now()}-${safeName}`

    const { error: upErr } = await supabase.storage.from('proofs').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (upErr) {
      setLoading(false)
      setError(upErr.message || 'Upload failed. Check Storage bucket and policies.')
      return
    }

    const { error: updErr } = await supabase
      .from('profiles')
      .update({
        proof_type: proofType,
        proof_file_url: path,
      })
      .eq('id', userId)

    setLoading(false)
    if (updErr) {
      setError(updErr.message || 'Could not save proof. Try again.')
      return
    }

    navigate('/onboarding/pending', { replace: true })
  }

  if (checking) {
    return (
      <OnboardingChrome eyebrow="Verification" title="Loading…" subtitle={null} />
    )
  }

  if (bootstrapError) {
    return (
      <OnboardingChrome
        eyebrow="Verification"
        title="Almost there"
        subtitle={"We couldn't finish setting up your account from this link."}
        backTo="/onboarding/name"
      >
        <p className="error-text" style={{ marginBottom: 16 }}>
          {bootstrapError}
        </p>
        <button
          type="button"
          className="ref-btn-submit"
          onClick={() => navigate('/onboarding/name', { replace: true })}
        >
          Start over
        </button>
      </OnboardingChrome>
    )
  }

  return (
    <OnboardingChrome
      eyebrow="Verification"
      title="Proof of residence"
      subtitle="Pick one option and upload a clear photo or PDF. We review these manually — usually within a day or two."
    >
      <form onSubmit={handleSubmit}>
        <div className="proof-options" role="group" aria-label="Proof type">
          {OPTIONS.map((opt) => (
            <label key={opt.id} className={`proof-card ${proofType === opt.id ? 'is-on' : ''}`}>
              <input
                type="radio"
                name="proofType"
                value={opt.id}
                checked={proofType === opt.id}
                onChange={() => setProofType(opt.id)}
              />
              <span className="proof-card-title">{opt.title}</span>
              <span className="proof-card-desc">{opt.description}</span>
            </label>
          ))}
        </div>

        <div className="ref-field proof-file-field">
          <label className="ref-field-label" htmlFor="proofFile">
            Upload
          </label>
          <input
            id="proofFile"
            name="proofFile"
            type="file"
            className="proof-file-input"
            accept="image/*,.pdf,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? <p className="proof-file-name">{file.name}</p> : null}
        </div>

        {error ? <p className="error-text">{error}</p> : null}

        <button type="submit" className="ref-btn-submit" disabled={loading}>
          {loading ? 'Uploading…' : 'Submit for review'}
        </button>
      </form>

      <p className="proof-signout">
        Wrong account?{' '}
        <button
          type="button"
          className="proof-link-btn"
          onClick={async () => {
            clearStorage()
            await supabase.auth.signOut()
            navigate('/', { replace: true })
          }}
        >
          Sign out
        </button>
      </p>
    </OnboardingChrome>
  )
}
