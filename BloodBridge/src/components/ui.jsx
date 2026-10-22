import { useEffect, useState } from 'react'
import { FLOW, formatWhen } from '../lib/blood'
import { LangSwitch, useI18n } from '../i18n'

function cx(...parts) {
  return parts.filter(Boolean).join(' ')
}

export function Drop({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2.2c.6 2.6 7 9.2 7 13.2a7 7 0 0 1-14 0C5 11.4 11.4 4.8 12 2.2z"
      />
    </svg>
  )
}

function Glyph({ children, className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      {children}
    </svg>
  )
}

export function PinIcon({ className }) {
  return (
    <Glyph className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z" />
      <circle cx="12" cy="11" r="2" />
    </Glyph>
  )
}

export function CalendarIcon({ className }) {
  return (
    <Glyph className={className}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path strokeLinecap="round" d="M8 3.5v3M16 3.5v3M4 10h16" />
    </Glyph>
  )
}

export function BagIcon({ className }) {
  return (
    <Glyph className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 8V7a4 4 0 0 1 8 0v1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 8h11l-.8 11.2a2 2 0 0 1-2 1.8H9.3a2 2 0 0 1-2-1.8L6.5 8z" />
    </Glyph>
  )
}

function NavMark({ id }) {
  const common = 'nav-mark h-4 w-4 shrink-0'
  if (id === 'needs') return <Drop className={common} />
  if (id === 'availability') {
    return (
      <Glyph className={common}>
        <circle cx="12" cy="12" r="8" />
        <path strokeLinecap="round" d="M12 8v4.5l3 2" />
      </Glyph>
    )
  }
  if (id === 'campaigns') return <CalendarIcon className={common} />
  if (id === 'requests') {
    return (
      <Glyph className={common}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.2 4.2L19 7" />
      </Glyph>
    )
  }
  if (id === 'new') {
    return (
      <Glyph className={common}>
        <path strokeLinecap="round" d="M12 5v14M5 12h14" />
      </Glyph>
    )
  }
  if (id === 'review') {
    return (
      <Glyph className={common}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5l7 3v5.2c0 4.2-2.8 7.2-7 8.8-4.2-1.6-7-4.6-7-8.8V6.5l7-3z" />
      </Glyph>
    )
  }
  if (id === 'organizations') {
    return (
      <Glyph className={common}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V8l8-4 8 4v12" />
        <path strokeLinecap="round" d="M9 20v-6h6v6" />
      </Glyph>
    )
  }
  return (
    <Glyph className={common}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 11.2 12 4l8 7.2V20H4z" />
    </Glyph>
  )
}

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2)
  if (!parts.length) return '?'
  return parts.map((part) => part[0]).join('')
}

export function HeroArt() {
  return (
    <div className="relative mx-auto h-72 w-full max-w-sm" aria-hidden="true">
      <span className="absolute start-6 top-8 h-28 w-28 rounded-full bg-blush blur-2xl" />
      <span className="absolute end-4 bottom-16 h-24 w-24 rounded-full bg-sand blur-2xl" />
      <span className="floaty absolute end-10 top-2 text-wine">
        <Drop className="h-28 w-28 drop-shadow-lg" />
      </span>
      <span className="floaty absolute start-4 top-16 text-wine/70" style={{ animationDelay: '0.8s' }}>
        <Drop className="h-12 w-12" />
      </span>
      <span className="floaty absolute end-6 top-28 text-forest" style={{ animationDelay: '1.4s' }}>
        <Drop className="h-8 w-8" />
      </span>
      <div className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-3xl bg-paper/95 p-3 shadow-lg shadow-wine/10 ring-1 ring-black/5">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blush text-wine">
          <Glyph className="h-6 w-6">
            <circle cx="12" cy="8" r="3" />
            <path strokeLinecap="round" d="M6 19c.8-3 2.8-4.5 6-4.5s5.2 1.5 6 4.5" />
          </Glyph>
        </span>
        <span className="relative h-px flex-1 bg-gradient-to-r from-wine/15 via-wine to-wine/15">
          <Drop className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-wine" />
        </span>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-wine text-white">
          <Glyph className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 20V9l7-4 7 4v11" />
            <path strokeLinecap="round" d="M10 20v-5h4v5" />
          </Glyph>
        </span>
      </div>
    </div>
  )
}

