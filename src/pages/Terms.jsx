import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './Terms.css'

export default function Terms() {
  const [html, setHtml] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/terms-body.html')
      .then((res) => {
        if (!res.ok) throw new Error('load failed')
        return res.text()
      })
      .then((text) => {
        if (!cancelled) setHtml(text)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="terms-page">
      <header className="terms-header">
        <div className="terms-header-inner">
          <Link to="/" className="terms-wordmark" aria-label="Buzzer home">
            BUZZ<span className="terms-wordmark-accent">ER</span>
          </Link>
          <span className="terms-tagline">Terms of Service</span>
        </div>
      </header>

      <main className="terms-main">
        {error ? (
          <p className="terms-fallback">
            We couldn&apos;t load the terms of service. Please try again later or contact{' '}
            <a href="mailto:support@buzzer.nyc">support@buzzer.nyc</a>.
          </p>
        ) : !html ? (
          <p className="terms-loading">Loading…</p>
        ) : (
          <div className="terms-policy-root" dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </main>
    </div>
  )
}
