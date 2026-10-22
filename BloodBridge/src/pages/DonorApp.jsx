import { useState } from 'react'
import { useStore } from '../store'
import {
  BLOOD_GROUPS,
  CITIES,
  SLOTS,
  assessDonor,
  formatDate,
  formatWhen,
  isPastDate,
  slotTaken,
  weekDates,
} from '../lib/blood'
import { useI18n } from '../i18n'
import {
  AppShell,
  Banner,
  Button,
  EmptyState,
  Field,
  NeedCard,
  PageHead,
  Panel,
  SelectInput,
  TextInput,
} from '../components/ui'

export default function DonorApp() {
  const store = useStore()
  const { t, cityName } = useI18n()
  const [view, setView] = useState('overview')

  return (
    <AppShell
      nav={[
        { id: 'overview', label: t('nav.home') },
        { id: 'needs', label: t('nav.needs'), count: store.requests.filter((item) => item.verificationStatus === 'verified' && !['fulfilled', 'closed', 'cancelled'].includes(item.status)).length },
        { id: 'availability', label: t('nav.time') },
        { id: 'campaigns', label: t('nav.events') },
      ]}
      active={view}
      onChange={setView}
      user={store.user}
      detail={`${'\u2066'}${store.donor.bloodGroup}${'\u2069'} · ${cityName(store.donor.city)}${store.donor.paused ? ` · ${t('shell.paused')}` : ''}`}
      onLogout={store.logout}
      onReset={store.reset}
    >
      {view === 'overview' ? <Overview onOpen={setView} /> : null}
      {view === 'needs' ? <HospitalNeeds onOpen={setView} /> : null}
      {view === 'availability' ? <Availability /> : null}
      {view === 'campaigns' ? <Campaigns /> : null}
    </AppShell>
  )
}