export function Logo({ light = false, onClick }) {
  const { t } = useI18n()
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className="flex items-center gap-2.5 text-start"
    >
        <span
        className={cx(
          'grid h-10 w-10 place-items-center rounded-2xl shadow-md shadow-wine/30',
          light ? 'bg-white/15 text-white' : 'bg-wine text-white',
        )}
      >
        <Drop className="floaty h-5 w-5" />
      </span>
      <span>
        <span className={cx('block font-display text-lg leading-none', light ? 'text-white' : 'text-ink')}>
          BloodBridge
        </span>
        <span className={cx('mt-1 block text-xs', light ? 'text-white/70' : 'text-mute')}>
          {t('brand.tag')}
        </span>
      </span>
    </Tag>
  )
}

const buttonStyles = {
  primary: 'bg-wine text-white hover:bg-wine-deep',
  deep: 'bg-wine-deep text-white hover:bg-ink',
  line: 'bg-paper text-ink ring-1 ring-line hover:bg-white',
  soft: 'bg-blush text-wine-deep hover:bg-[#f3d5dc]',
  forest: 'bg-forest text-white hover:bg-[#16573c]',
  ghost: 'text-ink hover:bg-black/5',
  white: 'bg-white text-wine-deep hover:bg-blush',
}

export function Button({ variant = 'primary', className, type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-base font-medium shadow-sm transition duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45',
        buttonStyles[variant],
        className,
      )}
      {...props}
    />
  )
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-base font-medium">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs leading-relaxed text-mute">{hint}</span> : null}
    </label>
  )
}

const control =
  'w-full rounded-2xl border border-line bg-white px-4 py-3 text-base text-ink shadow-sm outline-none transition placeholder:text-mute/70 focus:border-wine focus:ring-4 focus:ring-wine/15'

export function TextInput({ className, ...props }) {
  return <input className={cx(control, className)} {...props} />
}

export function SelectInput({ className, children, ...props }) {
  return (
    <select className={cx(control, className)} {...props}>
      {children}
    </select>
  )
}

export function TextArea({ className, ...props }) {
  return <textarea className={cx(control, 'min-h-28 resize-y', className)} {...props} />
}

export function Banner({ tone = 'info', children }) {
  const tones = {
    info: 'bg-sand text-ink',
    good: 'bg-moss text-forest',
    warn: 'bg-blush text-wine-deep',
  }
  return (
    <div role="status" className={cx('rise rounded-2xl px-4 py-3 text-base leading-relaxed shadow-sm', tones[tone])}>
      {children}
    </div>
  )
}

export function BloodPill({ group }) {
  return (
    <span dir="ltr" className="inline-flex items-center rounded-full bg-wine px-2.5 py-1 font-display text-sm text-white">
      {group}
    </span>
  )
}

export function StatusPill({ status }) {
  const { t } = useI18n()
  const styles = {
    pending_verification: 'bg-sand text-honey',
    verified: 'bg-moss text-forest',
    matching: 'bg-sand text-honey',
    contacted: 'bg-blush text-wine-deep',
    fulfilled: 'bg-moss text-forest',
    closed: 'bg-ivory text-mute ring-1 ring-line',
    cancelled: 'bg-blush text-wine-deep',
  }
  return (
    <span className={cx('inline-flex rounded-full px-2.5 py-1 text-xs font-medium', styles[status] || styles.closed)}>
      {t(`status.${status}`) || status}
    </span>
  )
}

export function PriorityPill({ priority }) {
  const { t } = useI18n()
  const styles = {
    routine: 'bg-ivory text-mute ring-1 ring-line',
    urgent: 'bg-blush text-wine-deep',
    critical: 'bg-wine text-white',
  }
  return (
    <span className={cx('inline-flex rounded-full px-2.5 py-1 text-xs font-medium', styles[priority])}>
      {t(`priority.${priority}`)}
      {priority === 'critical' ? t('priority.now') : ''}
    </span>
  )
}

export function VerifyPill({ status }) {
  const { t } = useI18n()
  if (status === 'verified') {
    return <span className="inline-flex rounded-full bg-moss px-2.5 py-1 text-xs font-medium text-forest">{t('verify.yes')}</span>
  }
  if (status === 'rejected') {
    return <span className="inline-flex rounded-full bg-blush px-2.5 py-1 text-xs font-medium text-wine-deep">{t('verify.no')}</span>
  }
  return <span className="inline-flex rounded-full bg-sand px-2.5 py-1 text-xs font-medium text-honey">{t('verify.wait')}</span>
}

