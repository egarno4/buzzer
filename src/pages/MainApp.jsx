import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import FeedTab from '../components/mainapp/FeedTab'
import LogModal from '../components/mainapp/LogModal'
import MyPackagesTab from '../components/mainapp/MyPackagesTab'
import ProfileTab from '../components/mainapp/ProfileTab'
import RequestModal from '../components/mainapp/RequestModal'
import useMainAppData from '../hooks/useMainAppData'
import useMainAppRealtime from '../hooks/useMainAppRealtime'
import WelcomeOnboarding, { hasWelcomeBeenDismissed } from '../components/WelcomeOnboarding'
import { nycCalendarMonthYear, nycMonthDisplayLabel, ordinalRank, withCompetitionRanks } from '../lib/neighborLeaderboard'
import { supabase } from '../lib/supabase'

export default function MainApp() {
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState('packages')
  const [modal, setModal] = useState(null)
  const [expandRequestId, setExpandRequestId] = useState(null)
  const [showDismissToast, setShowDismissToast] = useState(false)
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(() => !hasWelcomeBeenDismissed())
  const [leaderboardState, setLeaderboardState] = useState(() => ({
    loading: false,
    ranked: [],
    monthTitle: nycMonthDisplayLabel(),
    error: null,
  }))
  const [neighborAllTime, setNeighborAllTime] = useState(null)
  const {
    sessionChecked,
    profile,
    myPkgs,
    feed,
    approvedNeighbors,
    ambientOtherNeighborCount,
    loading,
    error,
    loadAll,
    dismissPackage,
    logPackage,
    createRequest,
    volunteerForRequest,
    chooseVolunteer,
    markRequestCollected,
    updateEmailNotifications,
    deleteAccount,
    signOut,
  } = useMainAppData(navigate)

  useEffect(() => {
    if (!showDismissToast) return undefined
    const timer = window.setTimeout(() => setShowDismissToast(false), 2000)
    return () => window.clearTimeout(timer)
  }, [showDismissToast])
  useMainAppRealtime({ profile, loadAll })

  useEffect(() => {
    if (!profile) return
    if (tab !== 'feed' && tab !== 'profile') return
    let cancelled = false
    const { month, year } = nycCalendarMonthYear()
    setLeaderboardState((s) => ({
      ...s,
      loading: true,
      error: null,
      monthTitle: nycMonthDisplayLabel(),
    }))
    void supabase
      .rpc('get_building_leaderboard', {
        p_address: profile.building,
        p_month: month,
        p_year: year,
      })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setLeaderboardState({
            loading: false,
            ranked: [],
            monthTitle: nycMonthDisplayLabel(),
            error: error.message,
          })
          return
        }
        setLeaderboardState({
          loading: false,
          ranked: withCompetitionRanks(data),
          monthTitle: nycMonthDisplayLabel(),
          error: null,
        })
      })
    return () => {
      cancelled = true
    }
  }, [tab, profile])

  useEffect(() => {
    if (!profile || tab !== 'profile') return
    let cancelled = false
    setNeighborAllTime(null)
    void supabase
      .from('neighbor_actions')
      .select('*', { count: 'exact', head: true })
      .eq('actor_id', profile.id)
      .then(({ count, error }) => {
        if (cancelled) return
        setNeighborAllTime(error ? 0 : count ?? 0)
      })
    return () => {
      cancelled = true
    }
  }, [tab, profile])

  const neighborProfileStats = useMemo(() => {
    if (!profile) {
      return {
        loadingLb: true,
        allTimeResolved: false,
        thisMonth: 0,
        allTime: 0,
        buildingRankLine: '—',
        motivational: '',
        monthTitle: nycMonthDisplayLabel(),
      }
    }
    const ranked = leaderboardState.ranked
    const loadingLb = leaderboardState.loading
    const row = ranked.find((r) => r.actorId === profile.id)
    const thisMonth = row?.actionCount ?? 0
    const topCount = ranked.find((r) => r.rank === 1)?.actionCount ?? 0
    const gap = topCount - thisMonth

    let buildingRankLine = 'No rankings yet'
    if (!loadingLb) {
      if (ranked.length === 0) {
        buildingRankLine = 'No rankings yet'
      } else if (row) {
        buildingRankLine = `${ordinalRank(row.rank)} in your building`
      } else {
        buildingRankLine = 'Unranked this month'
      }
    }

    let motivational = ''
    if (!loadingLb && ranked.length > 0 && topCount > 0) {
      if (row && row.rank === 1) {
        motivational = "You're the most helpful neighbor this month 🏆"
      } else if (gap > 0) {
        motivational = `${gap} more to take the lead`
      }
    }

    return {
      loadingLb,
      allTimeResolved: neighborAllTime !== null,
      thisMonth,
      allTime: neighborAllTime ?? 0,
      buildingRankLine,
      motivational,
      monthTitle: leaderboardState.monthTitle,
    }
  }, [profile, leaderboardState, neighborAllTime])

  const DEEPLINK_KEY = 'buzzer_app_deeplink_v1'

  useEffect(() => {
    if (location.pathname !== '/app') return

    if (location.search) {
      const sp = new URLSearchParams(location.search)
      const payload = { tab: sp.get('tab'), modal: sp.get('modal'), request: sp.get('request') }
      try {
        window.sessionStorage.setItem(DEEPLINK_KEY, JSON.stringify(payload))
      } catch {
        /* ignore */
      }
      navigate('/app', { replace: true })
      return
    }

    try {
      const raw = window.sessionStorage.getItem(DEEPLINK_KEY)
      if (!raw) return
      window.sessionStorage.removeItem(DEEPLINK_KEY)
      const d = JSON.parse(raw)
      if (d.tab === 'feed') setTab('feed')
      if (d.modal === 'request') setModal('request')
      if (d.request) setExpandRequestId(String(d.request))
    } catch {
      /* ignore */
    }
  }, [location.pathname, location.search, navigate])

  function handleGetHelpFromPackage() {
    setModal('request')
  }

  async function handleDismiss(id) {
    setShowDismissToast(true)
    await dismissPackage(id)
  }

  async function handleLog({ unit, note }) {
    const ok = await logPackage({ unit, note })
    if (ok) setModal(null)
  }

  async function handleRequest({ note }) {
    const ok = await createRequest({ note })
    if (ok) {
      setTab('feed')
      setModal(null)
    }
  }

  async function handleVolunteer(id) {
    await volunteerForRequest(id)
  }

  async function handleChoose(id, v) {
    await chooseVolunteer(id, v)
  }

  async function handleMarkCollected(id) {
    await markRequestCollected(id)
  }

  const myActive = myPkgs.filter((p) => p.status === 'waiting').length
  const feedOpen = feed.filter((p) => p.status === 'open').length
  const tabs = useMemo(() => [
    { id: 'packages', label: 'My Packages', icon: '📦', badge: myActive },
    { id: 'feed', label: 'Building', icon: '🏢', badge: feedOpen },
    { id: 'profile', label: 'Profile', icon: '👤', badge: 0 },
  ], [myActive, feedOpen])

  const otherNeighborCount = ambientOtherNeighborCount ?? approvedNeighbors.length

  if (!sessionChecked || loading) return <div style={{ padding: 24 }}>Loading…</div>
  if (!profile) return <div style={{ padding: 24 }}>Profile not found.</div>

  return (
    <div style={{ fontFamily: "'Barlow', sans-serif", maxWidth: 430, margin: '0 auto', minHeight: '100vh', background: '#F5F0E8' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@700;800;900&display=swap');*{-webkit-tap-highlight-color:transparent;box-sizing:border-box;}input::placeholder,textarea::placeholder{color:#c0c0c0;}`}</style>
      <div style={{ background: '#F5F0E8', padding: '52px 20px 14px', borderBottom: '1px solid #E8E1D5', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.01em', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase' }}>BUZZ<span style={{ color: '#D4773A' }}>ER</span></div>
            <div style={{ fontSize: 11, color: '#9C8F7A', marginTop: 1, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{profile.building}</div>
            <div
              style={{
                fontSize: 10,
                color: '#9C8F7A',
                marginTop: 5,
                fontWeight: 500,
                letterSpacing: '0.01em',
                lineHeight: 1.35,
              }}
            >
              {otherNeighborCount === 0 ? (
                <>
                  You&apos;re the first — <span style={{ color: '#D4773A' }}>invite your neighbors!</span>
                </>
              ) : (
                <>
                  {otherNeighborCount} {otherNeighborCount === 1 ? 'neighbor' : 'neighbors'} on Buzzer
                </>
              )}
            </div>
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
        {tab === 'feed' && (
          <FeedTab
            feed={feed}
            myUnit={profile.unit}
            myUserId={profile.id}
            expandRequestId={expandRequestId}
            onVolunteer={handleVolunteer}
            onChoose={handleChoose}
            onMarkCollected={handleMarkCollected}
            leaderboardMonthTitle={leaderboardState.monthTitle}
            leaderboardRows={leaderboardState.ranked}
            leaderboardLoading={leaderboardState.loading}
            leaderboardError={leaderboardState.error}
          />
        )}
        {tab === 'profile' && (
          <ProfileTab
            user={profile}
            neighborProfileStats={neighborProfileStats}
            onSignOut={signOut}
            onUpdateEmailNotifications={updateEmailNotifications}
            onDeleteAccount={deleteAccount}
          />
        )}
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
      <WelcomeOnboarding
        open={showWelcomeOverlay}
        onDismiss={() => setShowWelcomeOverlay(false)}
        persistDismissal
      />
    </div>
  )
}