function Overview({ onOpen }) {
  const { user, donor, campaigns, updateDonor } = useStore()
  const { t, phrase } = useI18n()
  const next = campaigns
    .filter((item) => item.registrations.some((reg) => reg.donorId === donor.id) && !isPastDate(item.date))
    .sort((a, b) => a.date.localeCompare(b.date))[0]
  const seat = next?.registrations.find((reg) => reg.donorId === donor.id)

  return (
    <div>
      <PageHead title={t('hello', { name: user.name.split(' ')[0] })} lede={t('invite.lede')} />
      {donor.paused || !donor.consent ? (
        <div className="mb-4">
          <Banner tone="warn">{t('overview.paused')}</Banner>
        </div>
      ) : null}
      {donor.reviewReminder && !donor.reminderSeenAt ? (
        <div className="mb-4">
          <Banner>
            <p>{t('overview.remind')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="line" onClick={() => onOpen('availability')}>
                {t('overview.seeTime')}
              </Button>
              <Button variant="ghost" onClick={() => updateDonor({ reminderSeenAt: new Date().toISOString() })}>
                {t('overview.notNow')}
              </Button>
            </div>
          </Banner>
        </div>
      ) : null}
      <Invitations onOpen={onOpen} />
      <Panel className="mt-4">
        <p className="text-base text-mute">{t('overview.next')}</p>
        {next ? (
          <>
            <p className="mt-2 font-display text-2xl">{phrase(next.title)}</p>
            <p className="mt-1 text-base text-mute">
              {t('overview.arrive', { date: formatDate(next.date), slot: seat?.slot })}
            </p>
          </>
        ) : (
          <p className="mt-2 text-base">{t('overview.noEvent')}</p>
        )}
        <Button className="mt-4" variant="line" onClick={() => onOpen('campaigns')}>
          {t('nav.events')}
        </Button>
      </Panel>
    </div>
  )
}

function Invitations({ onOpen }) {
  const { donor, invitations, requests, orgs, respond } = useStore()
  const { t, tx, phrase, cityName, needLine } = useI18n()
  const [error, setError] = useState('')
  const [gone, setGone] = useState(false)
  const mine = invitations
    .filter((item) => item.donorId === donor.id)
    .sort((a, b) => new Date(b.notifiedAt) - new Date(a.notifiedAt))
  const waiting = mine.filter((item) => {
    if (item.response) return false
    const request = requests.find((row) => row.id === item.requestId)
    return request && !['fulfilled', 'closed', 'cancelled'].includes(request.status)
  })

  function answer(invitation, response) {
    const result = respond(invitation.id, response)
    setError(result.ok ? '' : result.error)
    if (result.ok && response === 'available') setGone(true)
  }

  return (
    <div>
      {error ? (
        <div className="mb-4">
          <Banner tone="warn">{tx(error)}</Banner>
        </div>
      ) : null}
      {gone ? (
        <div className="mb-4">
          <Banner tone="good">{t('invite.gone')}</Banner>
        </div>
      ) : null}
      {waiting.length === 0 ? (
        <Panel>
          <p className="text-base">{t('invite.ready')}</p>
          <Button className="mt-4" onClick={() => onOpen('needs')}>
            {t('nav.needs')}
          </Button>
          <Button className="mt-2" variant="line" onClick={() => onOpen('availability')}>
            {t('invite.readyAction')}
          </Button>
        </Panel>
      ) : null}
      <div className="space-y-4">
        {waiting.map((invitation) => {
          const request = requests.find((item) => item.id === invitation.requestId)
          const org = orgs.find((item) => item.id === request?.orgId)
          if (!request) return null
          const hospital = phrase(request.facility) || phrase(org?.name)
          return (
            <article key={invitation.id} className="live-card overflow-hidden rounded-3xl bg-paper shadow-sm ring-1 ring-black/5">
              <div className="h-1.5 bg-gradient-to-l from-wine/80 via-blush to-sand" />
              <div className="p-5">
              <div className="flex items-start gap-3">
                <span dir="ltr" className="grid h-14 min-w-14 shrink-0 place-items-center rounded-2xl bg-wine px-2 font-display text-lg text-white">
                  {request.bloodGroup}
                </span>
                <div className="min-w-0">
              <p className="font-mono text-sm text-wine">{request.reference}</p>
              <h2 className="mt-1 break-words font-display text-2xl leading-snug md:text-3xl">{needLine(hospital, request.units, request.bloodGroup)}</h2>
                </div>
              </div>
              <p className="mt-2 text-base text-mute">
                {cityName(request.city)} · {t('invite.needed', { when: formatWhen(request.neededBy) })}
              </p>
              <p className="mt-4 text-base">{t('invite.ask')}</p>
              <div className="mt-4 grid gap-2">
                <Button onClick={() => answer(invitation, 'available')}>
                  {t('invite.yes')}
                </Button>
                <Button variant="line" onClick={() => answer(invitation, 'unavailable')}>
                  {t('invite.no')}
                </Button>
                <Button variant="line" onClick={() => answer(invitation, 'more_info')}>
                  {t('invite.question')}
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

function HospitalNeeds({ onOpen }) {
  const { user, donor, requests, orgs, offerDonation } = useStore()
  const { t, tx, phrase, cityName, needLine, lang } = useI18n()
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)
  const week = weekDates()
  const open = requests
    .filter((item) => item.verificationStatus === 'verified' && !['fulfilled', 'closed', 'cancelled'].includes(item.status))
    .sort((a, b) => String(a.neededBy).localeCompare(String(b.neededBy)))

  function myTimes() {
    const picked = []
    week.forEach((day) => {
      SLOTS.forEach((slot) => {
        if (donor.availability?.[day.label]?.includes(slot)) {
          picked.push(`${t(`day.${day.label}`)} ${day.date} ${t(`slot.${slot}`)}`)
        }
      })
    })
    return picked.slice(0, 3).join(lang === 'ar' ? '، ' : ', ')
  }

  function donate(request, hospital) {
    const result = offerDonation(request.id)
    if (!result.ok) {
      setDone(null)
      setError(result.error)
      return
    }
    setError('')
    setDone({ hospital, slots: myTimes() })
  }

  return (
    <div>
      <PageHead title={t('needs.title')} lede={t('needs.lede')} />
      {error ? (
        <div className="mb-4">
          <Banner tone="warn">{tx(error)}</Banner>
        </div>
      ) : null}
      {done ? (
        <div className="mb-4">
          <Banner tone="good">
            <p>{t('needs.done', { hospital: done.hospital, email: user.email })}</p>
            <p className="mt-2">{done.slots ? t('needs.when', { when: done.slots }) : t('needs.noTime')}</p>
            {done.slots ? null : (
              <Button className="mt-3" variant="line" onClick={() => onOpen('availability')}>
                {t('nav.time')}
              </Button>
            )}
          </Banner>
        </div>
      ) : null}
      {open.length === 0 ? (
        <EmptyState>{t('needs.empty')}</EmptyState>
      ) : (
        <div className="space-y-4">
          {open.map((request) => {
            const org = orgs.find((item) => item.id === request.orgId)
            const hospital = phrase(request.facility) || phrase(org?.name)
            return (
              <NeedCard
                key={request.id}
                group={request.bloodGroup}
                title={needLine(hospital, request.units, request.bloodGroup)}
                city={cityName(request.city)}
                when={formatWhen(request.neededBy)}
                units={request.units}
                priority={request.priority}
                action={
                  <Button onClick={() => donate(request, hospital)}>
                    {t('needs.donate')}
                  </Button>
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function Availability() {
  const { user, donor, requests, orgs, updateDonor } = useStore()
  const { t, phrase, cityName, lang } = useI18n()
  const [phone, setPhone] = useState(donor.phone)
  const [withdraw, setWithdraw] = useState(false)
  const [notice, setNotice] = useState(null)
  const week = weekDates()

  function toggle(day, slot) {
    const current = donor.availability?.[day] || []
    const next = current.includes(slot) ? current.filter((item) => item !== slot) : [...current, slot]
    updateDonor({ availability: { ...donor.availability, [day]: next } })
    setNotice(null)
  }

  function register() {
    const picked = []
    week.forEach((day) => {
      SLOTS.forEach((slot) => {
        if (donor.availability?.[day.label]?.includes(slot)) {
          picked.push(`${t(`day.${day.label}`)} ${day.date} ${t(`slot.${slot}`)}`)
        }
      })
    })
    if (picked.length === 0) {
      setNotice({ kind: 'warn' })
      return
    }
    updateDonor({ phone })
    const ready = { ...donor, phone, consent: true, paused: false }
    const names = []
    requests.forEach((request) => {
      if (request.verificationStatus !== 'verified') return
      if (['fulfilled', 'closed', 'cancelled'].includes(request.status)) return
      if (!assessDonor(ready, request, false).ok) return
      const org = orgs.find((item) => item.id === request.orgId)
      const name = phrase(request.facility) || phrase(org?.name)
      if (name && !names.includes(name)) names.push(name)
    })
    setNotice({ kind: 'good', names, when: picked.slice(0, 4).join(lang === 'ar' ? '، ' : ', ') })
  }

  return (
    <div>
      <PageHead
        title={t('time.title')}
        lede={t('time.lede')}
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Panel>
          <p className="text-base font-medium">{t('time.stop')}</p>
          <p className="mt-1 text-base text-mute">{t('time.stopBody')}</p>
          <Button className="mt-3" variant={donor.paused ? 'forest' : 'line'} onClick={() => updateDonor({ paused: !donor.paused, consent: true })}>
            {donor.paused ? t('time.resume') : t('time.stop')}
          </Button>
        </Panel>
        <Panel>
          <p className="text-base font-medium">{t('time.full')}</p>
          <p className="mt-1 text-base text-mute">{t('time.fullBody')}</p>
          {withdraw ? (
            <Button
              className="mt-3"
              variant="soft"
              onClick={() => {
                updateDonor({ consent: false, paused: true })
                setWithdraw(false)
              }}
            >
              {t('time.fullYes')}
            </Button>
          ) : (
            <Button className="mt-3" variant="ghost" onClick={() => setWithdraw(true)}>
              {t('time.fullNo')}
            </Button>
          )}
        </Panel>
      </div>
      <Panel>
        <div className="grid gap-3 md:grid-cols-7">
          {week.map((day) => (
            <div key={day.label} className="rounded-2xl bg-ivory p-3">
              <p className="text-xs uppercase tracking-wider text-mute">{t(`day.${day.label}`)}</p>
              <p className="font-display text-lg">
                {day.date} {day.month}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {SLOTS.map((slot) => {
                  const on = donor.availability?.[day.label]?.includes(slot)
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => toggle(day.label, slot)}
                      className={`rounded-full px-3 py-2 text-sm ${on ? 'bg-wine text-white' : 'bg-paper text-ink ring-1 ring-line'}`}
                    >
                      {t(`slot.${slot}`)}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-mute">{t('time.saved')}</p>
      </Panel>
      <Panel className="mt-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t('auth.city')}>
            <SelectInput value={donor.city} onChange={(event) => updateDonor({ city: event.target.value })}>
              {CITIES.map((city) => (
                <option key={city} value={city}>{cityName(city)}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label={t('time.travel')}>
            <SelectInput value={donor.reach} onChange={(event) => updateDonor({ reach: event.target.value })}>
              {['city', 'nearby', 'wider'].map((value) => (
                <option key={value} value={value}>
                  {t(`reach.${value}`)}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label={t('auth.group')} hint={t('time.groupHint')}>
            <SelectInput value={donor.bloodGroup} onChange={(event) => updateDonor({ bloodGroup: event.target.value })}>
              {BLOOD_GROUPS.map((group) => (
                <option key={group}>{group}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label={t('auth.phone')}>
            <TextInput
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              onBlur={() => updateDonor({ phone })}
            />
          </Field>
        </div>
        <label className="mt-4 flex items-start gap-3 text-sm leading-relaxed">
          <input
            type="checkbox"
            className="mt-1"
            checked={donor.reviewReminder}
            onChange={(event) => updateDonor({ reviewReminder: event.target.checked, reminderSeenAt: null })}
          />
          {t('time.remindCheck')}
        </label>
        {notice?.kind === 'warn' ? (
          <div className="mt-4">
            <Banner tone="warn">{t('time.needSlot')}</Banner>
          </div>
        ) : null}
        {notice?.kind === 'good' ? (
          <div className="mt-4">
            <Banner tone="good">
              <p>{t('time.sent', { email: user.email })}</p>
              <p className="mt-2">
                {notice.names.length ? t('time.sentWho', { name: notice.names.join(lang === 'ar' ? '، ' : ', ') }) : t('time.sentNone')}
              </p>
              <p className="mt-2">{t('time.sentWhen', { when: notice.when })}</p>
            </Banner>
          </div>
        ) : null}
        <Button className="mt-5 w-full" onClick={register}>
          {t('time.register')}
        </Button>
        <p className="mt-2 text-sm text-mute">{t('time.registerHint')}</p>
      </Panel>
    </div>
  )
}

function Campaigns() {
  const { donor, campaigns, orgs, registerCampaign, releaseCampaign } = useStore()
  const { t, tx, phrase, cityName } = useI18n()
  const [error, setError] = useState('')

  function reserve(campaign, slot) {
    const result = registerCampaign(campaign.id, slot)
    setError(result.ok ? '' : result.error)
  }

  return (
    <div>
      <PageHead title={t('event.title')} lede={t('event.lede')} />
      {error ? (
        <div className="mb-4">
          <Banner tone="warn">{tx(error)}</Banner>
        </div>
      ) : null}
      <div className="space-y-4">
        {campaigns.length === 0 ? <EmptyState>{t('event.empty')}</EmptyState> : null}
        {campaigns
          .slice()
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((campaign) => {
            const mine = campaign.registrations.find((reg) => reg.donorId === donor.id)
            const past = isPastDate(campaign.date)
            const attended = campaign.attendance.includes(donor.id)
            const org = orgs.find((item) => item.id === campaign.orgId)
            return (
              <article key={campaign.id} className="live-card rounded-3xl bg-paper p-5 shadow-sm ring-1 ring-black/5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-mute">
                      {formatDate(campaign.date)} · {cityName(campaign.city)}
                    </p>
                    <h2 className="mt-1 font-display text-2xl">{phrase(campaign.title)}</h2>
                    <p className="text-sm text-mute">
                      {phrase(campaign.host)} · {phrase(campaign.location)}
                      {org ? ` · ${t('event.with', { name: phrase(org.name) })}` : ''}
                    </p>
                  </div>
                  {attended ? <span className="rounded-full bg-moss px-3 py-1 text-xs text-forest">{t('event.confirmed')}</span> : null}
                  {past && !attended ? <span className="rounded-full bg-ivory px-3 py-1 text-xs text-mute">{t('event.past')}</span> : null}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-mute">{phrase(campaign.description)}</p>
                {mine ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Banner tone="good">{t('event.seat', { slot: mine.slot })}</Banner>
                    {!past ? (
                      <Button variant="line" onClick={() => releaseCampaign(campaign.id)}>
                        {t('event.release')}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
                {!past && !mine ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {campaign.slots.map((slot) => {
                      const taken = slotTaken(campaign, slot)
                      const full = taken >= campaign.capacityPerSlot
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={full}
                          onClick={() => reserve(campaign, slot)}
                          className="rounded-full bg-ivory px-3 py-1.5 text-xs ring-1 ring-line disabled:opacity-40"
                        >
                          {slot} · {taken}/{campaign.capacityPerSlot}
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </article>
            )
          })}
      </div>
    </div>
  )
}
