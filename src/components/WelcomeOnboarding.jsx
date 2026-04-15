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
  padding: max(10px, env(safe-area-inset-top)) 18px max(12px, env(safe-area-inset-bottom));
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
  font-size: 34px;
  font-weight: 900;
  letter-spacing: -0.02em;
  font-family: 'Barlow Condensed', sans-serif;
  text-transform: uppercase;
  color: ${DARK};
  line-height: 1;
  margin-bottom: 10px;
}
.welcome-onboarding-subtitle {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 700;
  color: #9C8F7A;
  text-transform: uppercase;
  letter-spacing: 0.12em;
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
  padding: 0 6px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}
.welcome-slide-inner {
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 14px;
  padding: 4px 0 8px;
  box-sizing: border-box;
  background: transparent;
  border: none;
  font-family: inherit;
}
.welcome-slide-inner--button {
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}
.welcome-slide-inner--static {
  cursor: default;
}
.welcome-slide-icon {
  font-size: 60px;
  line-height: 1;
  flex-shrink: 0;
}
.welcome-slide-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 800;
  font-size: 30px;
  letter-spacing: 0.04em;
  color: ${DARK};
  text-transform: uppercase;
  line-height: 1.08;
  flex-shrink: 0;
}
.welcome-slide-body {
  font-size: 16px;
  line-height: 1.5;
  font-weight: 500;
  color: rgba(28,24,18,0.82);
  margin: 0;
  max-width: 280px;
  width: 100%;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 9;
  line-clamp: 9;
}
.welcome-slide-hint {
  font-size: 14px;
  font-weight: 700;
  color: ${ACCENT};
  flex-shrink: 0;
  margin-top: 2px;
}
.welcome-onboarding-footer {
  flex-shrink: 0;
  padding-top: 18px;
}
.welcome-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 14px;
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
  padding: 13px 18px;
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
    padding: max(6px, env(safe-area-inset-top)) 14px max(8px, env(safe-area-inset-bottom));
  }
  .welcome-onboarding-wordmark {
    font-size: 28px;
    margin-bottom: 6px;
  }
  .welcome-onboarding-subtitle {
    font-size: 12px;
    margin-bottom: 4px;
    letter-spacing: 0.1em;
  }
  .welcome-slide-inner {
    gap: 10px;
    padding: 2px 0 4px;
  }
  .welcome-slide-icon {
    font-size: 54px;
  }
  .welcome-slide-title {
    font-size: 26px;
    letter-spacing: 0.03em;
  }
  .welcome-slide-body {
    font-size: 14px;
    line-height: 1.45;
    -webkit-line-clamp: 7;
    line-clamp: 7;
  }
  .welcome-slide-hint {
    font-size: 12px;
  }
  .welcome-onboarding-footer {
    padding-top: 12px;
  }
  .welcome-dots {
    margin-bottom: 10px;
  }
  .welcome-btn-primary {
    padding: 12px 16px;
    font-size: 15px;
  }
  .welcome-btn-secondary {
    padding: 11px 16px;
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
                    <div className="welcome-slide-inner welcome-slide-inner--static">
                      <span className="welcome-slide-icon" aria-hidden>
                        {card.icon}
                      </span>
                      <span className="welcome-slide-title">{card.title}</span>
                      <span className="welcome-slide-body">{card.body}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="welcome-slide-inner welcome-slide-inner--button"
                      onClick={goNext}
                      aria-label="Next tip"
                    >
                      <span className="welcome-slide-icon" aria-hidden>
                        {card.icon}
                      </span>
                      <span className="welcome-slide-title">{card.title}</span>
                      <span className="welcome-slide-body">{card.body}</span>
                      <span className="welcome-slide-hint">Tap or swipe for next →</span>
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
