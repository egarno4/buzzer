import { Navigate, Route, Routes } from 'react-router-dom'
import Welcome from './pages/Welcome'
import MainApp from './pages/MainApp'
import NameStep from './pages/NameStep'
import AddressStep from './pages/AddressStep'
import EmailStep from './pages/EmailStep'
import VerifyEmail from './pages/VerifyEmail'
import Proof from './pages/Proof'
import Pending from './pages/Pending'

export default function App() {
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
