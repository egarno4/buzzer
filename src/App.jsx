import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Welcome from './pages/Welcome'
import MainApp from './pages/MainApp'
import NameStep from './pages/NameStep'
import AddressStep from './pages/AddressStep'
import EmailStep from './pages/EmailStep'
import VerifyEmail from './pages/VerifyEmail'
import Proof from './pages/Proof'
import Pending from './pages/Pending'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [checkedProfileGate, setCheckedProfileGate] = useState(false)

  useEffect(() => {
    let live = true
    async function enforceProfileGate() {
      // Onboarding: user may be verified in Auth but not have a profiles row yet (e.g. magic link → proof).
      if (location.pathname.startsWith('/onboarding/')) {
        if (live) setCheckedProfileGate(true)
        return
      }

      // Public legal pages — no profile required.
      if (location.pathname === '/privacy' || location.pathname === '/terms') {
        if (live) setCheckedProfileGate(true)
        return
      }

      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session?.user?.id
      if (!userId) {
        if (live) setCheckedProfileGate(true)
        return
      }

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle()

      if (!live) return
      if (profileErr || !profile) {
        await supabase.auth.signOut()
        if (location.pathname !== '/') {
          navigate('/', { replace: true })
        }
      }
      setCheckedProfileGate(true)
    }

    void enforceProfileGate()
    return () => {
      live = false
    }
  }, [navigate, location.pathname])

  if (!checkedProfileGate) {
    return <div className="app-shell" />
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/app" element={<MainApp />} />
        <Route path="/onboarding/name" element={<NameStep />} />
        <Route path="/onboarding/address" element={<AddressStep />} />
        <Route path="/onboarding/email" element={<EmailStep />} />
        <Route path="/onboarding/verify" element={<VerifyEmail />} />
        <Route path="/onboarding/proof" element={<Proof />} />
        <Route path="/onboarding/pending" element={<Pending />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
