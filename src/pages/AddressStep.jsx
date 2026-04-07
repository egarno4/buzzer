import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OnboardingChrome } from '../components/OnboardingChrome'
import { useOnboarding } from '../context/OnboardingContext'

const BOROUGHS = [
  { value: '', label: 'Select borough' },
  { value: 'Manhattan', label: 'Manhattan' },
  { value: 'Brooklyn', label: 'Brooklyn' },
  { value: 'Queens', label: 'Queens' },
  { value: 'Bronx', label: 'Bronx' },
  { value: 'Staten Island', label: 'Staten Island' },
]

export default function AddressStep() {
  const { data, setField } = useOnboarding()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  function handleNext(e) {
    e.preventDefault()
    const addr = data.address.trim()
    const unit = data.unit.trim()
    if (!addr || !unit || !data.borough) {
      setError('Street address, unit, and borough are required.')
      return
    }
    setError('')
    navigate('/onboarding/email')
  }

  return (
    <OnboardingChrome
      eyebrow="Create account"
      title="Building & unit"
      subtitle="We use this to match you with the right lobby."
      backTo="/onboarding/name"
    >
      <form onSubmit={handleNext}>
        <div className="ref-field">
          <label className="ref-field-label" htmlFor="address">
            Street address
          </label>
          <input
            id="address"
            name="address"
            className="ref-input"
            autoComplete="street-address"
            placeholder="123 Example St"
            value={data.address}
            onChange={(e) => setField('address', e.target.value)}
          />
        </div>
        <div className="ref-field">
          <label className="ref-field-label" htmlFor="unit">
            Unit / apartment
          </label>
          <input
            id="unit"
            name="unit"
            className="ref-input"
            autoComplete="address-line2"
            placeholder="4B"
            value={data.unit}
            onChange={(e) => setField('unit', e.target.value)}
          />
        </div>
        <div className="ref-field">
          <label className="ref-field-label" htmlFor="borough">
            Borough
          </label>
          <select
            id="borough"
            name="borough"
            className="ref-select"
            value={data.borough}
            onChange={(e) => setField('borough', e.target.value)}
          >
            {BOROUGHS.map((b) => (
              <option key={b.value || 'empty'} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
        {error ? <p className="error-text">{error}</p> : null}
        <button type="submit" className="ref-btn-submit">
          Continue
        </button>
      </form>
    </OnboardingChrome>
  )
}
