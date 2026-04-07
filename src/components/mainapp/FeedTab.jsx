import FeedCard from './cards/FeedCard'
import { EmptyState, SectionLabel } from './shared'

export default function FeedTab({ feed, myUnit, onVolunteer, onChoose }) {
  const open = feed.filter((p) => p.status === 'open')
  const claimed = feed.filter((p) => p.status === 'claimed')

  if (feed.length === 0) {
    return <EmptyState icon="🙌" title="All clear" sub="No open requests right now" />
  }

  return (
    <div style={{ paddingBottom: 110 }}>
      {open.length > 0 && <><SectionLabel text={`Needs help · ${open.length}`} />{open.map((p) => <FeedCard key={p.id} post={p} myUnit={myUnit} onVolunteer={onVolunteer} onChoose={onChoose} />)}</>}
      {claimed.length > 0 && <><SectionLabel text={`Sorted · ${claimed.length}`} dim />{claimed.map((p) => <FeedCard key={p.id} post={p} myUnit={myUnit} onVolunteer={onVolunteer} onChoose={onChoose} />)}</>}
    </div>
  )
}