export function Stepper({ status }) {
  const { t } = useI18n()
  const terminal = status === 'closed' || status === 'cancelled'
  const current = FLOW.indexOf(status)
  return (
    <ol className="grid gap-2 sm:grid-cols-5">
      {FLOW.map((step, index) => {
        const done = !terminal && current > index
        const active = !terminal && current === index
        return (
          <li
            key={step}
            className={cx(
              'rounded-2xl px-3 py-2.5 text-xs',
              active && 'bg-wine text-white',
              done && 'bg-moss text-forest',
              !active && !done && 'bg-ivory text-mute',
            )}
          >
            <span className="mb-0.5 block font-medium">{index + 1}</span>
            {t(`status.${step}`)}
          </li>
        )
      })}
    </ol>
  )
}

export function PageHead({ kicker, title, lede, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {kicker ? <p className="text-xs font-semibold uppercase tracking-[0.16em] text-wine">{kicker}</p> : null}
        <h1 className="mt-1 flex items-center gap-2 font-display text-3xl leading-tight text-ink md:text-4xl">
          <Drop className="h-7 w-7 shrink-0 text-wine" />
          {title}
        </h1>
        {lede ? <p className="mt-2 text-base leading-relaxed text-mute">{lede}</p> : null}
      </div>
      {children}
    </div>
  )
}

export function Panel({ className, children }) {
  return <section className={cx('rounded-3xl bg-paper p-5 shadow-sm ring-1 ring-black/5', className)}>{children}</section>
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="rise rounded-3xl bg-paper px-6 py-10 text-center shadow-sm ring-1 ring-black/5">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blush text-wine">
        <Drop className="h-7 w-7" />
      </span>
      {title ? <p className="mt-4 font-display text-2xl">{title}</p> : null}
      {children ? <p className="mx-auto mt-2 max-w-md text-base leading-relaxed text-mute">{children}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export function NeedCard({ group, title, city, when, units, priority, action }) {
  const { nText } = useI18n()
  const hot = priority === 'urgent' || priority === 'critical'
  return (
    <article className="live-card rise overflow-hidden rounded-3xl bg-paper shadow-sm ring-1 ring-black/5">
      <div className={cx('h-1.5', hot ? 'bg-wine' : 'bg-gradient-to-l from-wine/80 via-blush to-sand')} />
      <div className="flex items-start gap-4 p-5">
        <span dir="ltr" className="grid h-16 min-w-16 shrink-0 place-items-center rounded-2xl bg-wine px-2 font-display text-xl text-white shadow-md shadow-wine/25">
          {group}
        </span>
        <div className="min-w-0 flex-1">
          {hot ? (
            <div className="mb-2">
              <PriorityPill priority={priority} />
            </div>
          ) : null}
          <h2 className="break-words font-display text-2xl leading-snug md:text-3xl">{title}</h2>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {city ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-mute">
                <PinIcon />
                {city}
              </span>
            ) : null}
            {when ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-mute">
                <CalendarIcon />
                {when}
              </span>
            ) : null}
            {units ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-mute">
                <BagIcon />
                {nText(units, 'bag')}
              </span>
            ) : null}
          </div>
          {action ? <div className="mt-4">{action}</div> : null}
        </div>
      </div>
    </article>
  )
}

export function Stat({ label, value, detail }) {
  return (
    <div className="rounded-3xl bg-paper p-5 ring-1 ring-black/5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mute">{label}</p>
      <p className="mt-2 font-display text-4xl text-ink">{value}</p>
      {detail ? <p className="mt-2 text-sm leading-relaxed text-mute">{detail}</p> : null}
    </div>
  )
}

