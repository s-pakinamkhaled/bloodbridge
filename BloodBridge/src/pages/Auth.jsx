import { useState } from 'react'
import { DEMO_ACCOUNTS } from '../data/seed'
import { BLOOD_GROUPS, CITIES } from '../lib/blood'
import { Banner, Button, Field, Logo, SelectInput, TextInput } from '../components/ui'
import { LangSwitch, useI18n } from '../i18n'
import { useStore } from '../store'

const ROLE_KEY = {
  'amira@demo.bloodbridge': 'auth.role.donor',
  'hala@nilecrescent.demo': 'auth.role.hospital',
  'admin@bloodbridge.demo': 'auth.role.checker',
  'rania@cedar.demo': 'auth.role.unchecked',
}

export default function Auth({ initialMode = 'login', onBack }) {
  const { login, register } = useStore()
  const { t, cityName, phrase } = useI18n()
  const [mode, setMode] = useState(initialMode)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    bloodGroup: 'A+',
    city: 'Cairo',
    phone: '',
    reach: 'nearby',
    consent: false,
  })

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function submitLogin(event, credentials) {
    event?.preventDefault()
    const email = credentials?.email || form.email
    const password = credentials?.password || form.password
    const result = login(email, password)
    if (!result.ok) setError(result.error)
  }

  function submitRegister(event) {
    event.preventDefault()
    if (form.name.trim().length < 2) return setError('auth.errName')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError('auth.errEmail')
    if (form.password.length < 6) return setError('auth.errPass')
    if (!form.consent) return setError('auth.errConsent')
    const result = register(form)
    if (!result.ok) setError(result.error)
  }

  return (
    <div className="min-h-screen bg-ivory">
      <header className="border-b border-line px-4 py-4">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <Logo onClick={onBack} />
          <div className="flex items-center gap-3">
            <LangSwitch />
            <button type="button" onClick={onBack} className="text-base text-mute">{t('auth.back')}</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 py-8">
        <h1 className="font-display text-4xl">{t('auth.who')}</h1>
        <p className="mt-2 text-lg leading-relaxed text-mute">{t('auth.tap')}</p>
        {error ? <div className="mt-4"><Banner tone="warn">{t(error)}</Banner></div> : null}

        {mode === 'login' ? (
          <>
            <div className="mt-6 grid gap-3">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={(event) => submitLogin(event, account)}
                  className="live-card rounded-3xl bg-paper px-5 py-4 text-start ring-1 ring-line"
                >
                  <span className="block font-display text-2xl">{account.name}</span>
                  <span className="mt-1 block text-base text-mute">
                    {t(ROLE_KEY[account.email] || 'auth.role.donor')} · {account.email === 'amira@demo.bloodbridge' ? `A+ · ${cityName('Cairo')}` : account.email === 'admin@bloodbridge.demo' ? t('auth.looks') : phrase(account.detail)}
                  </span>
                </button>
              ))}
            </div>
            <form className="mt-8 space-y-4" onSubmit={submitLogin}>
              <h2 className="font-display text-2xl">{t('auth.orEmail')}</h2>
              <Field label={t('auth.email')}>
                <TextInput type="email" autoComplete="username" value={form.email} onChange={(event) => set('email', event.target.value)} required />
              </Field>
              <Field label={t('auth.password')}>
                <TextInput type="password" autoComplete="current-password" value={form.password} onChange={(event) => set('password', event.target.value)} required />
              </Field>
              <Button type="submit" className="w-full">{t('auth.signIn')}</Button>
            </form>
            <button type="button" className="mt-6 text-base text-wine" onClick={() => { setMode('register'); setError('') }}>
              {t('auth.new')}
            </button>
          </>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={submitRegister}>
            <Field label={t('auth.name')}>
              <TextInput value={form.name} onChange={(event) => set('name', event.target.value)} required />
            </Field>
            <Field label={t('auth.email')}>
              <TextInput type="email" value={form.email} onChange={(event) => set('email', event.target.value)} required />
            </Field>
            <Field label={t('auth.password')} hint={t('auth.passHint')}>
              <TextInput type="password" value={form.password} onChange={(event) => set('password', event.target.value)} required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('auth.group')}>
                <SelectInput value={form.bloodGroup} onChange={(event) => set('bloodGroup', event.target.value)}>
                  {BLOOD_GROUPS.map((group) => (
                    <option key={group}>{group}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label={t('auth.city')}>
                <SelectInput value={form.city} onChange={(event) => set('city', event.target.value)}>
                  {CITIES.map((city) => (
                    <option key={city} value={city}>{cityName(city)}</option>
                  ))}
                </SelectInput>
              </Field>
            </div>
            <Field label={t('auth.phone')} hint={t('auth.phoneHint')}>
              <TextInput value={form.phone} onChange={(event) => set('phone', event.target.value)} />
            </Field>
            <Field label={t('auth.reach')}>
              <SelectInput value={form.reach} onChange={(event) => set('reach', event.target.value)}>
                {['city', 'nearby', 'wider'].map((value) => (
                  <option key={value} value={value}>{t(`reach.${value}`)}</option>
                ))}
              </SelectInput>
            </Field>
            <label className="flex items-start gap-3 text-base leading-relaxed">
              <input type="checkbox" className="mt-1 h-5 w-5" checked={form.consent} onChange={(event) => set('consent', event.target.checked)} />
              {t('auth.consent')}
            </label>
            <Button type="submit" className="w-full">{t('auth.create')}</Button>
            <button type="button" className="text-base text-wine" onClick={() => { setMode('login'); setError('') }}>
              {t('auth.have')}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
