import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OnboardingChrome } from '../components/OnboardingChrome'
import { useOnboarding } from '../context/OnboardingContext'

export default function NameStep() {
  const { data, setField } = useOnboarding()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  function handleNext(e) {
    e.preventDefault()
    const fn = data.firstName.trim()
    const ln = data.lastName.trim()
    if (!fn || !ln) {
      setError('Please enter your first and last name.')
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
        {error ? <p className="error-text">{error}</p> : null}
        <button type="submit" className="ref-btn-submit">
          Continue
        </button>
      </form>
    </OnboardingChrome>
  )
}
