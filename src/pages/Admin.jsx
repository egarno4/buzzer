import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD

function redirectBase() {
  if (typeof window === 'undefined') return 'https://buzzer.nyc'
  return `${window.location.protocol}//${window.location.host}`
}

export default function Admin() {
  const [password, setPassword] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [approvingId, setApprovingId] = useState(null)
  const [lastMagicLink, setLastMagicLink] = useState('')

  const loadPending = useCallback(async (pwd) => {
    setLoading(true)
    setError('')
    const { data, error: fnErr } = await supabase.functions.invoke('admin-portal', {
      body: {
        action: 'list',
        password: pwd,
      },
    })
    setLoading(false)
    if (fnErr) {
      setError(fnErr.message || 'Request failed')
      return false
    }
    if (!data?.ok) {
      setError(data?.error || 'Unauthorized or server error')
      return false
    }
    setRows(data.rows || [])
    return true
  }, [])

  async function handleUnlock(e) {
    e.preventDefault()
    if (!ADMIN_PASSWORD) {
      setError('VITE_ADMIN_PASSWORD is not set in the app environment.')
      return
    }
    if (password.trim() !== ADMIN_PASSWORD) {
      setError('Incorrect password.')
      return
    }
    const ok = await loadPending(password.trim())
    if (ok) setUnlocked(true)
  }

  async function handleApprove(userId) {
    setApprovingId(userId)
    setError('')
    const { data, error: fnErr } = await supabase.functions.invoke('admin-portal', {
      body: {
        action: 'approve',
        password: password.trim(),
        userId,
        redirectBase: redirectBase(),
      },
    })
    setApprovingId(null)
    setLastMagicLink('')
    if (fnErr) {
      setError(fnErr.message || 'Request failed')
      return
    }
    if (!data?.ok) {
      setError(typeof data?.error === 'string' ? data.error : data?.error?.message || 'Approve failed')
      if (data?.magicLink) setLastMagicLink(data.magicLink)
      if (data?.magicLink) setRows((r) => r.filter((x) => x.id !== userId))
      return
    }
    setRows((r) => r.filter((x) => x.id !== userId))
  }

  if (!ADMIN_PASSWORD) {
    return (
      <div style={{ fontFamily: "'Barlow', sans-serif", maxWidth: 560, margin: '48px auto', padding: 24 }}>
        <h1 style={{ fontSize: 22, color: '#1C1812' }}>Admin</h1>
        <p style={{ color: '#b42318' }}>Set <code>VITE_ADMIN_PASSWORD</code> in <code>.env</code> and redeploy the app.</p>
        <p style={{ color: '#666', fontSize: 14 }}>
          Set the same value as the Edge secret <code>ADMIN_PASSWORD</code> for the <code>admin-portal</code> function.
        </p>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "'Barlow', sans-serif", maxWidth: 900, margin: '0 auto', minHeight: '100vh', background: '#F5F0E8', padding: '24px 16px 48px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&display=swap');code{font-size:13px;background:#eee;padding:2px 6px;border-radius:4px}`}</style>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1C1812', marginBottom: 8 }}>Buzzer admin</h1>
      <p style={{ color: '#6b6458', marginBottom: 24, fontSize: 14 }}>
        Approve pending residents and email them a one-tap magic link to <strong>/app</strong>.
      </p>

      {!unlocked ? (
        <form onSubmit={handleUnlock} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1.5px solid #E8E1D5', maxWidth: 400 }}>
          <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#555', marginBottom: 8 }}>Admin password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: '1.5px solid #e8e8e8',
              fontSize: 15,
              marginBottom: 12,
              fontFamily: 'inherit',
            }}
            autoComplete="off"
          />
          {error ? <p style={{ color: '#b42318', fontSize: 14, marginBottom: 12 }}>{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 20px',
              background: '#D4773A',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {loading ? 'Loading…' : 'Unlock'}
          </button>
        </form>
      ) : (
        <>
          {error ? (
            <div style={{ background: '#fde8e8', color: '#7f1d1d', padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 14 }}>
              {error}
              {lastMagicLink ? (
                <div style={{ marginTop: 10 }}>
                  <a href={lastMagicLink} style={{ color: '#1d4ed8', wordBreak: 'break-all' }} target="_blank" rel="noopener noreferrer">
                    Open magic link
                  </a>
                </div>
              ) : null}
            </div>
          ) : null}
          <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 16, border: '1.5px solid #E8E1D5' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #eee', textAlign: 'left' }}>
                  <th style={{ padding: '12px 14px', color: '#9C8F7A', fontWeight: 700 }}>Name</th>
                  <th style={{ padding: '12px 14px', color: '#9C8F7A', fontWeight: 700 }}>Address</th>
                  <th style={{ padding: '12px 14px', color: '#9C8F7A', fontWeight: 700 }}>Unit</th>
                  <th style={{ padding: '12px 14px', color: '#9C8F7A', fontWeight: 700 }}>Proof</th>
                  <th style={{ padding: '12px 14px', color: '#9C8F7A', fontWeight: 700 }}> </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 24, color: '#999', textAlign: 'center' }}>
                      No pending profiles.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1C1812' }}>
                        {r.first_name} {r.last_name}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#444' }}>{r.address}</td>
                      <td style={{ padding: '12px 14px', color: '#444' }}>{r.unit}</td>
                      <td style={{ padding: '12px 14px' }}>
                        {r.proof_signed_url ? (
                          <a href={r.proof_signed_url} target="_blank" rel="noopener noreferrer" style={{ color: '#D4773A', fontWeight: 700 }}>
                            View proof
                          </a>
                        ) : (
                          <span style={{ color: '#bbb' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <button
                          type="button"
                          disabled={approvingId === r.id}
                          onClick={() => handleApprove(r.id)}
                          style={{
                            padding: '8px 14px',
                            background: '#1C1812',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: approvingId === r.id ? 'wait' : 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          {approvingId === r.id ? '…' : 'Approve'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: 16, fontSize: 12, color: '#9C8F7A' }}>
            Redirect base for magic links: <strong>{redirectBase()}</strong> — add <code>{redirectBase()}/app</code> to Supabase Auth redirect URLs.
          </p>
        </>
      )}
    </div>
  )
}
