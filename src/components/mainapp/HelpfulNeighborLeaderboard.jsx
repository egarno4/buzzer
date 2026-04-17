import { neighborsHelpedLabel, ordinalRank } from '../../lib/neighborLeaderboard'

const headerStyle = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 800,
  fontSize: 17,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: '#1C1812',
  margin: '0 0 14px',
  lineHeight: 1.2,
}

const rowBase = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 12px',
  borderRadius: 12,
  fontSize: 14,
  color: '#1C1812',
}

export default function HelpfulNeighborLeaderboard({
  monthTitle,
  rankedRows,
  currentUserId,
  loading,
  errorMessage,
}) {
  const top3 = rankedRows.slice(0, 3)
  const meIndex = rankedRows.findIndex((r) => r.actorId === currentUserId)
  const me = meIndex >= 0 ? rankedRows[meIndex] : null
  const meInTop3 = meIndex >= 0 && meIndex < 3
  const medals = ['🥇', '🥈', '🥉']

  const hasAny = rankedRows.length > 0

  return (
    <div
      style={{
        background: '#fff',
        border: '1.5px solid #efefef',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <h2 style={headerStyle}>🏆 Helpful Neighbor — {monthTitle}</h2>
      {errorMessage ? (
        <div style={{ fontSize: 14, color: '#b42318', lineHeight: 1.45 }}>{errorMessage}</div>
      ) : loading ? (
        <div style={{ fontSize: 14, color: '#9C8F7A', padding: '8px 0' }}>Loading leaderboard…</div>
      ) : !hasAny ? (
        <div style={{ fontSize: 14, color: '#6b6458', lineHeight: 1.5 }}>
          No activity yet this month — be the first helpful neighbor!
        </div>
      ) : (
        <>
          {top3.map((r, i) => (
            <div
              key={r.actorId}
              style={{
                ...rowBase,
                marginBottom: i < 2 ? 8 : 0,
                background: i === 0 ? '#FFF3E0' : 'transparent',
                border: i === 0 ? '1px solid #f0e0d0' : 'none',
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }} aria-hidden>{medals[i]}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 700 }}>{ordinalRank(r.rank)}</span>
                <span style={{ fontWeight: 600, marginLeft: 6 }}>{r.firstName}</span>
                <span style={{ color: '#9C8F7A', fontWeight: 500 }}> · Unit {r.unit}</span>
              </div>
              <div style={{ fontWeight: 700, color: '#D4773A', fontSize: 13, textAlign: 'right', flexShrink: 0 }}>
                {neighborsHelpedLabel(r.actionCount)}
              </div>
            </div>
          ))}
          {me && !meInTop3 ? (
            <>
              <div style={{ borderTop: '1px solid #E8E1D5', margin: '14px 0 12px' }} />
              <div style={{ ...rowBase, paddingTop: 4 }}>
                <span style={{ fontSize: 18, width: 28, textAlign: 'center' }} aria-hidden>
                  👤
                </span>
                <div style={{ flex: 1, fontSize: 14, color: '#1C1812' }}>
                  <span style={{ fontWeight: 800 }}>You</span>
                  <span style={{ fontWeight: 600, color: '#9C8F7A' }}> — {ordinalRank(me.rank)} — </span>
                  <span style={{ fontWeight: 600 }}>{neighborsHelpedLabel(me.actionCount)} this month</span>
                </div>
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  )
}
