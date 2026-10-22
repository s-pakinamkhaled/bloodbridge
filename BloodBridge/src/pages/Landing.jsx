import { useStore } from '../store'
import { formatWhen } from '../lib/blood'
import { Button, EmptyState, HeroArt, Logo, NeedCard, RequestLookup } from '../components/ui'
import { LangSwitch, useI18n } from '../i18n'

export default function Landing({ onSignIn, onRegister }) {
  const { requests, orgs } = useStore()
  const { t, phrase, cityName, needLine } = useI18n()
  const openNeeds = requests
    .filter(
      (item) =>
        item.verificationStatus === 'verified' &&
        !['fulfilled', 'closed', 'cancelled'].includes(item.status),
    )
    .sort((a, b) => String(a.neededBy).localeCompare(String(b.neededBy)))
  const steps = [
    ['1', t('land.s1'), t('land.s1b')],
    ['2', t('land.s2'), t('land.s2b')],
    ['3', t('land.s3'), t('land.s3b')],
  ]

  return (
    <div className="min-h-screen bg-ivory text-ink">
      <header className="sticky top-0 z-20 border-b border-line/80 bg-ivory/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
          <Logo />
          <div className="flex items-center gap-2">
            <LangSwitch />
            <Button variant="ghost" onClick={onSignIn}>{t('auth.signIn')}</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="relative grid items-center gap-8 md:grid-cols-[1.15fr_0.85fr]">
          <span className="pointer-events-none absolute -top-8 end-0 h-40 w-40 rounded-full bg-blush/80 blur-3xl" aria-hidden="true" />
          <div>
            <p className="text-base font-medium text-wine">{t('land.kicker')}</p>
            <h1 className="mt-3 font-display text-4xl leading-tight md:text-6xl">
              {t('land.title')}
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-mute">
              {t('land.lede')}
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={onRegister} className="live-card rounded-3xl bg-wine p-6 text-start text-white shadow-lg shadow-wine/25">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
                  <span className="font-display text-2xl">1</span>
                </span>
                <span className="mt-4 block font-display text-3xl">{t('land.help')}</span>
                <span className="mt-2 block text-base text-white/80">{t('land.helpBody')}</span>
              </button>
              <button type="button" onClick={onSignIn} className="live-card rounded-3xl bg-paper p-6 text-start ring-1 ring-line">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blush font-display text-2xl text-wine">2</span>
                <span className="mt-4 block font-display text-3xl">{t('land.hospital')}</span>
                <span className="mt-2 block text-base text-mute">{t('land.hospitalBody')}</span>
              </button>
            </div>
          </div>
          <HeroArt />
        </div>

        <section className="mt-14">
          <h2 className="font-display text-3xl">{t('land.steps')}</h2>
          <ol className="mt-4 grid gap-3 md:grid-cols-3">
            {steps.map(([n, title, body]) => (
              <li key={n} className="live-card rounded-3xl bg-paper p-5 ring-1 ring-black/5">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-wine font-display text-xl text-white">{n}</span>
                <h3 className="mt-4 font-display text-2xl">{title}</h3>
                <p className="mt-2 text-base leading-relaxed text-mute">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-3xl">{t('land.sample')}</h2>
          <p className="mt-2 text-base text-mute">{t('land.needsLede')}</p>
          {openNeeds.length === 0 ? (
            <div className="mt-4">
              <EmptyState>{t('land.needsEmpty')}</EmptyState>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {openNeeds.map((request) => {
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
                    action={<Button onClick={onSignIn}>{t('needs.donate')}</Button>}
                  />
                )
              })}
            </div>
          )}
        </section>

        <section className="mt-12">
          <h2 className="font-display text-3xl">{t('land.lookup')}</h2>
          <p className="mt-2 text-base text-mute">{t('land.lookupHint', { ref: openNeeds[0]?.reference || 'BB-26018' })}</p>
          <div className="mt-4">
            <RequestLookup requests={requests} orgs={orgs} />
          </div>
        </section>

        <section className="mt-12 rounded-3xl bg-gradient-to-br from-wine to-wine-deep p-6 text-white shadow-lg shadow-wine/20">
          <h2 className="font-display text-3xl">{t('land.try')}</h2>
          <p className="mt-2 max-w-xl text-base leading-relaxed text-white/80">
            {t('land.tryBody')}
          </p>
          <Button className="mt-5" variant="white" onClick={onSignIn}>{t('land.tryBtn')}</Button>
        </section>
      </main>

      <footer className="border-t border-line px-4 py-6 text-sm text-mute">
        <div className="mx-auto max-w-5xl">
          {t('land.footer')}
        </div>
      </footer>
    </div>
  )
}
