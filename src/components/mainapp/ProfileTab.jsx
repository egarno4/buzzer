import { useState } from 'react'
import { Avatar } from './shared'

const SUPPORT_EMAIL = 'support@buzzer.nyc'

const HELP_ACTIONS = [
  { label: 'Change your address', subject: 'Change My Address' },
  { label: 'Delete your account', subject: 'Delete My Account' },
  { label: 'Report a problem', subject: 'Report a Problem' },
  { label: 'General inquiry', subject: 'General Inquiry' },
]

const rowStyle = {
  padding: '15px 16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: 14,
  color: '#111',
}

export default function ProfileTab({ user, onSignOut }) {
  const [showHelp, setShowHelp] = useState(false)

  if (showHelp) {
    return (
      <div style={{ paddingBottom: 110, fontFamily: "'Barlow', sans-serif" }}>
        <button
          type="button"
          onClick={() => setShowHelp(false)}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '0 0 16px',
            fontSize: 14,
            fontWeight: 700,
            color: '#9C8F7A',
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span aria-hidden>←</span> Back to Profile
        </button>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            margin: '0 0 18px',
            color: '#1C1812',
            fontFamily: "'Barlow', sans-serif",
            lineHeight: 1.2,
          }}
        >
          Help & Support
        </h1>
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            border: '1.5px solid #efefef',
            overflow: 'hidden',
          }}
        >
          {HELP_ACTIONS.map((action, i) => (
            <a
              key={action.subject}
              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(action.subject)}`}
              style={{
                ...rowStyle,
                borderBottom: i < HELP_ACTIONS.length - 1 ? '1px solid #f5f5f5' : 'none',
                textDecoration: 'none',
                color: '#111',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span>{action.label}</span>
              <span style={{ color: '#D4773A', fontWeight: 700 }}>›</span>
            </a>
          ))}
        </div>
        <p
          style={{
            fontSize: 13,
            color: '#9C8F7A',
            textAlign: 'center',
            margin: '20px 8px 0',
            lineHeight: 1.5,
          }}
        >
          We typically respond within 24 hours
        </p>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: 110 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 12, border: '1.5px solid #efefef' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <Avatar name={user.name} size={52} />
          <div><div style={{ fontWeight: 800, fontSize: 18 }}>{user.name}</div><div style={{ fontSize: 13, color: '#999' }}>Unit {user.unit}</div></div>
        </div>
        <div style={{ background: '#f5f5f5', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#666', display: 'flex', gap: 8 }}>
          <span>🏢</span><span>{user.building}</span>
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #efefef', overflow: 'hidden' }}>
        <div style={{ ...rowStyle, borderBottom: '1px solid #f5f5f5' }}>
          Notification Settings<span style={{ color: '#ddd' }}>›</span>
        </div>
        <button
          type="button"
          onClick={() => setShowHelp(true)}
          style={{
            ...rowStyle,
            borderBottom: '1px solid #f5f5f5',
            width: '100%',
            background: 'transparent',
            borderLeft: 'none',
            borderRight: 'none',
            borderTop: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'left',
          }}
        >
          Help & Support<span style={{ color: '#ddd' }}>›</span>
        </button>
        <div
          role="button"
          tabIndex={0}
          onClick={onSignOut}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSignOut()}
          style={{ ...rowStyle, cursor: 'pointer', color: '#e63946' }}
        >
          Sign Out
        </div>
      </div>
    </div>
  )
}
