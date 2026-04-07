import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const NOTIFY_FUNCTION_NAME = import.meta.env.VITE_NOTIFY_FUNCTION_NAME || 'send-package-notification'

function timeAgo(dateLike) {
  const date = new Date(dateLike)
  const mins = Math.floor((Date.now() - date.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function Avatar({ name, size = 36 }) {
  const safe = (name || '?').trim()
  const colors = ['#2D6A4F', '#1B4332', '#40916C', '#276749', '#52B788']
  const c = colors[safe.charCodeAt(0) % colors.length]
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0 }}>
      {safe[0].toUpperCase()}
    </div>
  )
}

function SectionLabel({ text, dim }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: dim ? '#c0c0c0' : '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{text}</div>
}

function FieldLabel({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{children}</div>
}

const inputStyle = { width: '100%', padding: '13px 14px', borderRadius: 10, border: '1.5px solid #e8e8e8', fontSize: 15, fontFamily: 'inherit', background: '#fafafa', outline: 'none' }

function Sheet({ children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }}>
      <div style={{ background: '#fff', borderRadius: '22px 22px 0 0', padding: '8px 20px 40px', width: '100%' }}>
        <div style={{ width: 36, height: 4, background: '#e0e0e0', borderRadius: 2, margin: '12px auto 20px' }} />
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

function MyPackagesTab({ pkgs, onGetHelp, onDismiss }) {
  const visible = pkgs.filter((p) => p.status !== 'dismissed')
  const active = visible.filter((p) => p.status === 'waiting')
  const done = visible.filter((p) => p.status === 'collected')
  if (visible.length === 0) return <EmptyState icon="📭" title="No packages right now" sub="You'll be notified privately when a neighbor spots one for you" />
  return (
    <div style={{ paddingBottom: 110 }}>
      {active.length > 0 && <><SectionLabel text={`Waiting · ${active.length}`} />{active.map((p) => <MyPkgCard key={p.id} pkg={p} onGetHelp={onGetHelp} onDismiss={onDismiss} />)}</>}
      {done.length > 0 && <><SectionLabel text={`Collected · ${done.length}`} dim />{done.map((p) => <MyPkgCard key={p.id} pkg={p} onGetHelp={onGetHelp} onDismiss={onDismiss} />)}</>}
    </div>
  )
}

function MyPkgCard({ pkg, onGetHelp, onDismiss }) {
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
            {done
              ? 'Neighbor spotted your package · Collected ✓'
              : 'Your neighbor spotted a package for you'}
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

function FeedTab({ feed, myUnit, onVolunteer, onChoose }) {
  const open = feed.filter((p) => p.status === 'open')
  const claimed = feed.filter((p) => p.status === 'claimed')
  if (feed.length === 0) return <EmptyState icon="🙌" title="All clear" sub="No open requests right now" />
  return (
    <div style={{ paddingBottom: 110 }}>
      {open.length > 0 && <><SectionLabel text={`Needs help · ${open.length}`} />{open.map((p) => <FeedCard key={p.id} post={p} myUnit={myUnit} onVolunteer={onVolunteer} onChoose={onChoose} />)}</>}
      {claimed.length > 0 && <><SectionLabel text={`Sorted · ${claimed.length}`} dim />{claimed.map((p) => <FeedCard key={p.id} post={p} myUnit={myUnit} onVolunteer={onVolunteer} onChoose={onChoose} />)}</>}
    </div>
  )
}

function FeedCard({ post, myUnit, onVolunteer, onChoose }) {
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

function LogModal({ onSubmit, onCancel, neighbors }) {
  const [unit, setUnit] = useState('')
  const [note, setNote] = useState('')
  const hasNeighbors = neighbors.length > 0
  return (
    <Sheet>
      <div style={{ fontSize: 11, color: '#D4773A', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Private · Neighbor only</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px', fontFamily: "'Barlow', sans-serif" }}>Spotted a Package?</h2>
      <p style={{ fontSize: 14, color: '#999', margin: '0 0 20px' }}>Only the recipient is notified. Nothing posts to the feed.</p>
      <div style={{ marginBottom: 14 }}>
        <FieldLabel>Which neighbor?</FieldLabel>
        <select
          style={inputStyle}
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          disabled={!hasNeighbors}
        >
          <option value="">
            {hasNeighbors ? 'Select neighbor' : 'No approved neighbors available'}
          </option>
          {neighbors.map((n) => (
            <option key={n.id} value={n.unit}>
              {`Unit ${n.unit} — ${n.name}`}
            </option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: 22 }}><FieldLabel>Note (optional)</FieldLabel><input style={inputStyle} placeholder="e.g. Left by the mailboxes, small brown box" value={note} onChange={(e) => setNote(e.target.value)} /></div>
      <button type="button" onClick={() => unit.trim() && onSubmit({ unit: unit.trim(), note })} disabled={!unit.trim() || !hasNeighbors} style={{ width: '100%', padding: 14, background: unit.trim() && hasNeighbors ? '#D4773A' : '#e8e8e8', color: unit.trim() && hasNeighbors ? '#fff' : '#aaa', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 16, cursor: unit.trim() && hasNeighbors ? 'pointer' : 'default', fontFamily: 'inherit', marginBottom: 10 }}>Notify Neighbor Privately</button>
      <button type="button" onClick={onCancel} style={{ width: '100%', padding: 12, background: 'transparent', color: '#999', border: 'none', borderRadius: 12, fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
    </Sheet>
  )
}

function RequestModal({ onSubmit, onCancel }) {
  const [note, setNote] = useState('')
  return (
    <Sheet>
      <div style={{ fontSize: 11, color: '#D4773A', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Public · Building feed</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px', fontFamily: "'Barlow', sans-serif" }}>Need Help?</h2>
      <p style={{ fontSize: 14, color: '#999', margin: '0 0 20px' }}>Neighbors volunteer — you choose who holds it.</p>
      <div style={{ marginBottom: 22 }}><FieldLabel>What&apos;s the situation?</FieldLabel><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={"e.g. UPS says delivered, won't be home until 8pm — can someone grab it?"} rows={3} style={{ ...inputStyle, fontSize: 14, color: '#111', resize: 'none', lineHeight: 1.5 }} /></div>
      <button type="button" onClick={() => note.trim() && onSubmit({ note })} disabled={!note.trim()} style={{ width: '100%', padding: 14, background: note.trim() ? '#D4773A' : '#e8e8e8', color: note.trim() ? '#fff' : '#aaa', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 16, cursor: note.trim() ? 'pointer' : 'default', fontFamily: 'inherit', marginBottom: 10 }}>Post to Building</button>
      <button type="button" onClick={onCancel} style={{ width: '100%', padding: 12, background: 'transparent', color: '#999', border: 'none', borderRadius: 12, fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
    </Sheet>
  )
}

function ProfileTab({ user, onSignOut }) {
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

export default function MainApp() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('packages')
  const [modal, setModal] = useState(null)
  const [profile, setProfile] = useState(null)
  const [myPkgs, setMyPkgs] = useState([])
  const [feed, setFeed] = useState([])
  const [approvedNeighbors, setApprovedNeighbors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDismissToast, setShowDismissToast] = useState(false)

  useEffect(() => {
    if (!showDismissToast) return undefined
    const timer = window.setTimeout(() => setShowDismissToast(false), 2000)
    return () => window.clearTimeout(timer)
  }, [showDismissToast])

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data: s } = await supabase.auth.getSession()
    const userId = s.session?.user?.id
    if (!userId) {
      navigate('/', { replace: true })
      return
    }
    const { data: p, error: pErr } = await supabase.from('profiles').select('id,first_name,last_name,address,unit,email').eq('id', userId).single()
    if (pErr || !p) {
      setError(pErr?.message || 'Could not load profile.')
      setLoading(false)
      return
    }
    const user = { id: p.id, name: `${p.first_name} ${p.last_name}`.trim(), unit: p.unit, building: p.address, email: p.email }
    setProfile(user)

    const [{ data: pkgRows, error: pkgErr }, { data: reqRows, error: reqErr }, { data: neighborRows, error: neighborErr }] = await Promise.all([
      supabase.from('packages').select('*').eq('building_address', user.building).eq('from_unit', user.unit).order('created_at', { ascending: false }),
      supabase.from('requests').select('*').eq('building_address', user.building).order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('id,unit,first_name,last_name,status,address')
        .eq('address', user.building)
        .eq('status', 'approved')
        .neq('id', user.id),
    ])
    if (pkgErr || reqErr || neighborErr) {
      setError(pkgErr?.message || reqErr?.message || neighborErr?.message || 'Could not load app data.')
      setLoading(false)
      return
    }
    setApprovedNeighbors(
      (neighborRows || []).map((n) => ({
        id: n.id,
        unit: n.unit,
        name: `${n.first_name || ''} ${n.last_name || ''}`.trim() || 'Neighbor',
      })),
    )
    const requestIds = (reqRows || []).map((r) => r.id)
    let volunteerMap = {}
    if (requestIds.length > 0) {
      const { data: volRows } = await supabase.from('volunteers').select('request_id,unit,name,created_at').in('request_id', requestIds).order('created_at', { ascending: true })
      volunteerMap = (volRows || []).reduce((acc, v) => {
        acc[v.request_id] = acc[v.request_id] || []
        acc[v.request_id].push({ unit: v.unit, name: v.name })
        return acc
      }, {})
    }
    setMyPkgs((pkgRows || []).map((x) => ({ id: x.id, loggedBy: x.held_by_name, loggerUnit: x.held_by_unit, timestamp: x.created_at, status: x.status, note: x.note })))
    setFeed((reqRows || []).map((x) => ({ id: x.id, requester: x.requester_name, requesterUnit: x.requester_unit, timestamp: x.created_at, note: x.note, volunteers: volunteerMap[x.id] || [], status: x.status, chosenVolunteer: x.chosen_volunteer_name ? { name: x.chosen_volunteer_name, unit: x.chosen_volunteer_unit } : null })))
    setLoading(false)
  }, [navigate])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  useEffect(() => {
    if (!profile) return undefined

    const channel = supabase
      .channel(`main-app-realtime-${profile.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        () => {
          void loadAll()
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'volunteers' },
        () => {
          void loadAll()
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'packages' },
        () => {
          void loadAll()
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [profile, loadAll])

  function handleGetHelpFromPackage() {
    setModal('request')
  }

  async function handleDismiss(id) {
    setMyPkgs((p) => p.filter((x) => x.id !== id))
    setShowDismissToast(true)
    const { error: uErr } = await supabase.from('packages').update({ status: 'dismissed' }).eq('id', id)
    if (uErr) setError(uErr.message)
  }

  async function handleLog({ unit, note }) {
    if (!profile) return
    const { error: insErr } = await supabase.from('packages').insert({ building_address: profile.building, from_unit: unit, held_by_unit: profile.unit, held_by_name: profile.name, note: note || null, status: 'waiting' })
    if (insErr) {
      setError(insErr.message)
      return
    }
    setModal(null)
    const { data: recipient } = await supabase.from('profiles').select('email,first_name,last_name').eq('address', profile.building).eq('unit', unit).maybeSingle()
    if (recipient?.email) {
      const { error: fnErr } = await supabase.functions.invoke(NOTIFY_FUNCTION_NAME, { body: { to: recipient.email, recipientName: `${recipient.first_name || ''} ${recipient.last_name || ''}`.trim(), buildingAddress: profile.building, unit, note: note || '', heldByName: profile.name, heldByUnit: profile.unit } })
      if (fnErr) {
        window.alert('Spotted alert saved, but notification email failed to send.')
      }
    }
    setMyPkgs((p) => [{ id: crypto.randomUUID(), loggedBy: profile.name, loggerUnit: profile.unit, timestamp: new Date().toISOString(), status: 'waiting', note }, ...p])
  }

  async function handleRequest({ note }) {
    if (!profile) return
    const { data: row, error: insErr } = await supabase.from('requests').insert({ building_address: profile.building, requester_unit: profile.unit, requester_name: profile.name, note, status: 'open' }).select('*').single()
    if (insErr) {
      setError(insErr.message)
      return
    }
    setFeed((p) => [{ id: row.id, requester: row.requester_name, requesterUnit: row.requester_unit, timestamp: row.created_at, note: row.note, volunteers: [], status: row.status, chosenVolunteer: null }, ...p])
    setTab('feed')
    setModal(null)
  }

  async function handleVolunteer(id) {
    if (!profile) return
    const { error: insErr } = await supabase.from('volunteers').insert({ request_id: id, unit: profile.unit, name: profile.name })
    if (insErr) {
      if (!String(insErr.message).includes('duplicate')) setError(insErr.message)
      return
    }
    setFeed((p) => p.map((x) => (x.id === id ? { ...x, volunteers: [...x.volunteers, { name: profile.name, unit: profile.unit }] } : x)))
  }

  async function handleChoose(id, v) {
    const { error: upErr } = await supabase.from('requests').update({ status: 'claimed', chosen_volunteer_name: v.name, chosen_volunteer_unit: v.unit }).eq('id', id)
    if (upErr) {
      setError(upErr.message)
      return
    }
    setFeed((p) => p.map((x) => (x.id === id ? { ...x, status: 'claimed', chosenVolunteer: v } : x)))
  }

  const myActive = myPkgs.filter((p) => p.status === 'waiting').length
  const feedOpen = feed.filter((p) => p.status === 'open').length
  const tabs = useMemo(() => [
    { id: 'packages', label: 'My Packages', icon: '📦', badge: myActive },
    { id: 'feed', label: 'Building', icon: '🏢', badge: feedOpen },
    { id: 'profile', label: 'Profile', icon: '👤', badge: 0 },
  ], [myActive, feedOpen])

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>
  if (!profile) return <div style={{ padding: 24 }}>Profile not found.</div>

  return (
    <div style={{ fontFamily: "'Barlow', sans-serif", maxWidth: 430, margin: '0 auto', minHeight: '100vh', background: '#F5F0E8' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@700;800;900&display=swap');*{-webkit-tap-highlight-color:transparent;box-sizing:border-box;}input::placeholder,textarea::placeholder{color:#c0c0c0;}`}</style>
      <div style={{ background: '#F5F0E8', padding: '52px 20px 14px', borderBottom: '1px solid #E8E1D5', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.01em', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase' }}>BUZZ<span style={{ color: '#D4773A' }}>ER</span></div>
            <div style={{ fontSize: 11, color: '#9C8F7A', marginTop: 1, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{profile.building}</div>
          </div>
          {tab !== 'profile' && <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setModal('log')} style={{ background: '#fff', color: '#D4773A', border: '1.5px solid #D4773A', borderRadius: 20, padding: '8px 13px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Spotted one</button>
            <button type="button" onClick={() => setModal('request')} style={{ background: '#D4773A', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 13px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Need help</button>
          </div>}
        </div>
      </div>
      <div style={{ padding: '16px 16px 0' }}>
        {error ? <div style={{ color: '#b42318', marginBottom: 8, fontSize: 13 }}>{error}</div> : null}
        {tab === 'packages' && <MyPackagesTab pkgs={myPkgs} onGetHelp={handleGetHelpFromPackage} onDismiss={handleDismiss} />}
        {tab === 'feed' && <FeedTab feed={feed} myUnit={profile.unit} onVolunteer={handleVolunteer} onChoose={handleChoose} />}
        {tab === 'profile' && <ProfileTab user={profile} onSignOut={async () => { await supabase.auth.signOut(); navigate('/') }} />}
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: '#F5F0E8', borderTop: '1px solid #E8E1D5', display: 'flex', paddingBottom: 20, zIndex: 20 }}>
        {tabs.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} style={{ flex: 1, padding: '12px 0 4px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontFamily: 'inherit', position: 'relative' }}>
            {t.badge > 0 && <div style={{ position: 'absolute', top: 8, left: '55%', background: '#D4773A', color: '#fff', borderRadius: 10, fontSize: 10, fontWeight: 800, minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{t.badge}</div>}
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{ fontSize: 11, fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? '#D4773A' : '#9C8F7A' }}>{t.label}</span>
          </button>
        ))}
      </div>
      {showDismissToast && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 76,
            zIndex: 40,
            background: '#1C1812',
            color: '#fff',
            borderRadius: 999,
            padding: '8px 12px',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.01em',
            opacity: 0.95,
            boxShadow: '0 6px 18px rgba(28,24,18,0.24)',
            transition: 'opacity 200ms ease',
          }}
          role="status"
          aria-live="polite"
        >
          Alert dismissed
        </div>
      )}
      {modal === 'log' && <LogModal neighbors={approvedNeighbors} onSubmit={handleLog} onCancel={() => setModal(null)} />}
      {modal === 'request' && <RequestModal onSubmit={handleRequest} onCancel={() => setModal(null)} />}
    </div>
  )
}
