import { useMemo, useState } from 'react'
import { useStore } from '../store'
import {
  BLOOD_GROUPS,
  CITIES,
  DONORS_FOR,
  assessDonor,
  defaultNeededBy,
  formatDate,
  formatWhen,
  isPastDate,
} from '../lib/blood'
import { useI18n } from '../i18n'
import {
  AppShell,
  Banner,
  Button,
  EmptyState,
  Field,
  PageHead,
  Panel,
  PriorityPill,
  SelectInput,
  StatusPill,
  Stepper,
  TextArea,
  TextInput,
  VerifyPill,
} from '../components/ui'

export default function HospitalApp() {
  const store = useStore()
  const { t, phrase } = useI18n()
  const [view, setView] = useState('dashboard')
  const [selected, setSelected] = useState(null)
  const [back, setBack] = useState('dashboard')
  const openCount = store.requests.filter(
    (item) => item.orgId === store.org.id && !['fulfilled', 'closed', 'cancelled'].includes(item.status),
  ).length

  function openRequest(id, from) {
    setSelected(id)
    setBack(from)
    setView('detail')
  }

  function navigate(id) {
    if (typeof id === 'string' && id.startsWith('request:')) {
      openRequest(id.slice('request:'.length), 'dashboard')
      return
    }
    setView(id)
  }

  return (
    <AppShell
      nav={[
        { id: 'dashboard', label: t('nav.home'), count: openCount },
        { id: 'requests', label: t('nav.finished') },
        { id: 'new', label: t('nav.ask') },
        { id: 'campaigns', label: t('nav.events') },
      ]}
      active={view === 'detail' ? back : view}
      onChange={navigate}
      user={store.user}
      detail={`${phrase(store.user.title) || t('hosp.staff')} · ${phrase(store.org.name)}${store.org.verified ? '' : ` · ${t('hosp.notVerified')}`}`}
      onLogout={store.logout}
      onReset={store.reset}
    >
      {!store.org.verified ? (
        <div className="mb-4">
          <Banner tone="warn">
            {t('hosp.unverified', { name: phrase(store.org.name) })}
          </Banner>
        </div>
      ) : null}
      {view === 'dashboard' ? <Dashboard onOpen={navigate} /> : null}
      {view === 'requests' ? (
        <RequestList onOpen={(id) => openRequest(id, 'requests')} onHome={() => setView('dashboard')} />
      ) : null}
      {view === 'detail' ? <RequestDetail key={selected} id={selected} onBack={() => setView(back)} /> : null}
      {view === 'new' ? (
        <NewRequest
          onCreated={(id) => {
            setSelected(id)
            setBack('dashboard')
            setView('detail')
          }}
        />
      ) : null}
      {view === 'campaigns' ? <Campaigns /> : null}
    </AppShell>
  )
}