export function PublicRequest({ request, org }) {
  const { t, phrase, cityName, needLine } = useI18n()
  const hospital = phrase(request.facility) || phrase(org?.name) || t('public.org')
  return (
    <article className="overflow-hidden rounded-3xl bg-paper shadow-sm ring-1 ring-black/5">
      <div className={cx('h-1.5', request.priority === 'urgent' || request.priority === 'critical' ? 'bg-wine' : 'bg-gradient-to-l from-wine/70 via-blush to-sand')} />
      <div className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-sm tracking-wide text-wine">{request.reference}</p>
        <div className="flex flex-wrap items-center gap-2">
          <BloodPill group={request.bloodGroup} />
          <VerifyPill status={request.verificationStatus} />
        </div>
      </div>
      <h3 className="mt-3 font-display text-2xl leading-snug">{needLine(hospital, request.units, request.bloodGroup)}</h3>
      <p className="mt-1 text-base text-mute">
        {cityName(request.city)}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {request.priority === 'urgent' || request.priority === 'critical' ? <PriorityPill priority={request.priority} /> : null}
        <StatusPill status={request.status} />
      </div>
      <p className="mt-4 text-base text-mute">{t('public.needed', { when: formatWhen(request.neededBy) })}</p>
      <div className="mt-4">
        <Stepper status={request.status} />
      </div>
      <p className="mt-4 text-base leading-relaxed text-mute">
          {t('public.note')}
      </p>
      </div>
    </article>
  )
}

export function RequestLookup({ requests, orgs }) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)

  function search(event) {
    event.preventDefault()
    const reference = query.trim().toUpperCase()
    if (!reference) return
    const found = requests.find((item) => item.reference.toUpperCase() === reference)
    setResult(found || { missing: true, reference })
  }

  const org = result && !result.missing ? orgs.find((item) => item.id === result.orgId) : null

  return (
    <form onSubmit={search} className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <TextInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('lookup.ph')}
          aria-label={t('lookup.label')}
        />
        <Button type="submit">{t('lookup.go')}</Button>
      </div>
      {result?.missing ? (
        <Banner tone="warn">{t('lookup.missing', { ref: result.reference })}</Banner>
      ) : null}
      {result && !result.missing && result.verificationStatus !== 'verified' ? (
        <Banner>
          {result.verificationStatus === 'rejected'
            ? t('lookup.rejected', { ref: result.reference })
            : t('lookup.pending', { ref: result.reference })}
        </Banner>
      ) : null}
      {result && !result.missing && result.verificationStatus === 'verified' && ['fulfilled', 'closed', 'cancelled'].includes(result.status) ? (
        <Banner tone="good">{t('lookup.gone', { ref: result.reference })}</Banner>
      ) : null}
      {result && !result.missing && result.verificationStatus === 'verified' && !['fulfilled', 'closed', 'cancelled'].includes(result.status) ? (
        <PublicRequest request={result} org={org} />
      ) : null}
    </form>
  )
}

