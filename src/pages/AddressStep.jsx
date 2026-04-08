import { useEffect, useRef, useState } from 'react'
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

const NYC_BOUNDS = {
  north: 40.917577,
  south: 40.477399,
  east: -73.700272,
  west: -74.25909,
}

let placesScriptPromise = null

function loadGooglePlacesScript() {
  if (window.google?.maps?.places) return Promise.resolve(window.google)
  if (placesScriptPromise) return placesScriptPromise

  const key = import.meta.env.VITE_GOOGLE_PLACES_KEY
  if (!key) return Promise.reject(new Error('Missing VITE_GOOGLE_PLACES_KEY'))

  placesScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-places="true"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google), { once: true })
      existing.addEventListener('error', () => reject(new Error('Google Places failed to load')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`
    script.async = true
    script.defer = true
    script.dataset.googlePlaces = 'true'
    script.onload = () => resolve(window.google)
    script.onerror = () => reject(new Error('Google Places failed to load'))
    document.head.appendChild(script)
  })

  return placesScriptPromise
}

function normalizeBoroughToken(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function boroughFromPlace(place) {
  const components = place?.address_components || []
  const byType = (type) =>
    components.find((c) => Array.isArray(c.types) && c.types.includes(type))

  const possible = [
    byType('sublocality_level_1')?.long_name,
    byType('sublocality')?.long_name,
    byType('locality')?.long_name,
    byType('administrative_area_level_2')?.long_name,
  ].filter(Boolean)

  for (const raw of possible) {
    const token = normalizeBoroughToken(raw)
    if (token.includes('manhattan') || token.includes('new york county')) return 'Manhattan'
    if (token.includes('brooklyn') || token.includes('kings county')) return 'Brooklyn'
    if (token.includes('queens')) return 'Queens'
    if (token.includes('bronx')) return 'Bronx'
    if (token.includes('staten island') || token.includes('richmond county')) return 'Staten Island'
  }
  return ''
}

export default function AddressStep() {
  const { data, setField } = useOnboarding()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [placesError, setPlacesError] = useState('')
  const addressInputRef = useRef(null)
  const autocompleteRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    let listener = null

    async function setupAutocomplete() {
      try {
        await loadGooglePlacesScript()
        if (cancelled || !addressInputRef.current) return

        const bounds = new window.google.maps.LatLngBounds(
          { lat: NYC_BOUNDS.south, lng: NYC_BOUNDS.west },
          { lat: NYC_BOUNDS.north, lng: NYC_BOUNDS.east },
        )

        const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'us' },
          fields: ['formatted_address', 'address_components'],
          bounds,
          strictBounds: true,
        })

        autocompleteRef.current = autocomplete
        listener = autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          const formatted = place?.formatted_address?.trim()
          if (formatted) {
            setField('address', formatted)
          }
          const borough = boroughFromPlace(place)
          if (borough) {
            setField('borough', borough)
          }
        })
      } catch (e) {
        if (!cancelled) {
          setPlacesError('Address suggestions are unavailable right now. You can still enter your address manually.')
        }
      }
    }

    setupAutocomplete()
    return () => {
      cancelled = true
      if (listener) window.google?.maps?.event?.removeListener(listener)
    }
  }, [setField])

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
            ref={addressInputRef}
            className="ref-input"
            autoComplete="street-address"
            placeholder="123 Example St"
            value={data.address}
            onChange={(e) => setField('address', e.target.value)}
          />
        </div>
        {placesError ? <p className="error-text">{placesError}</p> : null}
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
