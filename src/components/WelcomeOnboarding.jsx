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
      className="welcome-onboarding-root"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: BG,
        fontFamily: "'Barlow', sans-serif",
        maxWidth: 430,
        margin: '0 auto',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@700;800;900&display=swap');
.welcome-onboarding-root {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  overflow: hidden;
  overscroll-behavior: none;
  padding: max(12px, env(safe-area-inset-top)) 16px max(12px, env(safe-area-inset-bottom));
  min-height: 100vh;
  height: 100vh;
  max-height: 100vh;
}
@supports (height: 100dvh) {
  .welcome-onboarding-root {
    min-height: 100dvh;
    height: 100dvh;
    max-height: 100dvh;
  }
}
.welcome-onboarding-header {
  flex-shrink: 0;
  text-align: center;
}
.welcome-onboarding-wordmark {
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.01em;
  font-family: 'Barlow Condensed', sans-serif;
  text-transform: uppercase;
  color: ${DARK};
  margin-bottom: 6px;
}
.welcome-onboarding-subtitle {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 600;
  color: #9C8F7A;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.welcome-card-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  -webkit-tap-highlight-color: transparent;
}
.welcome-card-viewport {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border-radius: 16px;
  width: 100%;
}
.welcome-card-track {
  display: flex;
  height: 100%;
  width: ${CARDS.length * 100}%;
  transition: transform 280ms ease;
}
.welcome-slide-col {
  width: ${100 / CARDS.length}%;
  flex-shrink: 0;
  height: 100%;
  min-height: 0;
  padding: 0 4px;
  box-sizing: border-box;
  display: flex;
  align-items: stretch;
}
.welcome-card {
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border: 1.5px solid #E8E1D5;
  border-radius: 16px;
  background: #fff;
  padding: 18px 18px 16px;
  text-align: center;
  font-family: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  box-shadow: 0 4px 20px rgba(28,24,18,0.06);
  box-sizing: border-box;
}
.welcome-card--button {
  cursor: pointer;
}
.welcome-card--static {
  cursor: default;
}
.welcome-card-icon {
  font-size: 44px;
  line-height: 1;
  flex-shrink: 0;
}
.welcome-card-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 800;
  font-size: 20px;
  letter-spacing: 0.04em;
  color: ${DARK};
  text-transform: uppercase;
  flex-shrink: 0;
}
.welcome-card-body {
  font-size: 14px;
  line-height: 1.5;
  color: rgba(28,24,18,0.78);
  margin: 0;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 8;
  line-clamp: 8;
  align-self: stretch;
}
.welcome-card-hint {
  font-size: 12px;
  font-weight: 700;
  color: ${ACCENT};
  margin-top: 2px;
  flex-shrink: 0;
}
.welcome-onboarding-footer {
  flex-shrink: 0;
  padding-top: 12px;
}
.welcome-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 10px;
}
.welcome-dot {
  height: 8px;
  border-radius: 999px;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: width 0.2s ease, background 0.2s ease;
}
.welcome-dot--on {
  width: 22px;
  background: ${ACCENT};
}
.welcome-dot--off {
  width: 8px;
  background: rgba(28,24,18,0.18);
}
.welcome-btn-primary {
  width: 100%;
  padding: 14px 18px;
  border-radius: 12px;
  border: none;
  background: ${ACCENT};
  color: #fff;
  font-weight: 800;
  font-size: 16px;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(212,119,58,0.35);
}
.welcome-btn-secondary {
  width: 100%;
  padding: 12px 18px;
  border-radius: 12px;
  border: 2px solid ${DARK};
  background: transparent;
  color: ${DARK};
  font-weight: 700;
  font-size: 15px;
  font-family: inherit;
  cursor: pointer;
}
@media (max-height: 700px) {
  .welcome-onboarding-root {
    padding: max(8px, env(safe-area-inset-top)) 12px max(10px, env(safe-area-inset-bottom));
  }
  .welcome-onboarding-wordmark {
    font-size: 18px;
    margin-bottom: 4px;
  }
  .welcome-onboarding-subtitle {
    font-size: 11px;
    margin-bottom: 8px;
    letter-spacing: 0.06em;
  }
  .welcome-card {
    padding: 14px 12px;
    gap: 7px;
    border-radius: 14px;
  }
  .welcome-card-icon {
    font-size: 34px;
  }
  .welcome-card-title {
    font-size: 16px;
    letter-spacing: 0.03em;
  }
  .welcome-card-body {
    font-size: 12px;
    line-height: 1.42;
    -webkit-line-clamp: 7;
    line-clamp: 7;
  }
  .welcome-card-hint {
    font-size: 11px;
    margin-top: 0;
  }
  .welcome-onboarding-footer {
    padding-top: 8px;
  }
  .welcome-dots {
    margin-bottom: 8px;
  }
  .welcome-btn-primary {
    padding: 11px 16px;
    font-size: 15px;
  }
  .welcome-btn-secondary {
    padding: 10px 16px;
    font-size: 14px;
  }
}
`}</style>

      <div className="welcome-onboarding-header">
        <div className="welcome-onboarding-wordmark">
          BUZZ<span style={{ color: ACCENT }}>ER</span>
        </div>
        <p id="welcome-onboarding-title" className="welcome-onboarding-subtitle">
          Welcome
        </p>
      </div>

      <div className="welcome-card-wrap" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="welcome-card-viewport">
          <div
            className="welcome-card-track"
            style={{
              transform: `translateX(-${(index * 100) / CARDS.length}%)`,
            }}
          >
            {CARDS.map((card, cardIdx) => {
              const cardIsLast = cardIdx === CARDS.length - 1
              return (
                <div key={card.title} className="welcome-slide-col">
                  {cardIsLast ? (
                    <div className="welcome-card welcome-card--static">
                      <span className="welcome-card-icon" aria-hidden>
                        {card.icon}
                      </span>
                      <span className="welcome-card-title">{card.title}</span>
                      <span className="welcome-card-body">{card.body}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="welcome-card welcome-card--button"
                      onClick={goNext}
                      aria-label="Next tip"
                    >
                      <span className="welcome-card-icon" aria-hidden>
                        {card.icon}
                      </span>
                      <span className="welcome-card-title">{card.title}</span>
                      <span className="welcome-card-body">{card.body}</span>
                      <span className="welcome-card-hint">Tap or swipe for next →</span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="welcome-onboarding-footer">
        <div className="welcome-dots">
          {CARDS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`welcome-dot ${i === index ? 'welcome-dot--on' : 'welcome-dot--off'}`}
            />
          ))}
        </div>
        {isLast ? (
          <button type="button" onClick={handleGetStarted} className="welcome-btn-primary">
            Get Started
          </button>
        ) : (
          <button type="button" onClick={goNext} className="welcome-btn-secondary">
            Next
          </button>
        )}
      </div>
    </div>
  )
}
