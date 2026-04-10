import { useState } from 'react'
import { Avatar, timeAgo } from '../shared'

export default function FeedCard({ post, myUnit, onVolunteer, onChoose, onMarkCollected }) {
  const isMine = post.requesterUnit === myUnit
  const claimed = post.status === 'claimed'
  const hasVol = post.volunteers.some((v) => v.unit === myUnit)
  const [open, setOpen] = useState(false)

  return (
    <div style={{ background: claimed ? '#fafafa' : '#fff', border: `1.5px solid ${isMine && !claimed ? '#D4773A' : '#efefef'}`, borderRadius: 16, padding: 16, marginBottom: 12, opacity: claimed ? 0.65 : 1 }}>
      {isMine && !claimed && <div style={{ fontSize: 10, fontWeight: 700, color: '#D4773A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Your request</div>}
      <div style={{ display: 'flex', gap: 12 }}>
        <Avatar name={post.requester} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{post.requester}<span style={{ fontWeight: 400, color: '#999', fontSize: 13 }}> · Unit {post.requesterUnit}</span></span>
            <span style={{ fontSize: 12, color: '#c0c0c0' }}>{timeAgo(post.timestamp)}</span>
          </div>
          {post.note && <div style={{ fontSize: 14, color: '#444', marginTop: 6, lineHeight: 1.45 }}>{post.note}</div>}
          {claimed && post.chosenVolunteer && <div style={{ marginTop: 10, background: '#fef3ec', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#D4773A', fontWeight: 600 }}>✓ {post.chosenVolunteer.name} (Unit {post.chosenVolunteer.unit}) is holding it</div>}
          {isMine && claimed && post.chosenVolunteer && onMarkCollected ? (
            <button
              type="button"
              onClick={() => onMarkCollected(post.id)}
              style={{
                marginTop: 10,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 700,
                color: '#D4773A',
                background: 'transparent',
                border: '1.5px solid #D4773A',
                borderRadius: 8,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Mark as Collected
            </button>
          ) : null}
          {isMine && !claimed && (
            <div style={{ marginTop: 10 }}>
              {post.volunteers.length === 0 ? <div style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic' }}>Waiting for volunteers…</div> : <>
                <button type="button" onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, color: '#D4773A', fontWeight: 700, fontFamily: 'inherit' }}>
                  {post.volunteers.length} neighbor{post.volunteers.length > 1 ? 's' : ''} offered to help {open ? '▲' : '▼'}
                </button>
                {open && <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {post.volunteers.map((v) => (
                    <div key={v.unit} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f5f5f5', borderRadius: 10, padding: '9px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={v.name} size={28} />
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{v.name}<span style={{ fontWeight: 400, color: '#999' }}> · Unit {v.unit}</span></span>
                      </div>
                      <button type="button" onClick={() => onChoose(post.id, v)} style={{ background: '#D4773A', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Choose</button>
                    </div>
                  ))}
                </div>}
              </>}
            </div>
          )}
          {!isMine && !claimed && (
            <button type="button" onClick={() => !hasVol && onVolunteer(post.id)} style={{ marginTop: 12, width: '100%', padding: 11, background: hasVol ? '#fef3ec' : '#D4773A', color: hasVol ? '#D4773A' : '#fff', border: hasVol ? '1.5px solid #D4773A' : 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: hasVol ? 'default' : 'pointer', fontFamily: 'inherit' }}>
              {hasVol ? '✓ You offered to help' : "I've got it"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