function Dashboard({ onOpen }) {
  const store = useStore()
  const { t, cityName, nText, phrase, noteTitle, noteBody, needLine } = useI18n()
  const open = store.requests
    .filter((item) => item.orgId === store.org.id && !['fulfilled', 'closed', 'cancelled'].includes(item.status))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const news = store.myNotifications.filter((item) => !item.read).slice(0, 2)

  return (
    <div>
      <PageHead title={phrase(store.org.name)} lede={t('hosp.homeLede')}>
        <Button onClick={() => onOpen('new')}>{t('nav.ask')}</Button>
      </PageHead>
      {news.length > 0 ? (
        <div className="mb-4 space-y-2">
          {news.map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => {
                store.markAllRead()
                if (note.view) onOpen(note.view)
              }}
              className="block w-full rounded-3xl bg-moss px-5 py-4 text-start text-forest"
            >
              <p className="font-display text-xl">{noteTitle(note)}</p>
              <p className="mt-1 text-base">{noteBody(note)}</p>
            </button>
          ))}
        </div>
      ) : null}
      {open.length === 0 ? (
        <EmptyState title={t('hosp.empty')} action={<Button onClick={() => onOpen('new')}>{t('nav.ask')}</Button>}>
          {t('hosp.emptyNext')}
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {open.map((request) => {
            const replies = store.invitations.filter((item) => item.requestId === request.id && item.response)
            const hot = request.priority === 'urgent' || request.priority === 'critical'
            return (
              <button
                key={request.id}
                type="button"
                onClick={() => onOpen(`request:${request.id}`)}
                className="live-card block w-full overflow-hidden rounded-3xl bg-paper text-start shadow-sm ring-1 ring-black/5"
              >
                <span className={`block h-1.5 ${hot ? 'bg-wine' : 'bg-gradient-to-l from-wine/70 via-blush to-sand'}`} />
                <span className="flex items-start gap-4 p-5">
                  <span dir="ltr" className="grid h-14 min-w-14 shrink-0 place-items-center rounded-2xl bg-wine px-2 font-display text-lg text-white">
                    {request.bloodGroup}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-sm text-wine">{request.reference}</span>
                      <span className="flex flex-wrap gap-2">
                        {hot ? <PriorityPill priority={request.priority} /> : null}
                        <StatusPill status={request.status} />
                      </span>
                    </span>
                    <span className="mt-2 block break-words font-display text-2xl leading-snug">
                      {needLine(phrase(request.facility), request.units, request.bloodGroup)}
                    </span>
                    <span className="mt-1 block text-base text-mute">
                      {cityName(request.city)} · {t('hosp.neededLine', { when: formatWhen(request.neededBy), replies: nText(replies.length, 'reply'), priority: t(`priority.${request.priority}`) })}
                    </span>
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function RequestList({ onOpen, onHome }) {
  const store = useStore()
  const { t, nText, needLine, phrase } = useI18n()
  const rows = store.requests
    .filter((request) => request.orgId === store.org.id && ['fulfilled', 'closed', 'cancelled'].includes(request.status))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return (
    <div>
      <PageHead title={t('nav.finished')} lede={t('hosp.doneLede')} />
      {rows.length === 0 ? (
        <EmptyState action={<Button variant="line" onClick={onHome}>{t('hosp.openAction')}</Button>}>
          {t('hosp.doneEmpty')}
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {rows.map((request) => {
            const replies = store.invitations.filter((item) => item.requestId === request.id && item.response)
            return (
              <button
                key={request.id}
                type="button"
                onClick={() => onOpen(request.id)}
                className="live-card block w-full overflow-hidden rounded-3xl bg-paper text-start shadow-sm ring-1 ring-black/5"
              >
                <span className="block h-1.5 bg-gradient-to-l from-forest/70 via-moss to-sand" />
                <span className="flex items-start gap-4 p-5">
                  <span dir="ltr" className="grid h-14 min-w-14 shrink-0 place-items-center rounded-2xl bg-forest px-2 font-display text-lg text-white">
                    {request.bloodGroup}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-sm text-wine">{request.reference}</span>
                      <StatusPill status={request.status} />
                    </span>
                    <span className="mt-2 block break-words font-display text-2xl leading-snug">
                      {needLine(phrase(request.facility), request.units, request.bloodGroup)}
                    </span>
                    <span className="mt-1 block text-base text-mute">
                      {t('hosp.neededLine', { when: formatWhen(request.neededBy), replies: nText(replies.length, 'reply'), priority: t(`priority.${request.priority}`) })}
                    </span>
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function RequestDetail({ id, onBack }) {
  const store = useStore()
  const { t, tx, phrase, cityName, needLine, wave, reasonText } = useI18n()
  const request = store.requests.find((item) => item.id === id && item.orgId === store.org.id)
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(null)

  const pool = useMemo(() => {
    if (!request) return []
    const invited = new Set(store.invitations.filter((item) => item.requestId === request.id).map((item) => item.donorId))
    return store.donors.map((donor) => ({
      donor,
      user: store.users.find((item) => item.id === donor.userId),
      ...assessDonor(donor, request, invited.has(donor.id)),
    }))
  }, [request, store.donors, store.invitations, store.users])

  if (!request) {
    return (
      <div>
        <Button variant="ghost" onClick={onBack}>{t('auth.back')}</Button>
        <div className="mt-4">
          <Banner tone="warn">{t('hosp.missing')}</Banner>
        </div>
      </div>
    )
  }

  const invitedRows = store.invitations
    .filter((item) => item.requestId === request.id)
    .map((invitation) => ({
      invitation,
      donor: store.donors.find((item) => item.id === invitation.donorId),
      user: store.users.find((item) => item.id === store.donors.find((donor) => donor.id === invitation.donorId)?.userId),
    }))
  const nextTier = request.priority === 'critical' ? null : (request.wave || 0) + 1
  const coming = pool.filter((row) => row.ok && !row.invited && (request.priority === 'critical' || row.tier === nextTier))
  const skipped = pool.filter((row) => !row.ok)
  const terminal = ['fulfilled', 'closed', 'cancelled'].includes(request.status)
  const waveDone = (request.wave || 0) >= 3 || terminal

  function act(run) {
    const result = run()
    setError(result.ok ? '' : result.error)
    if (result.ok) setConfirm(null)
  }

  return (
    <div>
      <button type="button" onClick={onBack} className="text-sm text-mute hover:text-ink">
        {t('hosp.allReq')}
      </button>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-wine">{request.reference}</p>
          <h1 className="mt-2 font-display text-3xl leading-snug">
            {needLine(phrase(request.facility), request.units, request.bloodGroup)}
          </h1>
          <p className="mt-1 text-sm text-mute">
            {t('hosp.placeLine', { place: phrase(request.facility), city: cityName(request.city), when: formatWhen(request.neededBy) })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PriorityPill priority={request.priority} />
          <VerifyPill status={request.verificationStatus} />
          <StatusPill status={request.status} />
        </div>
      </div>

      {request.status === 'fulfilled' ? (
        <div className="mt-4">
          <Banner tone="good">{t('hosp.finishedLeave')}</Banner>
        </div>
      ) : null}
      {error ? (
        <div className="mt-4">
          <Banner tone="warn">{tx(error)}</Banner>
        </div>
      ) : null}
      {request.rejectReason ? (
        <div className="mt-4">
          <Banner tone="warn">{t('hosp.declined', { reason: reasonText(request.rejectReason) })}</Banner>
        </div>
      ) : null}
      {request.waveNote ? (
        <div className="mt-4">
          <Banner>{wave(request.waveNote)}</Banner>
        </div>
      ) : null}

      <div className="mt-5">
        <Stepper status={request.status} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel>
          <h2 className="font-display text-2xl">{t('hosp.askTitle')}</h2>
          <p className="mt-2 text-base leading-relaxed text-mute">
            {t('hosp.give', { group: request.bloodGroup, list: DONORS_FOR[request.bloodGroup].join(', ') })}
          </p>
          <p className="mt-2 text-base leading-relaxed text-mute">
            {request.priority === 'critical' ? t('hosp.emergency') : t('hosp.steps')}
          </p>
          <Button
            className="mt-4"
            disabled={request.verificationStatus !== 'verified' || waveDone}
            onClick={() => act(() => store.sendWave(request.id))}
          >
            {request.verificationStatus !== 'verified'
              ? t('hosp.wait')
              : waveDone
                ? t('hosp.doneAsk')
                : request.priority === 'critical'
                  ? t('hosp.askAll')
                  : nextTier === 1
                    ? t('hosp.askCity')
                    : nextTier === 2
                      ? t('hosp.askNear')
                      : t('hosp.askFar')}
          </Button>
          {coming.length > 0 && !waveDone ? (
            <p className="mt-3 text-sm text-mute">
              {t('hosp.nextAsk', { names: coming.map((row) => row.user?.name).filter(Boolean).join(', ') })}
            </p>
          ) : null}
        </Panel>
        <Panel>
          <h2 className="font-display text-2xl">{t('hosp.note')}</h2>
          <p className="mt-2 text-base leading-relaxed">{phrase(request.note) || t('hosp.noNote')}</p>
          <p className="mt-3 text-sm text-mute">{t('hosp.noteHide')}</p>
        </Panel>
      </div>

      <h2 className="mb-3 mt-8 font-display text-2xl">{t('hosp.who')}</h2>
      <div className="overflow-x-auto rounded-3xl bg-paper ring-1 ring-black/5">
        <table className="w-full min-w-[640px] text-start text-sm">
          <thead className="text-xs uppercase tracking-wider text-mute">
            <tr>
              <th className="px-4 py-3 font-medium">{t('hosp.person')}</th>
              <th className="px-4 py-3 font-medium">{t('hosp.groupCol')}</th>
              <th className="px-4 py-3 font-medium">{t('hosp.cityCol')}</th>
              <th className="px-4 py-3 font-medium">{t('hosp.farCol')}</th>
              <th className="px-4 py-3 font-medium">{t('hosp.answer')}</th>
            </tr>
          </thead>
          <tbody>
            {invitedRows.map(({ invitation, donor, user }) => (
              <tr key={invitation.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <span className="block font-medium">{user?.name}</span>
                  <span className="text-xs text-mute">{donor?.phone || t('hosp.noPhone')}</span>
                </td>
                <td className="px-4 py-3">{donor?.bloodGroup}</td>
                <td className="px-4 py-3">{cityName(donor?.city)}</td>
                <td className="px-4 py-3">{t(`tier.${invitation.wave}`)}</td>
                <td className="px-4 py-3">
                  {invitation.response ? t(invitation.response === 'available' ? 'invite.yes' : invitation.response === 'unavailable' ? 'invite.no' : 'invite.question') : t('hosp.waiting')}
                  {invitation.respondedAt ? (
                    <span className="mt-1 block text-xs text-mute">{formatWhen(invitation.respondedAt)}</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {invitedRows.length === 0 ? <p className="px-4 py-4 text-base text-mute">{t('hosp.noAsked')}</p> : null}
      </div>

      <details className="mt-4 rounded-3xl bg-paper p-5 ring-1 ring-black/5">
        <summary className="cursor-pointer text-base font-medium">{t('hosp.why', { n: skipped.length })}</summary>
        <ul className="mt-3 space-y-2 text-sm">
          {skipped.map((row) => (
            <li key={row.donor.id} className="flex flex-wrap justify-between gap-2 border-t border-line pt-2">
              <span>
                {row.user?.name} · {row.donor.bloodGroup} · {cityName(row.donor.city)}
              </span>
              <span className="text-mute">{t(`skip.${row.reason}`)}</span>
            </li>
          ))}
        </ul>
      </details>

      <h2 className="mb-3 mt-8 font-display text-2xl">{t('hosp.what')}</h2>
      <p className="mb-3 max-w-2xl text-base text-mute">{t('hosp.whatBody')}</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="line" disabled={terminal || request.verificationStatus !== 'verified'} onClick={() => act(() => store.setStatus(request.id, 'contacted'))}>
          {t('hosp.called')}
        </Button>
        {confirm === 'fulfilled' ? (
          <Button variant="forest" onClick={() => act(() => store.setStatus(request.id, 'fulfilled'))}>
            {t('hosp.metYes')}
          </Button>
        ) : (
          <Button variant="forest" disabled={terminal || request.verificationStatus !== 'verified'} onClick={() => setConfirm('fulfilled')}>
            {t('hosp.metBtn')}
          </Button>
        )}
        {confirm === 'closed' ? (
          <Button variant="soft" onClick={() => act(() => store.setStatus(request.id, 'closed'))}>
            {t('hosp.closeYes')}
          </Button>
        ) : (
          <Button variant="line" disabled={terminal || request.verificationStatus !== 'verified'} onClick={() => setConfirm('closed')}>
            {t('hosp.close')}
          </Button>
        )}
        {confirm === 'cancelled' ? (
          <Button variant="soft" onClick={() => act(() => store.setStatus(request.id, 'cancelled'))}>
            {t('hosp.cancelYes')}
          </Button>
        ) : (
          <Button variant="ghost" disabled={terminal} onClick={() => setConfirm('cancelled')}>
            {t('hosp.cancel')}
          </Button>
        )}
      </div>

      <h2 className="mb-3 mt-8 font-display text-2xl">{t('hosp.history')}</h2>
      <ol className="space-y-2">
        {request.history.map((entry, index) => (
          <li key={`${entry.at}-${index}`} className="rounded-2xl bg-paper px-4 py-3 text-sm ring-1 ring-black/5">
            <span className="font-medium">{t(`status.${entry.status}`)}</span>
            <span className="mt-1 block text-mute">
              {phrase(entry.by)} · {formatWhen(entry.at)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function NewRequest({ onCreated }) {
  const store = useStore()
  const { t, tx, phrase, cityName, needLine } = useI18n()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    bloodGroup: 'A+',
    units: 2,
    city: store.org.city,
    facility: store.org.name,
    neededBy: defaultNeededBy(),
    priority: 'urgent',
    note: '',
  })

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function submit(event) {
    event.preventDefault()
    const result = store.createRequest(form)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onCreated(result.request.id)
  }

  return (
    <div>
      <PageHead title={t('hosp.askPage')} lede={t('hosp.askLede')} />
      <Panel className="mb-4">
        <p className="text-base text-mute">{t('need.preview')}</p>
        <p className="mt-2 font-display text-2xl leading-snug">
          {needLine(phrase(form.facility || store.org.name), Number(form.units) || 0, form.bloodGroup)}
        </p>
      </Panel>
      {error ? (
        <div className="mb-4">
          <Banner tone="warn">{tx(error)}</Banner>
        </div>
      ) : null}
      <form onSubmit={submit} className="grid max-w-2xl gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('auth.group')}>
            <SelectInput value={form.bloodGroup} onChange={(event) => set('bloodGroup', event.target.value)}>
              {BLOOD_GROUPS.map((group) => (
                <option key={group}>{group}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label={t('hosp.bags')} hint={t('hosp.bagsHint')}>
            <TextInput type="number" min="1" max="20" value={form.units} onChange={(event) => set('units', event.target.value)} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('auth.city')}>
            <SelectInput value={form.city} onChange={(event) => set('city', event.target.value)}>
              {CITIES.map((city) => (
                <option key={city} value={city}>{cityName(city)}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label={t('hosp.building')} hint={t('hosp.buildingHint')}>
            <TextInput value={form.facility} onChange={(event) => set('facility', event.target.value)} />
          </Field>
        </div>
        <Field label={t('hosp.when')}>
          <TextInput type="datetime-local" value={form.neededBy} onChange={(event) => set('neededBy', event.target.value)} />
        </Field>
        <Field label={t('hosp.urgent')} hint={t('hosp.urgentHint')}>
          <SelectInput value={form.priority} onChange={(event) => set('priority', event.target.value)}>
            <option value="routine">{t('priority.routine')}</option>
            <option value="urgent">{t('priority.urgent')}</option>
            <option value="critical">{t('priority.critical')}</option>
          </SelectInput>
        </Field>
        <Field label={t('hosp.note')} hint={t('hosp.noteHint')}>
          <TextArea value={form.note} onChange={(event) => set('note', event.target.value)} />
        </Field>
        <Button type="submit">{t('hosp.send')}</Button>
      </form>
    </div>
  )
}

function Campaigns() {
  const store = useStore()
  const { t, tx, phrase, cityName } = useI18n()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    host: '',
    city: store.org.city,
    location: '',
    date: '',
    description: '',
  })
  const mine = store.campaigns.filter((item) => item.orgId === store.org.id)

  function submit(event) {
    event.preventDefault()
    const result = store.createCampaign(form)
    setError(result.ok ? '' : result.error)
    if (result.ok) setForm({ title: '', host: '', city: store.org.city, location: '', date: '', description: '' })
  }

  return (
    <div>
      <PageHead title={t('nav.events')} lede={t('hosp.eventsLede')} />
      {error ? (
        <div className="mb-4">
          <Banner tone="warn">{tx(error)}</Banner>
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={submit} className="space-y-3 rounded-3xl bg-paper p-5 ring-1 ring-black/5">
          <h2 className="font-display text-2xl">{t('hosp.newEvent')}</h2>
          <Field label={t('hosp.title')}>
            <TextInput value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </Field>
          <Field label={t('hosp.host')} hint={t('hosp.hostHint')}>
            <TextInput value={form.host} onChange={(event) => setForm({ ...form, host: event.target.value })} placeholder={phrase(store.org.name)} />
          </Field>
          <Field label={t('auth.city')}>
            <SelectInput value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })}>
              {CITIES.map((city) => (
                <option key={city} value={city}>{cityName(city)}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label={t('hosp.place')}>
            <TextInput value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
          </Field>
          <Field label={t('hosp.date')}>
            <TextInput type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </Field>
          <Field label={t('hosp.desc')}>
            <TextArea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </Field>
          <Button type="submit">{t('hosp.publish')}</Button>
        </form>
        <div className="space-y-4">
          {mine.map((campaign) => (
            <article key={campaign.id} className="live-card rounded-3xl bg-paper p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-xs uppercase tracking-wider text-mute">{formatDate(campaign.date)} · {cityName(campaign.city)}</p>
              <h3 className="font-display text-2xl">{phrase(campaign.title)}</h3>
              <p className="text-sm text-mute">{phrase(campaign.host)} · {phrase(campaign.location)}</p>
              <ul className="mt-4 space-y-2">
                {campaign.registrations.length === 0 ? <li className="text-sm text-mute">{t('hosp.noSeats')}</li> : null}
                {campaign.registrations.map((reg) => {
                  const donor = store.donors.find((item) => item.id === reg.donorId)
                  const person = store.users.find((item) => item.id === donor?.userId)
                  const attended = campaign.attendance.includes(reg.donorId)
                  const past = isPastDate(campaign.date)
                  return (
                    <li key={reg.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-ivory px-3 py-2 text-sm">
                      <span>
                        {person?.name} · {reg.slot}
                        {attended ? t('hosp.confirmedBit') : ''}
                      </span>
                      {!attended && past ? (
                        <Button className="px-3 py-1.5 text-xs" variant="line" onClick={() => store.confirmAttendance(campaign.id, reg.donorId)}>
                          {t('hosp.confirm')}
                        </Button>
                      ) : null}
                      {!past && !attended ? <span className="text-xs text-mute">{t('hosp.after')}</span> : null}
                    </li>
                  )
                })}
              </ul>
            </article>
          ))}
          {mine.length === 0 ? <EmptyState>{t('hosp.noEvents')}</EmptyState> : null}
        </div>
      </div>
    </div>
  )
}