export function Bars({ data }) {
  const max = Math.max(1, ...data.map((item) => item.value))
  return (
    <div className="flex h-48 items-end gap-2">
      {data.map((item) => (
        <div key={item.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
          <span className="text-xs text-mute">{item.value}</span>
          <div
            className="w-full rounded-t-xl bg-wine"
            style={{ height: `${Math.max(item.value ? 8 : 0, (item.value / max) * 100)}%` }}
          />
          <span className="text-center text-[11px] text-mute">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function SideNav({ nav, active, onPick }) {
  return (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => {
        const on = active === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onPick(item.id)}
            aria-current={on ? 'page' : undefined}
            className={cx(
              'relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-start text-base transition duration-200',
              on ? 'bg-wine font-medium text-white shadow-md shadow-wine/20' : 'text-ink hover:bg-blush',
            )}
          >
            <span
              className={cx(
                'absolute inset-y-2 w-1 rounded-full bg-white transition-all duration-200',
                on ? 'start-1 opacity-100' : 'start-3 opacity-0',
              )}
            />
            <NavMark id={item.id} />
            <span className="min-w-0 flex-1">{item.label}</span>
            {item.count ? (
              <span className={cx('rounded-full px-2 py-0.5 text-xs', on ? 'bg-white text-wine' : 'bg-wine text-white')}>
                {item.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </nav>
  )
}

function ProfileCard({ user, detail, onLogout, onReset }) {
  const { t } = useI18n()
  const [armReset, setArmReset] = useState(false)
  return (
    <div className="rounded-3xl bg-ivory p-4 ring-1 ring-line/80">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-wine font-display text-sm text-white">
          {initials(user?.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium">{user?.name}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-mute">{detail}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="line" className="px-3 py-2 text-sm" onClick={onLogout}>
          {t('shell.out')}
        </Button>
        {armReset ? (
          <Button
            variant="soft"
            className="px-3 py-2 text-sm"
            onClick={() => {
              setArmReset(false)
              onReset()
            }}
          >
            {t('shell.resetYes')}
          </Button>
        ) : (
          <Button variant="ghost" className="px-3 py-2 text-sm" onClick={() => setArmReset(true)}>
            {t('shell.reset')}
          </Button>
        )}
      </div>
    </div>
  )
}

export function AppShell({ nav, active, onChange, user, detail, onLogout, onReset, children }) {
  const { t } = useI18n()
  const [menu, setMenu] = useState(false)

  useEffect(() => {
    if (!menu) return undefined
    function onKey(event) {
      if (event.key === 'Escape') setMenu(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menu])

  function pick(id) {
    onChange(id)
    setMenu(false)
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-ivory text-ink">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-e border-line bg-gradient-to-b from-blush via-paper to-paper px-4 py-6 md:flex">
          <Logo />
          <div className="mt-4">
            <LangSwitch />
          </div>
          <div className="mt-8">
            <SideNav nav={nav} active={active} onPick={pick} />
          </div>
          <div className="mt-auto pt-6">
            <ProfileCard user={user} detail={detail} onLogout={onLogout} onReset={onReset} />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-line bg-paper/90 px-4 py-3 backdrop-blur md:hidden">
            <div className="flex items-center justify-between gap-3">
              <Logo />
              <button
                type="button"
                className="grid h-11 w-11 place-items-center rounded-2xl bg-ivory text-ink ring-1 ring-line"
                aria-expanded={menu}
                aria-controls="app-drawer"
                onClick={() => setMenu(true)}
              >
                <span className="sr-only">{t('shell.menu')}</span>
                <Glyph className="h-5 w-5">
                  <path strokeLinecap="round" d="M5 7h14M5 12h14M5 17h14" />
                </Glyph>
              </button>
            </div>
          </header>
          {menu ? (
            <div className="fixed inset-0 z-40 md:hidden">
              <button type="button" className="absolute inset-0 bg-ink/40" aria-label={t('shell.close')} onClick={() => setMenu(false)} />
              <div
                id="app-drawer"
                role="dialog"
                aria-modal="true"
                aria-label={t('shell.menu')}
                className="absolute inset-y-0 start-0 flex w-[min(20rem,88vw)] flex-col bg-gradient-to-b from-blush via-paper to-paper p-4 shadow-2xl"
              >
                <div className="flex items-center justify-between gap-3">
                  <Logo />
                  <button
                    type="button"
                    className="grid h-11 w-11 place-items-center rounded-2xl bg-ivory ring-1 ring-line"
                    onClick={() => setMenu(false)}
                  >
                    <span className="sr-only">{t('shell.close')}</span>
                    <Glyph className="h-5 w-5">
                      <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
                    </Glyph>
                  </button>
                </div>
                <div className="mt-4">
                  <LangSwitch />
                </div>
                <div className="mt-6">
                  <SideNav nav={nav} active={active} onPick={pick} />
                </div>
                <div className="mt-auto pt-6">
                  <ProfileCard user={user} detail={detail} onLogout={onLogout} onReset={onReset} />
                </div>
              </div>
            </div>
          ) : null}
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
            <div key={active} className="rise">
              {children}
            </div>
          </main>
          <footer className="px-4 pb-6 text-sm leading-relaxed text-mute md:px-8">
            {t('shell.footer')}
          </footer>
        </div>
      </div>
    </div>
  )
}

export function Alerts({ notes, onOpen, onReadAll }) {
  const { t, noteTitle, noteBody } = useI18n()
  const ordered = [...notes].sort((a, b) => new Date(b.at) - new Date(a.at))
  return (
    <div>
      <PageHead
        title={t('alerts.title')}
        lede={t('alerts.lede')}
      >
        <Button variant="line" onClick={onReadAll}>
        {t('alerts.read')}
        </Button>
      </PageHead>
      <div className="space-y-3">
        {ordered.length === 0 ? <Banner>{t('alerts.empty')}</Banner> : null}
        {ordered.map((note) => (
          <button
            key={note.id}
            type="button"
            onClick={() => onOpen(note)}
            className={cx(
              'block w-full rounded-3xl p-4 text-start ring-1 ring-black/5',
              note.read ? 'bg-paper' : 'bg-blush',
            )}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="font-medium">{noteTitle(note)}</span>
              <span className="text-xs text-mute">{formatWhen(note.at)}</span>
            </span>
            <span className="mt-1 block text-sm text-mute">{noteBody(note)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
