import { useCallback, useEffect, useRef, useState } from 'react'

export const WELCOME_DISMISSED_KEY = 'buzzer_welcome_dismissed_v1'

const CARDS = [
  {
    icon: '📦',
    title: 'SPOT A PACKAGE',
    body: 'See a package in the lobby that isn\'t yours? Tap "Spotted one" to privately notify your neighbor — nothing is posted publicly.',
  },
  {
    icon: '🙋',
    title: 'NEED HELP?',
    body: "Expecting a delivery but won't be home? Post to your building feed and let a neighbor hold it for you. You choose who.",
  },
  {
    icon: '🔒',
    title: 'ALWAYS PRIVATE',
    body: 'Your contact info is never shared with neighbors. All communication happens through Buzzer.',
  },
]

const BG = '#F5F0E8'
const ACCENT = '#D4773A'
const DARK = '#1C1812'
const SWIPE_MIN = 48

export function hasWelcomeBeenDismissed() {
  try {
    return window.localStorage.getItem(WELCOME_DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

function setWelcomeDismissed() {
  try {
    window.localStorage.setItem(WELCOME_DISMISSED_KEY, '1')
  } catch {
    /* ignore */
  }
}

/**
 * @param {{ open: boolean; onDismiss: () => void; persistDismissal?: boolean }} props
 * persistDismissal: when true (default), writes localStorage on Get Started. Demo passes false.
 */
export default function WelcomeOnboarding({ open, onDismiss, persistDismissal = true }) {
  const [index, setIndex] = useState(0)
  const touchStartX = useRef(null)

  useEffect(() => {
    if (!open) setIndex(0)
  }, [open])

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, CARDS.length - 1))
  }, [])

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0))
  }, [])

  const handleGetStarted = useCallback(() => {
    if (persistDismissal) setWelcomeDismissed()
    onDismiss()
  }, [onDismiss, persistDismissal])

  const onTouchStart = (e) => {
    const x = e.changedTouches[0]?.clientX
    touchStartX.current = typeof x === 'number' ? x : null
  }

  const onTouchEnd = (e) => {
    const start = touchStartX.current
    touchStartX.current = null
    if (start == null) return
    const end = e.changedTouches[0]?.clientX
    if (typeof end !== 'number') return
    const dx = end - start
    if (dx < -SWIPE_MIN) goNext()
    else if (dx > SWIPE_MIN) goPrev()
  }

  if (!open) return null

  const isLast = index === CARDS.length - 1

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-onboarding-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: BG,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'max(20px, env(safe-area-inset-top)) 20px max(28px, env(safe-area-inset-bottom))',
        fontFamily: "'Barlow', sans-serif",
        maxWidth: 430,
        margin: '0 auto',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        minHeight: '100dvh',
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@700;800;900&display=swap');`}</style>

      <div
        style={{
          fontSize: 22,
          fontWeight: 900,
          letterSpacing: '-0.01em',
          fontFamily: "'Barlow Condensed', sans-serif",
          textTransform: 'uppercase',
          color: DARK,
          marginBottom: 8,
        }}
      >
        BUZZ<span style={{ color: ACCENT }}>ER</span>
      </div>
      <p
        id="welcome-onboarding-title"
        style={{
          margin: '0 0 22px',
          fontSize: 13,
          fontWeight: 600,
          color: '#9C8F7A',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        Welcome
      </p>

      <div
        style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 0 }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div style={{ overflow: 'hidden', width: '100%', borderRadius: 16 }}>
          <div
            style={{
              display: 'flex',
              width: `${CARDS.length * 100}%`,
              transform: `translateX(-${(index * 100) / CARDS.length}%)`,
              transition: 'transform 280ms ease',
            }}
          >
            {CARDS.map((card, cardIdx) => {
              const cardIsLast = cardIdx === CARDS.length - 1
              const cardStyle = {
                width: '100%',
                minHeight: 260,
                border: '1.5px solid #E8E1D5',
                borderRadius: 16,
                background: '#fff',
                padding: '28px 22px',
                textAlign: 'center',
                cursor: cardIsLast ? 'default' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
                boxShadow: '0 4px 20px rgba(28,24,18,0.06)',
              }
              return (
              <div
                key={card.title}
                style={{
                  width: `${100 / CARDS.length}%`,
                  flexShrink: 0,
                  padding: '0 4px',
                  boxSizing: 'border-box',
                }}
              >
                {cardIsLast ? (
                  <div style={cardStyle}>
                    <span style={{ fontSize: 48, lineHeight: 1 }} aria-hidden>
                      {card.icon}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 800,
                        fontSize: 22,
                        letterSpacing: '0.04em',
                        color: DARK,
                        textTransform: 'uppercase',
                      }}
                    >
                      {card.title}
                    </span>
                    <span style={{ fontSize: 15, lineHeight: 1.55, color: 'rgba(28,24,18,0.78)', margin: 0 }}>{card.body}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={goNext}
                    style={cardStyle}
                    aria-label="Next tip"
                  >
                    <span style={{ fontSize: 48, lineHeight: 1 }} aria-hidden>
                      {card.icon}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 800,
                        fontSize: 22,
                        letterSpacing: '0.04em',
                        color: DARK,
                        textTransform: 'uppercase',
                      }}
                    >
                      {card.title}
                    </span>
                    <span style={{ fontSize: 15, lineHeight: 1.55, color: 'rgba(28,24,18,0.78)', margin: 0 }}>{card.body}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: ACCENT, marginTop: 6 }}>Tap or swipe for next →</span>
                  </button>
                )}
              </div>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          {CARDS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                width: i === index ? 22 : 8,
                height: 8,
                borderRadius: 999,
                border: 'none',
                padding: 0,
                background: i === index ? ACCENT : 'rgba(28,24,18,0.18)',
                cursor: 'pointer',
                transition: 'width 0.2s ease, background 0.2s ease',
              }}
            />
          ))}
        </div>
      </div>

      {isLast ? (
        <button
          type="button"
          onClick={handleGetStarted}
          style={{
            width: '100%',
            marginTop: 22,
            padding: '16px 20px',
            borderRadius: 12,
            border: 'none',
            background: ACCENT,
            color: '#fff',
            fontWeight: 800,
            fontSize: 17,
            fontFamily: 'inherit',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(212,119,58,0.35)',
          }}
        >
          Get Started
        </button>
      ) : (
        <button
          type="button"
          onClick={goNext}
          style={{
            width: '100%',
            marginTop: 22,
            padding: '14px 20px',
            borderRadius: 12,
            border: `2px solid ${DARK}`,
            background: 'transparent',
            color: DARK,
            fontWeight: 700,
            fontSize: 15,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          Next
        </button>
      )}
    </div>
  )
}
