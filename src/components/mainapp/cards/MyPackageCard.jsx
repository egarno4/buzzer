import { Avatar, timeAgo } from '../shared'

export default function MyPackageCard({ pkg, onGetHelp, onDismiss }) {
  const done = pkg.status === 'collected'
  return (
    <div style={{ background: done ? '#fafafa' : '#fff', border: `1.5px solid ${done ? '#efefef' : '#D4773A'}`, borderRadius: 16, padding: 16, marginBottom: 12, opacity: done ? 0.6 : 1, boxShadow: done ? 'none' : '0 2px 14px rgba(212,119,58,0.10)' }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Avatar name={pkg.loggedBy} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{pkg.loggedBy}<span style={{ fontWeight: 400, color: '#999', fontSize: 13 }}> · Unit {pkg.loggerUnit}</span></span>
            <span style={{ fontSize: 12, color: '#c0c0c0' }}>{timeAgo(pkg.timestamp)}</span>
          </div>
          <div style={{ fontSize: 14, color: '#555', marginTop: 5 }}>
            {done ? 'Neighbor spotted your package · Collected ✓' : (pkg.subheadline ?? 'Your neighbor spotted a package for you')}
          </div>
          {pkg.note && <div style={{ marginTop: 8, background: '#f4f4f4', borderRadius: 8, padding: '7px 10px', fontSize: 13, color: '#666', fontStyle: 'italic' }}>&ldquo;{pkg.note}&rdquo;</div>}
          {!done && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="button" onClick={() => onGetHelp(pkg)} style={{ flex: 1, padding: 11, background: '#D4773A', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Get Help</button>
              <button type="button" onClick={() => onDismiss(pkg.id)} style={{ flex: 1, padding: 11, background: '#fff', color: '#1C1812', border: '1.5px solid #D4773A', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Dismiss</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
