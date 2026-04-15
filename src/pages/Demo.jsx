import { useMemo, useState } from 'react'
import WelcomeOnboarding from '../components/WelcomeOnboarding'
import FeedTab from '../components/mainapp/FeedTab'
import MyPackagesTab from '../components/mainapp/MyPackagesTab'
import { Avatar } from '../components/mainapp/shared'

const BUILDING = '247 Rivington St, Manhattan'
const DEMO_USER = {
  name: 'Alex',
  unit: '3B',
  building: BUILDING,
}

const noop = () => {}

function DemoProfile() {
  const rowStyle = {
    padding: '15px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 14,
    color: '#111',
  }

  return (
    <div style={{ paddingBottom: 110 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 12, border: '1.5px solid #efefef' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <Avatar name={DEMO_USER.name} size={52} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{DEMO_USER.name}</div>
            <div style={{ fontSize: 13, color: '#999' }}>Unit {DEMO_USER.unit}</div>
          </div>
        </div>
        <div
          style={{
            background: '#f5f5f5',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 14,
            color: '#666',
            display: 'flex',
            gap: 8,
          }}
        >
          <span>🏢</span>
          <span>{DEMO_USER.building}</span>
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #efefef', overflow: 'hidden' }}>
        <button
          type="button"
          onClick={noop}
          style={{
            ...rowStyle,
            borderBottom: '1px solid #f5f5f5',
            width: '100%',
            background: 'transparent',
            borderLeft: 'none',
            borderRight: 'none',
            borderTop: 'none',
            cursor: 'default',
            fontFamily: 'inherit',
            textAlign: 'left',
          }}
        >
          Notification Settings<span style={{ color: '#ddd' }}>›</span>
        </button>
        <button
          type="button"
          onClick={noop}
          style={{
            ...rowStyle,
            borderBottom: '1px solid #f5f5f5',
            width: '100%',
            background: 'transparent',
            borderLeft: 'none',
            borderRight: 'none',
            borderTop: 'none',
            cursor: 'default',
            fontFamily: 'inherit',
            textAlign: 'left',
          }}
        >
          Help & Support<span style={{ color: '#ddd' }}>›</span>
        </button>
        <div
          role="presentation"
          style={{ ...rowStyle, borderBottom: '1px solid #f5f5f5', color: '#e63946', cursor: 'default', opacity: 0.7 }}
        >
          Sign Out
        </div>
        <div role="presentation" style={{ ...rowStyle, color: '#e63946', cursor: 'default', opacity: 0.7 }}>
          Delete Account
        </div>
      </div>
    </div>
  )
}

export default function Demo() {
  const [tab, setTab] = useState('packages')
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(true)

  const pkgTimestamp = useMemo(() => new Date().toISOString(), [])

  const mockPkgs = useMemo(
    () => [
      {
        id: 'demo-pkg-1',
        loggedBy: 'Sarah',
        loggerUnit: '1A',
        timestamp: pkgTimestamp,
        status: 'waiting',
        note: 'Left by the mailboxes, looks like Amazon',
        subheadline: 'Sarah spotted a package for you in the lobby',
      },
    ],
    [pkgTimestamp],
  )

  const feedTimes = useMemo(() => {
    const now = Date.now()
    return {
      julia: new Date(now - 50 * 60 * 1000).toISOString(),
      marcus: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
      tom: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
    }
  }, [])

  const mockFeed = useMemo(
    () => [
      {
        id: 'demo-req-julia',
        requester: 'Julia',
        requesterUnit: '2B',
        timestamp: feedTimes.julia,
        note: "UPS says delivered, won't be home until 8pm — can someone grab it?",
        volunteers: [
          { name: 'Marcus', unit: '4C' },
          { name: 'Tom', unit: '5D' },
        ],
        status: 'open',
        chosenVolunteer: null,
      },
      {
        id: 'demo-req-marcus',
        requester: 'Marcus',
        requesterUnit: '4C',
        timestamp: feedTimes.marcus,
        note: 'FedEx package by front door, please grab before it walks!',
        volunteers: [{ name: 'Sarah', unit: '1A' }],
        status: 'claimed',
        chosenVolunteer: { name: 'Sarah', unit: '1A' },
      },
      {
        id: 'demo-req-tom',
        requester: 'Tom',
        requesterUnit: '5D',
        timestamp: feedTimes.tom,
        note: 'Away for the weekend, expecting a few deliveries',
        volunteers: [],
        status: 'open',
        chosenVolunteer: null,
      },
    ],
    [feedTimes],
  )

  const myActive = mockPkgs.filter((p) => p.status === 'waiting').length
  const feedOpen = mockFeed.filter((p) => p.status === 'open').length

  const tabs = [
    { id: 'packages', label: 'My Packages', icon: '📦', badge: myActive },
    { id: 'feed', label: 'Building', icon: '🏢', badge: feedOpen },
    { id: 'profile', label: 'Profile', icon: '👤', badge: 0 },
  ]

  return (
    <div
      style={{
        fontFamily: "'Barlow', sans-serif",
        maxWidth: 430,
        margin: '0 auto',
        minHeight: '100vh',
        background: '#F5F0E8',
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@700;800;900&display=swap');*{-webkit-tap-highlight-color:transparent;box-sizing:border-box;}`}</style>

      <div
        style={{
          background: '#fef3ec',
          borderBottom: '1px solid #E8E1D5',
          padding: '12px 16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 10,
            justifyContent: 'space-between',
          }}
        >
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45, color: '#5c4a3a', flex: '1 1 200px' }}>
            👋 This is a live demo — sign up at buzzer.nyc to join your building
          </p>
          <a
            href="https://buzzer.nyc"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flexShrink: 0,
              padding: '8px 14px',
              background: '#D4773A',
              color: '#fff',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 13,
              textDecoration: 'none',
              fontFamily: 'inherit',
            }}
          >
            Sign Up
          </a>
        </div>
      </div>

      <div
        style={{
          background: '#F5F0E8',
          padding: '52px 20px 14px',
          borderBottom: '1px solid #E8E1D5',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                letterSpacing: '-0.01em',
                fontFamily: "'Barlow Condensed', sans-serif",
                textTransform: 'uppercase',
              }}
            >
              BUZZ<span style={{ color: '#D4773A' }}>ER</span>
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#9C8F7A',
                marginTop: 1,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {BUILDING}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1C1812', marginTop: 6 }}>
              {DEMO_USER.name} · Unit {DEMO_USER.unit}
            </div>
          </div>
          {tab !== 'profile' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={noop}
                style={{
                  background: '#fff',
                  color: '#D4773A',
                  border: '1.5px solid #D4773A',
                  borderRadius: 20,
                  padding: '8px 13px',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'default',
                  fontFamily: 'inherit',
                }}
              >
                Spotted one
              </button>
              <button
                type="button"
                onClick={noop}
                style={{
                  background: '#D4773A',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 20,
                  padding: '8px 13px',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'default',
                  fontFamily: 'inherit',
                }}
              >
                Need help
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {tab === 'packages' && <MyPackagesTab pkgs={mockPkgs} onGetHelp={noop} onDismiss={noop} />}
        {tab === 'feed' && (
          <FeedTab
            feed={mockFeed}
            myUnit={DEMO_USER.unit}
            onVolunteer={noop}
            onChoose={noop}
            onMarkCollected={noop}
          />
        )}
        {tab === 'profile' && <DemoProfile />}
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 430,
          background: '#F5F0E8',
          borderTop: '1px solid #E8E1D5',
          display: 'flex',
          paddingBottom: 20,
          zIndex: 20,
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: '12px 0 4px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              fontFamily: 'inherit',
              position: 'relative',
            }}
          >
            {t.badge > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  left: '55%',
                  background: '#D4773A',
                  color: '#fff',
                  borderRadius: 10,
                  fontSize: 10,
                  fontWeight: 800,
                  minWidth: 16,
                  height: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                }}
              >
                {t.badge}
              </div>
            )}
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: tab === t.id ? 700 : 400,
                color: tab === t.id ? '#D4773A' : '#9C8F7A',
              }}
            >
              {t.label}
            </span>
          </button>
        ))}
      </div>

      <WelcomeOnboarding
        open={showWelcomeOverlay}
        onDismiss={() => setShowWelcomeOverlay(false)}
        persistDismissal={false}
      />
    </div>
  )
}
