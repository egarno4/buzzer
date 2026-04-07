import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './Privacy.css'

export default function Privacy() {
  const [html, setHtml] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/privacy-policy-body.html')
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
    <div className="privacy-page">
      <header className="privacy-header">
        <div className="privacy-header-inner">
          <Link to="/" className="privacy-wordmark" aria-label="Buzzer home">
            BUZZ<span className="privacy-wordmark-accent">ER</span>
          </Link>
          <span className="privacy-tagline">Privacy Policy</span>
        </div>
      </header>

      <main className="privacy-main">
        {error ? (
          <p className="privacy-fallback">
            We couldn&apos;t load the privacy policy. Please try again later or contact{' '}
            <a href="mailto:privacy@buzzer.nyc">privacy@buzzer.nyc</a>.
          </p>
        ) : !html ? (
          <p className="privacy-loading">Loading…</p>
        ) : (
          <div className="privacy-policy-root" dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </main>
    </div>
  )
}
