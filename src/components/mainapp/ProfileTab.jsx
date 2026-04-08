import { useEffect, useState } from 'react'
import { Avatar } from './shared'

const SUPPORT_EMAIL = 'support@buzzer.nyc'

const HELP_ACTIONS = [
  { label: 'Change your address', subject: 'Change My Address' },
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

const creamScreenStyle = {
  paddingBottom: 110,
  fontFamily: "'Barlow', sans-serif",
  minHeight: '100%',
  background: '#F5F0E8',
  margin: '0 -16px',
  paddingLeft: 16,
  paddingRight: 16,
  paddingTop: 0,
}

const backBtnStyle = {
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
}

function EmailToggle({ on, disabled, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Email notifications"
      disabled={disabled}
      onClick={onToggle}
      style={{
        width: 52,
        height: 30,
        borderRadius: 15,
        border: 'none',
        background: on ? '#D4773A' : '#d4cfc6',
        position: 'relative',
        cursor: disabled ? 'wait' : 'pointer',
        flexShrink: 0,
        transition: 'background 0.2s ease',
        padding: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: on ? 25 : 3,
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 4px rgba(28, 24, 18, 0.2)',
          transition: 'left 0.2s ease',
        }}
      />
    </button>
  )
}

export default function ProfileTab({ user, onSignOut, onUpdateEmailNotifications, onDeleteAccount }) {
  const [subScreen, setSubScreen] = useState(null)
  const [emailOn, setEmailOn] = useState(true)
  const [savingEmailPref, setSavingEmailPref] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  useEffect(() => {
    if (subScreen === 'notifications') {
      setEmailOn(user.emailNotifications !== false)
    }
  }, [subScreen, user.emailNotifications])

  async function handleEmailToggle() {
    if (!onUpdateEmailNotifications || savingEmailPref) return
    const next = !emailOn
    setEmailOn(next)
    setSavingEmailPref(true)
    const ok = await onUpdateEmailNotifications(next)
    setSavingEmailPref(false)
    if (!ok) {
      setEmailOn(!next)
      window.alert('Could not update notification settings. Please try again.')
    }
  }

  async function handleConfirmDeleteAccount() {
    if (!onDeleteAccount || deletingAccount) return
    setDeletingAccount(true)
    const result = await onDeleteAccount()
    setDeletingAccount(false)
    if (!result.ok) {
      window.alert(result.error || 'Could not delete your account. Please try again or contact support.')
    }
  }

  if (subScreen === 'help') {
    return (
      <div style={creamScreenStyle}>
        <button type="button" onClick={() => setSubScreen(null)} style={backBtnStyle}>
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

  if (subScreen === 'notifications') {
    return (
      <div style={creamScreenStyle}>
        <button type="button" onClick={() => setSubScreen(null)} style={backBtnStyle}>
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
          Notification Settings
        </h1>
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            border: '1.5px solid #efefef',
            padding: '18px 16px 20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1C1812' }}>Email Notifications</span>
            <EmailToggle on={emailOn} disabled={savingEmailPref} onToggle={handleEmailToggle} />
          </div>
          <p
            style={{
              margin: '14px 0 0',
              fontSize: 14,
              lineHeight: 1.55,
              color: '#6b6458',
            }}
          >
            Get emailed when a neighbor spots a package for you, or when someone volunteers to help
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: 110, position: 'relative' }}>
      {showDeleteModal ? (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(28, 24, 18, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            fontFamily: "'Barlow', sans-serif",
          }}
          onClick={() => !deletingAccount && setShowDeleteModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            style={{
              background: '#F5F0E8',
              borderRadius: 20,
              border: '1.5px solid #E8E1D5',
              boxShadow: '0 16px 48px rgba(28, 24, 18, 0.18)',
              maxWidth: 340,
              width: '100%',
              padding: '22px 20px 20px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="delete-account-title"
              style={{
                margin: '0 0 12px',
                fontSize: 20,
                fontWeight: 800,
                color: '#1C1812',
                lineHeight: 1.25,
              }}
            >
              Delete your account?
            </h2>
            <p
              style={{
                margin: '0 0 22px',
                fontSize: 15,
                lineHeight: 1.55,
                color: '#5c554a',
              }}
            >
              {
                "This will permanently delete your profile and remove you from your building's network. This cannot be undone."
              }
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                disabled={deletingAccount}
                onClick={() => setShowDeleteModal(false)}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1.5px solid #D4CFC6',
                  background: 'transparent',
                  color: '#5c554a',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: deletingAccount ? 'wait' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingAccount}
                onClick={handleConfirmDeleteAccount}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: 'none',
                  background: '#e63946',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: deletingAccount ? 'wait' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {deletingAccount ? 'Deleting…' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
        <button
          type="button"
          onClick={() => setSubScreen('notifications')}
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
          Notification Settings<span style={{ color: '#ddd' }}>›</span>
        </button>
        <button
          type="button"
          onClick={() => setSubScreen('help')}
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
          style={{ ...rowStyle, borderBottom: '1px solid #f5f5f5', cursor: 'pointer', color: '#e63946' }}
        >
          Sign Out
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => onDeleteAccount && setShowDeleteModal(true)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onDeleteAccount && setShowDeleteModal(true)}
          style={{ ...rowStyle, cursor: onDeleteAccount ? 'pointer' : 'default', color: '#e63946', opacity: onDeleteAccount ? 1 : 0.5 }}
        >
          Delete Account
        </div>
      </div>
    </div>
  )
}
