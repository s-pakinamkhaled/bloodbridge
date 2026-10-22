import { useEffect, useState } from 'react'
import { StoreProvider, useStore } from './store'
import { LanguageProvider, useI18n } from './i18n'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import DonorApp from './pages/DonorApp'
import HospitalApp from './pages/HospitalApp'
import AdminApp from './pages/AdminApp'

function Gate() {
  const { user } = useStore()
  const { t } = useI18n()
  const [screen, setScreen] = useState('home')

  useEffect(() => {
    const titles = {
      donor: t('doc.donor'),
      staff: t('doc.staff'),
      admin: t('doc.admin'),
    }
    document.title = user ? titles[user.role] || 'BloodBridge' : t('doc.public')
  }, [user, t])

  if (user?.role === 'donor') return <DonorApp />
  if (user?.role === 'staff') return <HospitalApp />
  if (user?.role === 'admin') return <AdminApp />
  if (screen === 'login') return <Auth initialMode="login" onBack={() => setScreen('home')} />
  if (screen === 'register') return <Auth initialMode="register" onBack={() => setScreen('home')} />
  return <Landing onSignIn={() => setScreen('login')} onRegister={() => setScreen('register')} />
}

export default function App() {
  return (
    <LanguageProvider>
      <StoreProvider>
        <Gate />
      </StoreProvider>
    </LanguageProvider>
  )
}
