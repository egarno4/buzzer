import MyPackageCard from './cards/MyPackageCard'
import { EmptyState, SectionLabel } from './shared'

export default function MyPackagesTab({ pkgs, onGetHelp, onDismiss }) {
  const visible = pkgs.filter((p) => p.status !== 'dismissed')
  const active = visible.filter((p) => p.status === 'waiting')
  const done = visible.filter((p) => p.status === 'collected')

  if (visible.length === 0) {
    return <EmptyState icon="📭" title="No packages right now" sub="You'll be notified privately when a neighbor spots one for you" />
  }

  return (
    <div style={{ paddingBottom: 110 }}>
      {active.length > 0 && <><SectionLabel text={`Waiting · ${active.length}`} />{active.map((p) => <MyPackageCard key={p.id} pkg={p} onGetHelp={onGetHelp} onDismiss={onDismiss} />)}</>}
      {done.length > 0 && <><SectionLabel text={`Collected · ${done.length}`} dim />{done.map((p) => <MyPackageCard key={p.id} pkg={p} onGetHelp={onGetHelp} onDismiss={onDismiss} />)}</>}
    </div>
  )
}
