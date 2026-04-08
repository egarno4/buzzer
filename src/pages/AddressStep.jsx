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
  if (window.google?.maps?.places?.PlaceAutocompleteElement) {
    return window.google.maps.importLibrary('places')
  }
  if (placesScriptPromise) return placesScriptPromise

  const key = import.meta.env.VITE_GOOGLE_PLACES_KEY
  if (!key) return Promise.reject(new Error('Missing VITE_GOOGLE_PLACES_KEY'))

  placesScriptPromise = new Promise((resolve, reject) => {
    // Async loader pattern recommended by Google Maps JS API.
    ;((g) => {
      let h
      let a
      let k
      const p = 'The Google Maps JavaScript API'
      const c = 'google'
      const l = 'importLibrary'
      const q = '__ib__'
      const m = document
      const b = window
      b[c] = b[c] || {}
      const d = b[c].maps || (b[c].maps = {})
      const r = new Set()
      const e = new URLSearchParams()
      const u = () =>
        h ||
        (h = new Promise(async (f, n) => {
          await (a = m.createElement('script'))
          e.set('libraries', [...r] + '')
          for (k in g) e.set(k.replace(/[A-Z]/g, (t) => `_${t[0].toLowerCase()}`), g[k])
          e.set('callback', `${c}.maps.${q}`)
          a.src = `https://maps.${c}apis.com/maps/api/js?` + e
          d[q] = f
          a.onerror = () => n(new Error(`${p} could not load.`))
          a.dataset.googlePlaces = 'true'
          a.async = true
          m.head.append(a)
        }))
      if (d[l]) {
        return
      }
      d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n))
    })({ key, v: 'weekly' })

    window.google.maps
      .importLibrary('places')
      .then(resolve)
      .catch(() => reject(new Error('Google Places failed to load')))
  })

  return placesScriptPromise
}

function normalizeBoroughToken(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function boroughFromPlace(place) {
  const components = place?.addressComponents || place?.address_components || []
  const byType = (type) =>
    components.find((c) => Array.isArray(c.types) && c.types.includes(type))

  const componentText = (c) => c?.longText || c?.long_name || ''

  const possible = [
    componentText(byType('sublocality_level_1')),
    componentText(byType('sublocality')),
    componentText(byType('locality')),
    componentText(byType('administrative_area_level_2')),
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
  const [useFallbackInput, setUseFallbackInput] = useState(false)
  const autocompleteHostRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    let placeElement = null

    async function setupAutocomplete() {
      try {
        const places = await loadGooglePlacesScript()
        if (cancelled || !autocompleteHostRef.current) return

        const { PlaceAutocompleteElement } = places
        const el = new PlaceAutocompleteElement({
          componentRestrictions: { country: ['us'] },
          includedRegionCodes: ['us'],
          types: ['address'],
          locationRestriction: NYC_BOUNDS,
        })
        el.id = 'address'
        el.setAttribute('aria-label', 'Street address')
        el.setAttribute('placeholder', '123 Example St')
        if (data.address) {
          el.value = data.address
        }

        const onInput = () => {
          if (typeof el.value === 'string') {
            setField('address', el.value)
          }
        }

        const onPlaceSelect = async (event) => {
          const prediction =
            event?.placePrediction ||
            event?.detail?.placePrediction ||
            event?.detail?.prediction ||
            null
          if (!prediction?.toPlace) return
          const place = prediction.toPlace()
          await place.fetchFields({
            fields: ['formattedAddress', 'addressComponents'],
          })
          const formatted = place?.formattedAddress?.trim()
          if (formatted) {
            setField('address', formatted)
            el.value = formatted
          }
          const borough = boroughFromPlace(place)
          if (borough) {
            setField('borough', borough)
          }
        }

        el.addEventListener('input', onInput)
        el.addEventListener('change', onInput)
        // Support event naming variants during API rollout.
        el.addEventListener('gmp-select', onPlaceSelect)
        el.addEventListener('gmp-placeselect', onPlaceSelect)

        autocompleteHostRef.current.innerHTML = ''
        autocompleteHostRef.current.appendChild(el)
        placeElement = el
      } catch (e) {
        if (!cancelled) {
          setPlacesError('Address suggestions are unavailable right now. You can still enter your address manually.')
          setUseFallbackInput(true)
        }
      }
    }

    setupAutocomplete()
    return () => {
      cancelled = true
      if (placeElement) {
        placeElement.remove()
      }
    }
  }, [setField, data.address])

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
          {useFallbackInput ? (
            <input
              id="address"
              name="address"
              className="ref-input"
              autoComplete="street-address"
              placeholder="123 Example St"
              value={data.address}
              onChange={(e) => setField('address', e.target.value)}
            />
          ) : (
            <div ref={autocompleteHostRef} className="ref-place-host" />
          )}
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
