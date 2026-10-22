import { useState } from 'react'
import { useStore } from '../store'
import { formatWhen } from '../lib/blood'
import {
  AppShell,
  Banner,
  Button,
  PageHead,
  PriorityPill,
  StatusPill,
} from '../components/ui'
import { useI18n } from '../i18n'

const REASONS = ['duplicate', 'detail', 'unknown', 'outdated']

export default function AdminApp() {
  const store = useStore()
  const { t } = useI18n()
  const [view, setView] = useState('review')
  const pending = store.requests.filter((item) => item.verificationStatus === 'pending').length

  function open(id) {
    setView(id || 'review')
  }

  return (
    <AppShell
      nav={[
        { id: 'review', label: t('nav.check'), count: pending },
        { id: 'organizations', label: t('nav.hospitals') },
      ]}
      active={view}
      onChange={open}
      user={store.user}
      detail={t('admin.detail')}
      onLogout={store.logout}
      onReset={store.reset}
    >
      {view === 'review' ? <Review /> : null}
      {view === 'organizations' ? <Organizations /> : null}
    </AppShell>
  )
}

function Review() {
  const store = useStore()
  const { t, tx, phrase, cityName, needLine, reasonText } = useI18n()
  const [error, setError] = useState('')
  const [reason, setReason] = useState(REASONS[0])
  const queue = store.requests.filter((item) => item.verificationStatus === 'pending')

  function run(fn) {
    const result = fn()
    setError(result.ok ? '' : result.error)
  }

  return (
    <div>
      <PageHead title={t('admin.title')} lede={t('admin.lede')} />
      {error ? (
        <div className="mb-4">
          <Banner tone="warn">{tx(error)}</Banner>
        </div>
      ) : null}
      <div className="space-y-4">
        {queue.length === 0 ? <Banner tone="good">{t('admin.clear')}</Banner> : null}
        {queue.map((request) => {
          const org = store.orgs.find((item) => item.id === request.orgId)
          return (
            <article key={request.id} className="live-card overflow-hidden rounded-3xl bg-paper shadow-sm ring-1 ring-black/5">
              <div className={`h-1.5 ${request.priority === 'urgent' || request.priority === 'critical' ? 'bg-wine' : 'bg-gradient-to-l from-wine/70 via-blush to-sand'}`} />
              <div className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-sm text-wine">{request.reference}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span dir="ltr" className="inline-flex rounded-full bg-wine px-3 py-1 font-display text-sm text-white">{request.bloodGroup}</span>
                  {request.priority === 'urgent' || request.priority === 'critical' ? <PriorityPill priority={request.priority} /> : null}
                </div>
              </div>
              <h2 className="mt-2 font-display text-2xl leading-snug">
                {needLine(phrase(request.facility) || phrase(org?.name), request.units, request.bloodGroup)}
              </h2>
              <p className="mt-1 text-base text-mute">
                {phrase(org?.type)} · {cityName(request.city)} · {formatWhen(request.neededBy)}
                {org?.verified ? ` · ${t('admin.license', { id: org.license })}` : ` · ${t('admin.orgNo')}`}
              </p>
              {request.note ? <p className="mt-3 text-sm leading-relaxed">{phrase(request.note)}</p> : null}
              <p className="mt-2 text-xs text-mute">{t('admin.by', { name: request.createdBy, when: formatWhen(request.createdAt) })}</p>
              {!org?.verified ? (
                <div className="mt-3">
                  <Banner tone="warn">{t('admin.checkOrg', { name: phrase(org?.name) })}</Banner>
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button disabled={!org?.verified} onClick={() => run(() => store.verifyRequest(request.id))}>
                  {t('admin.real')}
                </Button>
                <select
                  className="rounded-full border border-line bg-white px-3 py-2 text-base"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  aria-label={t('admin.declineFor', { ref: request.reference })}
                >
                  {REASONS.map((item) => (
                    <option key={item} value={item}>{reasonText(item)}</option>
                  ))}
                </select>
                <Button variant="line" onClick={() => run(() => store.rejectRequest(request.id, reason))}>
                  {t('admin.backBtn')}
                </Button>
              </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function Organizations() {
  const store = useStore()
  const { t, tx, phrase, cityName, nText } = useI18n()
  const [error, setError] = useState('')

  return (
    <div>
      <PageHead title={t('admin.hospTitle')} lede={t('admin.hospLede')} />
      {error ? (
        <div className="mb-4">
          <Banner tone="warn">{tx(error)}</Banner>
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {store.orgs.map((org) => {
          const count = store.requests.filter((item) => item.orgId === org.id).length
          return (
            <article key={org.id} className="rounded-3xl bg-paper p-5 ring-1 ring-black/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl">{phrase(org.name)}</h2>
                  <p className="text-sm text-mute">
                    {phrase(org.type)} · {cityName(org.city)}
                  </p>
                  <p className="mt-1 text-xs text-mute">{org.license}</p>
                </div>
                <StatusPill status={org.verified ? 'verified' : 'pending_verification'} />
              </div>
              <p className="mt-3 text-sm text-mute">{t('admin.onFile', { n: nText(count, 'request') })}</p>
              {!org.verified ? (
                <Button
                  className="mt-4"
                  onClick={() => {
                    const result = store.verifyOrg(org.id)
                    setError(result.ok ? '' : result.error)
                  }}
                >
                  {t('admin.hospitalReal')}
                </Button>
              ) : (
                <p className="mt-4 text-base text-forest">{t('admin.checked')}</p>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
