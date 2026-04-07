import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { OnboardingChrome } from '../components/OnboardingChrome'
import { useOnboarding } from '../context/OnboardingContext'

export default function NameStep() {
  const { data, setField } = useOnboarding()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [legalAgreed, setLegalAgreed] = useState(false)

  const fn = data.firstName.trim()
  const ln = data.lastName.trim()
  const canContinue = legalAgreed && Boolean(fn && ln)

  function handleNext(e) {
    e.preventDefault()
    if (!fn || !ln) {
      setError('Please enter your first and last name.')
      return
    }
    if (!legalAgreed) {
      setError('Please confirm you are 18 or older and accept the Terms and Privacy Policy.')
      return
    }
    setError('')
    navigate('/onboarding/address')
  }

  return (
    <OnboardingChrome
      eyebrow="Create account"
      title="Your name"
      subtitle="How neighbors will see you in the building."
      backTo="/"
    >
      <form onSubmit={handleNext}>
        <div className="ref-field">
          <label className="ref-field-label" htmlFor="firstName">
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            className="ref-input"
            autoComplete="given-name"
            value={data.firstName}
            onChange={(e) => setField('firstName', e.target.value)}
          />
        </div>
        <div className="ref-field">
          <label className="ref-field-label" htmlFor="lastName">
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            className="ref-input"
            autoComplete="family-name"
            value={data.lastName}
            onChange={(e) => setField('lastName', e.target.value)}
          />
        </div>
        <div className="onboarding-legal">
          <label className="onboarding-legal-label" htmlFor="legalAgree">
            <input
              id="legalAgree"
              name="legalAgree"
              type="checkbox"
              className="onboarding-legal-checkbox"
              checked={legalAgreed}
              onChange={(e) => setLegalAgreed(e.target.checked)}
            />
            <span className="onboarding-legal-text">
              I am 18 or older and agree to the{' '}
              <Link
                to="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="onboarding-legal-link"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                to="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="onboarding-legal-link"
              >
                Privacy Policy
              </Link>
            </span>
          </label>
        </div>
        {error ? <p className="error-text">{error}</p> : null}
        <button type="submit" className="ref-btn-submit" disabled={!canContinue}>
          Continue
        </button>
      </form>
    </OnboardingChrome>
  )
}
