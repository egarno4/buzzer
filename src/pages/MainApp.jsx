import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const MOCK_USER = { unit: '4B', name: 'Ed', building: '247 Rivington St' }

const INIT_MY_PACKAGES = [
  {
    id: 1,
    loggedBy: 'Sarah',
    loggerUnit: '1A',
    timestamp: new Date(Date.now() - 1000 * 60 * 18),
    status: 'waiting',
    note: 'Left by the mailboxes, brought it inside',
    holderUnit: '1A',
  },
]

const INIT_FEED = [
  {
    id: 101,
    requester: 'Julia',
    requesterUnit: '4C',
    timestamp: new Date(Date.now() - 1000 * 60 * 12),
    note: "UPS says delivered — can anyone grab it? Home by 7pm",
    volunteers: [
      { name: 'Marcus', unit: '3C' },
      { name: 'Tom', unit: '2B' },
    ],
    status: 'open',
    chosenVolunteer: null,
  },
  {
    id: 102,
    requester: 'Priya',
    requesterUnit: '2A',
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    note: "Expecting a FedEx today, won't be back until late",
    volunteers: [],
    status: 'open',
    chosenVolunteer: null,
  },
  {
    id: 103,
    requester: 'James',
    requesterUnit: '5D',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    note: 'Package by front door — someone please grab it',
    volunteers: [{ name: 'Sarah', unit: '1A' }],
    status: 'claimed',
    chosenVolunteer: { name: 'Sarah', unit: '1A' },
  },
]

function timeAgo(date) {
  const mins = Math.floor((Date.now() - date) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function Avatar({ name, size = 36 }) {
  const colors = ['#2D6A4F', '#1B4332', '#40916C', '#276749', '#52B788']
  const c = colors[name.charCodeAt(0) % colors.length]
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: c,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: size * 0.38,
        flexShrink: 0,
      }}
    >
      {name[0].toUpperCase()}
    </div>
  )
}

function SectionLabel({ text, dim }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: dim ? '#c0c0c0' : '#999',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: 10,
      }}
    >
      {text}
    </div>
  )
}

function FieldLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: '#999',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '13px 14px',
  borderRadius: 10,
  border: '1.5px solid #e8e8e8',
  fontSize: 15,
  fontFamily: 'inherit',
  background: '#fafafa',
  outline: 'none',
}

function Sheet({ children }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'flex-end',
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '22px 22px 0 0',
          padding: '8px 20px 40px',
          width: '100%',
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            background: '#e0e0e0',
            borderRadius: 2,
            margin: '12px auto 20px',
          }}
        />
        {children}
      </div>
    </div>
  )
}

function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '70px 20px', color: '#aaa' }}>
      <div style={{ fontSize: 42, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 16, color: '#888', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 14, lineHeight: 1.5 }}>{sub}</div>
    </div>
  )
}

function MyPackagesTab({ pkgs, onCollected }) {
  const active = pkgs.filter((p) => p.status === 'waiting')
  const done = pkgs.filter((p) => p.status === 'collected')
  if (pkgs.length === 0)
    return (
      <EmptyState
        icon="📭"
        title="No packages right now"
        sub="You'll be notified privately when a neighbor spots one for you"
      />
    )
  return (
    <div style={{ paddingBottom: 110 }}>
      {active.length > 0 && (
        <>
          <SectionLabel text={`Waiting · ${active.length}`} />
          {active.map((p) => (
            <MyPkgCard key={p.id} pkg={p} onCollected={onCollected} />
          ))}
        </>
      )}
      {done.length > 0 && (
        <>
          <SectionLabel text={`Collected · ${done.length}`} dim />
          {done.map((p) => (
            <MyPkgCard key={p.id} pkg={p} onCollected={onCollected} />
          ))}
        </>
      )}
    </div>
  )
}

