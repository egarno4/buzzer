import { Avatar } from './shared'

export default function ProfileTab({ user, onSignOut }) {
  return (
    <div style={{ paddingBottom: 110 }}>
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
        {['Notification Settings', 'Building Info', 'Help & FAQ', 'Sign Out'].map((item, i, arr) => (
          <div key={item} role={item === 'Sign Out' ? 'button' : undefined} tabIndex={item === 'Sign Out' ? 0 : undefined} onClick={item === 'Sign Out' ? onSignOut : undefined} onKeyDown={item === 'Sign Out' ? (e) => (e.key === 'Enter' || e.key === ' ') && onSignOut() : undefined} style={{ padding: '15px 16px', borderBottom: i < arr.length - 1 ? '1px solid #f5f5f5' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', color: item === 'Sign Out' ? '#e63946' : '#111', fontSize: 14 }}>
            {item}{item !== 'Sign Out' && <span style={{ color: '#ddd' }}>›</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
