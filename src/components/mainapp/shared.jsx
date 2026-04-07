export function timeAgo(dateLike) {
  const date = new Date(dateLike)
  const mins = Math.floor((Date.now() - date.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function Avatar({ name, size = 36 }) {
  const safe = (name || '?').trim()
  const colors = ['#2D6A4F', '#1B4332', '#40916C', '#276749', '#52B788']
  const c = colors[safe.charCodeAt(0) % colors.length]
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0 }}>
      {safe[0].toUpperCase()}
    </div>
  )
}

export function SectionLabel({ text, dim }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: dim ? '#c0c0c0' : '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{text}</div>
}

export function FieldLabel({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{children}</div>
}

export const inputStyle = {
  width: '100%',
  padding: '13px 14px',
  borderRadius: 10,
  border: '1.5px solid #e8e8e8',
  fontSize: 15,
  fontFamily: 'inherit',
  background: '#fafafa',
  outline: 'none',
}

export function Sheet({ children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }}>
      <div style={{ background: '#fff', borderRadius: '22px 22px 0 0', padding: '8px 20px 40px', width: '100%' }}>
        <div style={{ width: 36, height: 4, background: '#e0e0e0', borderRadius: 2, margin: '12px auto 20px' }} />
        {children}
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '70px 20px', color: '#aaa' }}>
      <div style={{ fontSize: 42, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 16, color: '#888', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 14, lineHeight: 1.5 }}>{sub}</div>
    </div>
  )
}