function MyPkgCard({ pkg, onCollected }) {
  const done = pkg.status === 'collected'
  return (
    <div
      style={{
        background: done ? '#fafafa' : '#fff',
        border: `1.5px solid ${done ? '#efefef' : '#D4773A'}`,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        opacity: done ? 0.6 : 1,
        boxShadow: done ? 'none' : '0 2px 14px rgba(212,119,58,0.10)',
      }}
    >
      <div style={{ display: 'flex', gap: 12 }}>
        <Avatar name={pkg.loggedBy} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>
              {pkg.loggedBy}
              <span style={{ fontWeight: 400, color: '#999', fontSize: 13 }}>
                {' '}
                · Unit {pkg.loggerUnit}
              </span>
            </span>
            <span style={{ fontSize: 12, color: '#c0c0c0' }}>{timeAgo(pkg.timestamp)}</span>
          </div>
          <div style={{ fontSize: 14, color: '#555', marginTop: 5 }}>
            {done ? 'Held your package · Collected ✓' : `Holding your package in Unit ${pkg.holderUnit}`}
          </div>
          {pkg.note && (
            <div
              style={{
                marginTop: 8,
                background: '#f4f4f4',
                borderRadius: 8,
                padding: '7px 10px',
                fontSize: 13,
                color: '#666',
                fontStyle: 'italic',
              }}
            >
              &ldquo;{pkg.note}&rdquo;
            </div>
          )}
          {!done && (
            <button
              type="button"
              onClick={() => onCollected(pkg.id)}
              style={{
                marginTop: 12,
                width: '100%',
                padding: 11,
                background: '#D4773A',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Mark as Collected
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function FeedTab({ feed, onVolunteer, onChoose }) {
  const open = feed.filter((p) => p.status === 'open')
  const claimed = feed.filter((p) => p.status === 'claimed')
  if (feed.length === 0) return <EmptyState icon="🙌" title="All clear" sub="No open requests right now" />
  return (
    <div style={{ paddingBottom: 110 }}>
      {open.length > 0 && (
        <>
          <SectionLabel text={`Needs help · ${open.length}`} />
          {open.map((p) => (
            <FeedCard key={p.id} post={p} onVolunteer={onVolunteer} onChoose={onChoose} />
          ))}
        </>
      )}
      {claimed.length > 0 && (
        <>
          <SectionLabel text={`Sorted · ${claimed.length}`} dim />
          {claimed.map((p) => (
            <FeedCard key={p.id} post={p} onVolunteer={onVolunteer} onChoose={onChoose} />
          ))}
        </>
      )}
    </div>
  )
}

function FeedCard({ post, onVolunteer, onChoose }) {
  const isMine = post.requesterUnit === MOCK_USER.unit
  const claimed = post.status === 'claimed'
  const hasVol = post.volunteers.some((v) => v.unit === MOCK_USER.unit)
  const [open, setOpen] = useState(false)
  return (
    <div
      style={{
        background: claimed ? '#fafafa' : '#fff',
        border: `1.5px solid ${isMine && !claimed ? '#D4773A' : '#efefef'}`,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        opacity: claimed ? 0.65 : 1,
      }}
    >
      {isMine && !claimed && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#D4773A',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 8,
          }}
        >
          Your request
        </div>
      )}
      <div style={{ display: 'flex', gap: 12 }}>
        <Avatar name={post.requester} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>
              {post.requester}
              <span style={{ fontWeight: 400, color: '#999', fontSize: 13 }}>
                {' '}
                · Unit {post.requesterUnit}
              </span>
            </span>
            <span style={{ fontSize: 12, color: '#c0c0c0' }}>{timeAgo(post.timestamp)}</span>
          </div>
          {post.note && (
            <div style={{ fontSize: 14, color: '#444', marginTop: 6, lineHeight: 1.45 }}>{post.note}</div>
          )}
          {claimed && (
            <div
              style={{
                marginTop: 10,
                background: '#fef3ec',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 13,
                color: '#D4773A',
                fontWeight: 600,
              }}
            >
              ✓ {post.chosenVolunteer.name} (Unit {post.chosenVolunteer.unit}) is holding it
            </div>
          )}
          {isMine && !claimed && (
            <div style={{ marginTop: 10 }}>
              {post.volunteers.length === 0 ? (
                <div style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic' }}>Waiting for volunteers…</div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setOpen(!open)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      fontSize: 13,
                      color: '#D4773A',
                      fontWeight: 700,
                      fontFamily: 'inherit',
                    }}
                  >
                    {post.volunteers.length} neighbor{post.volunteers.length > 1 ? 's' : ''} offered to help{' '}
                    {open ? '▲' : '▼'}
                  </button>
                  {open && (
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {post.volunteers.map((v) => (
                        <div
                          key={v.unit}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: '#f5f5f5',
                            borderRadius: 10,
                            padding: '9px 12px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Avatar name={v.name} size={28} />
                            <span style={{ fontSize: 14, fontWeight: 600 }}>
                              {v.name}
                              <span style={{ fontWeight: 400, color: '#999' }}> · Unit {v.unit}</span>
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onChoose(post.id, v)}
                            style={{
                              background: '#D4773A',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 8,
                              padding: '6px 12px',
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                            }}
                          >
                            Choose
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {!isMine && !claimed && (
            <button
              type="button"
              onClick={() => !hasVol && onVolunteer(post.id)}
              style={{
                marginTop: 12,
                width: '100%',
                padding: 11,
                background: hasVol ? '#fef3ec' : '#D4773A',
                color: hasVol ? '#D4773A' : '#fff',
                border: hasVol ? '1.5px solid #D4773A' : 'none',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 14,
                cursor: hasVol ? 'default' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {hasVol ? '✓ You offered to help' : "I've got it"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function LogModal({ onSubmit, onCancel }) {
  const [unit, setUnit] = useState('')
  const [note, setNote] = useState('')
  return (
    <Sheet>
      <div
        style={{
          fontSize: 11,
          color: '#D4773A',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        Private · Neighbor only
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px', fontFamily: "'Barlow', sans-serif" }}>
        Spotted a Package?
      </h2>
      <p style={{ fontSize: 14, color: '#999', margin: '0 0 20px' }}>
        Only the recipient is notified. Nothing posts to the feed.
      </p>
      <div style={{ marginBottom: 14 }}>
        <FieldLabel>Which unit?</FieldLabel>
        <input
          style={inputStyle}
          placeholder="e.g. 3B"
          value={unit}
          onChange={(e) => setUnit(e.target.value.toUpperCase())}
          maxLength={4}
        />
      </div>
      <div style={{ marginBottom: 22 }}>
        <FieldLabel>Note (optional)</FieldLabel>
        <input
          style={inputStyle}
          placeholder="e.g. Holding in 4B, medium box"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <button
        type="button"
        onClick={() => unit.trim() && onSubmit({ unit: unit.trim(), note })}
        disabled={!unit.trim()}
        style={{
          width: '100%',
          padding: 14,
          background: unit.trim() ? '#D4773A' : '#e8e8e8',
          color: unit.trim() ? '#fff' : '#aaa',
          border: 'none',
          borderRadius: 12,
          fontWeight: 800,
          fontSize: 16,
          cursor: unit.trim() ? 'pointer' : 'default',
          fontFamily: 'inherit',
          marginBottom: 10,
        }}
      >
        Notify Neighbor Privately
      </button>
      <button
        type="button"
        onClick={onCancel}
        style={{
          width: '100%',
          padding: 12,
          background: 'transparent',
          color: '#999',
          border: 'none',
          borderRadius: 12,
          fontWeight: 600,
          fontSize: 15,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Cancel
      </button>
    </Sheet>
  )
}

function RequestModal({ onSubmit, onCancel }) {
  const [note, setNote] = useState('')
  return (
    <Sheet>
      <div
        style={{
          fontSize: 11,
          color: '#D4773A',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        Public · Building feed
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px', fontFamily: "'Barlow', sans-serif" }}>
        Need Help?
      </h2>
      <p style={{ fontSize: 14, color: '#999', margin: '0 0 20px' }}>
        Neighbors volunteer — you choose who holds it.
      </p>
      <div style={{ marginBottom: 22 }}>
        <FieldLabel>What&apos;s the situation?</FieldLabel>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={"e.g. UPS says delivered, won't be home until 8pm — can someone grab it?"}
          rows={3}
          style={{
            ...inputStyle,
            fontSize: 14,
            color: '#111',
            resize: 'none',
            lineHeight: 1.5,
          }}
        />
      </div>
      <button
        type="button"
        onClick={() => note.trim() && onSubmit({ note })}
        disabled={!note.trim()}
        style={{
          width: '100%',
          padding: 14,
          background: note.trim() ? '#D4773A' : '#e8e8e8',
          color: note.trim() ? '#fff' : '#aaa',
          border: 'none',
          borderRadius: 12,
          fontWeight: 800,
          fontSize: 16,
          cursor: note.trim() ? 'pointer' : 'default',
          fontFamily: 'inherit',
          marginBottom: 10,
        }}
      >
        Post to Building
      </button>
      <button
        type="button"
        onClick={onCancel}
        style={{
          width: '100%',
          padding: 12,
          background: 'transparent',
          color: '#999',
          border: 'none',
          borderRadius: 12,
          fontWeight: 600,
          fontSize: 15,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Cancel
      </button>
    </Sheet>
  )
}

function ProfileTab({ onSignOut }) {
  return (
    <div style={{ paddingBottom: 110 }}>
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 20,
          marginBottom: 12,
          border: '1.5px solid #efefef',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <Avatar name={MOCK_USER.name} size={52} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{MOCK_USER.name}</div>
            <div style={{ fontSize: 13, color: '#999' }}>Unit {MOCK_USER.unit}</div>
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
          <span>{MOCK_USER.building}</span>
        </div>
      </div>
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          border: '1.5px solid #efefef',
          overflow: 'hidden',
          marginBottom: 12,
        }}
      >
        {[
          { label: 'Packages held for neighbors', value: '7' },
          { label: 'Times neighbors helped you', value: '4' },
          { label: 'Member since', value: 'Apr 2025' },
        ].map((item, i) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px',
              borderBottom: i < 2 ? '1px solid #f5f5f5' : 'none',
            }}
          >
            <span style={{ fontSize: 14, color: '#666' }}>{item.label}</span>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#D4773A' }}>{item.value}</span>
          </div>
        ))}
      </div>
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          border: '1.5px solid #efefef',
          overflow: 'hidden',
        }}
      >
        {['Notification Settings', 'Building Info', 'Help & FAQ', 'Sign Out'].map((item, i, arr) => (
          <div
            key={item}
            role={item === 'Sign Out' ? 'button' : undefined}
            tabIndex={item === 'Sign Out' ? 0 : undefined}
            onClick={item === 'Sign Out' ? () => onSignOut() : undefined}
            onKeyDown={
              item === 'Sign Out'
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSignOut()
                    }
                  }
                : undefined
            }
            style={{
              padding: '15px 16px',
              borderBottom: i < arr.length - 1 ? '1px solid #f5f5f5' : 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              color: item === 'Sign Out' ? '#e63946' : '#111',
              fontSize: 14,
            }}
          >
            {item}
            {item !== 'Sign Out' && <span style={{ color: '#ddd' }}>›</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MainApp() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('packages')
  const [myPkgs, setMyPkgs] = useState(INIT_MY_PACKAGES)
  const [feed, setFeed] = useState(INIT_FEED)
  const [modal, setModal] = useState(null)

  const handleCollected = (id) => setMyPkgs((p) => p.map((x) => (x.id === id ? { ...x, status: 'collected' } : x)))
  const handleLog = ({ unit }) => {
    setModal(null)
    window.alert(`Unit ${unit} notified privately.`)
  }
  const handleRequest = ({ note }) => {
    setFeed((p) => [
      {
        id: Date.now(),
        requester: MOCK_USER.name,
        requesterUnit: MOCK_USER.unit,
        timestamp: new Date(),
        note,
        volunteers: [],
        status: 'open',
        chosenVolunteer: null,
      },
      ...p,
    ])
    setTab('feed')
    setModal(null)
  }
  const handleVolunteer = (id) =>
    setFeed((p) =>
      p.map((x) =>
        x.id === id
          ? { ...x, volunteers: [...x.volunteers, { name: MOCK_USER.name, unit: MOCK_USER.unit }] }
          : x,
      ),
    )
  const handleChoose = (id, v) =>
    setFeed((p) => p.map((x) => (x.id === id ? { ...x, status: 'claimed', chosenVolunteer: v } : x)))

  const myActive = myPkgs.filter((p) => p.status === 'waiting').length
  const feedOpen = feed.filter((p) => p.status === 'open').length
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@700;800;900&display=swap');
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: #c0c0c0; }
      `}</style>
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
              {MOCK_USER.building}
            </div>
          </div>
          {tab !== 'profile' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setModal('log')}
                style={{
                  background: '#fff',
                  color: '#D4773A',
                  border: '1.5px solid #D4773A',
                  borderRadius: 20,
                  padding: '8px 13px',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Spotted one
              </button>
              <button
                type="button"
                onClick={() => setModal('request')}
                style={{
                  background: '#D4773A',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 20,
                  padding: '8px 13px',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
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
        {tab === 'packages' && <MyPackagesTab pkgs={myPkgs} onCollected={handleCollected} />}
        {tab === 'feed' && <FeedTab feed={feed} onVolunteer={handleVolunteer} onChoose={handleChoose} />}
        {tab === 'profile' && <ProfileTab onSignOut={() => navigate('/')} />}
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
      {modal === 'log' && <LogModal onSubmit={handleLog} onCancel={() => setModal(null)} />}
      {modal === 'request' && <RequestModal onSubmit={handleRequest} onCancel={() => setModal(null)} />}
    </div>
  )
}
