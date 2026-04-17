import FeedCard from './cards/FeedCard'
import HelpfulNeighborLeaderboard from './HelpfulNeighborLeaderboard'
import { EmptyState, SectionLabel } from './shared'

export default function FeedTab({
  feed,
  myUnit,
  myUserId,
  expandRequestId,
  onVolunteer,
  onChoose,
  onMarkCollected,
  leaderboardMonthTitle,
  leaderboardRows,
  leaderboardLoading,
  leaderboardError,
}) {
  const visible = feed.filter((p) => p.status !== 'collected')
  const open = visible.filter((p) => p.status === 'open')
  const claimed = visible.filter((p) => p.status === 'claimed')

  return (
    <div style={{ paddingBottom: 110 }}>
      <HelpfulNeighborLeaderboard
        monthTitle={leaderboardMonthTitle}
        rankedRows={leaderboardRows}
        currentUserId={myUserId}
        loading={leaderboardLoading}
        errorMessage={leaderboardError}
      />
      {visible.length === 0 ? (
        <EmptyState icon="🙌" title="All clear" sub="No open requests right now" />
      ) : (
        <>
          {open.length > 0 && (
            <>
              <SectionLabel text={`Needs help · ${open.length}`} />
              {open.map((p) => (
                <FeedCard
                  key={p.id}
                  post={p}
                  myUnit={myUnit}
                  expandRequestId={expandRequestId}
                  onVolunteer={onVolunteer}
                  onChoose={onChoose}
                  onMarkCollected={onMarkCollected}
                />
              ))}
            </>
          )}
          {claimed.length > 0 && (
            <>
              <SectionLabel text={`Sorted · ${claimed.length}`} dim />
              {claimed.map((p) => (
                <FeedCard
                  key={p.id}
                  post={p}
                  myUnit={myUnit}
                  expandRequestId={expandRequestId}
                  onVolunteer={onVolunteer}
                  onChoose={onChoose}
                  onMarkCollected={onMarkCollected}
                />
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}
