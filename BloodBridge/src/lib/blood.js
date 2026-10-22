import { dateLocale, getActiveLang } from './locale'

export const BLOOD_GROUPS = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']

/** Who can give whole blood to a recipient of this group. Coordination only — the blood bank confirms compatibility. */
export const DONORS_FOR = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
}

export const CITIES = ['Cairo', 'Giza', 'Alexandria', 'Mansoura', 'Tanta']

export const NEARBY = {
  Cairo: ['Giza'],
  Giza: ['Cairo'],
  Alexandria: [],
  Mansoura: ['Tanta'],
  Tanta: ['Mansoura'],
}

export const DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']
export const SLOTS = ['Morning', 'Afternoon', 'Evening']

export const STATUS_LABEL = {
  pending_verification: 'Waiting to be checked',
  verified: 'Checked',
  matching: 'Looking for people',
  contacted: 'Hospital has called',
  fulfilled: 'Need is met',
  closed: 'Closed',
  cancelled: 'Cancelled',
}

export const FLOW = ['pending_verification', 'verified', 'matching', 'contacted', 'fulfilled']

export const PRIORITY_LABEL = {
  routine: 'Not urgent',
  urgent: 'Urgent',
  critical: 'Emergency',
}

export const RESPONSE_LABEL = {
  available: 'Yes, you can call me',
  unavailable: 'Not now',
  more_info: 'I have a question',
}

export const REACH_LABEL = {
  city: 'Only my city',
  nearby: 'My city and nearby',
  wider: 'Any city on this site',
}

export function countLabel(count, singular, plural = `${singular}s`) {
  return `${count} ${Number(count) === 1 ? singular : plural}`
}

export function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`
}

export function weekdayOf(dateStr) {
  const [y, m, d] = dateStr.split('T')[0].split('-').map(Number)
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(y, m - 1, d).getDay()]
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('T')[0].split('-').map(Number)
  return new Intl.DateTimeFormat(dateLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(y, m - 1, d))
}

export function formatWhen(dateStr) {
  if (!dateStr) return '—'
  if (dateStr.endsWith('Z')) {
    return new Intl.DateTimeFormat(dateLocale(), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr))
  }
  const [date, time] = dateStr.split('T')
  const [y, m, d] = date.split('-').map(Number)
  if (!time) return formatDate(dateStr)
  const [hh, mm] = time.split(':')
  return new Intl.DateTimeFormat(dateLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(y, m - 1, d, Number(hh), Number(mm || 0)))
}

export function formatHours(hours) {
  if (hours == null || Number.isNaN(hours)) return '—'
  const ar = getActiveLang() === 'ar'
  if (hours < 1) {
    const minutes = Math.max(1, Math.round(hours * 60))
    return ar ? `${minutes} دقيقة` : `${minutes} min`
  }
  if (hours < 48) return ar ? `${hours.toFixed(1)} ساعة` : `${hours.toFixed(1)} h`
  const days = (hours / 24).toFixed(1)
  return ar ? `${days} يوم` : `${days} days`
}

export function isPastDate(dateStr) {
  const [y, m, d] = dateStr.split('T')[0].split('-').map(Number)
  return new Date(y, m - 1, d, 23, 59, 59) < new Date()
}

export function tierFor(donor, request) {
  if (donor.city === request.city) return 1
  if ((NEARBY[request.city] || []).includes(donor.city)) return 2
  return 3
}

export function tierLabel(tier) {
  if (tier === 1) return 'Same city'
  if (tier === 2) return 'Nearby city'
  return 'Farther away'
}

function reachAllows(donor, tier) {
  if (donor.reach === 'city') return tier === 1
  if (donor.reach === 'nearby') return tier <= 2
  return true
}

function availabilitySet(donor) {
  return Object.values(donor.availability || {}).some((slots) => slots && slots.length > 0)
}

export function freeOn(donor, dateStr) {
  if (!availabilitySet(donor)) return true
  const slots = donor.availability?.[weekdayOf(dateStr)]
  return Array.isArray(slots) && slots.length > 0
}

export function assessDonor(donor, request, invited) {
  const compatible = DONORS_FOR[request.bloodGroup] || []
  if (!compatible.includes(donor.bloodGroup)) {
    return { ok: false, tier: null, reason: 'group' }
  }
  if (!donor.consent) {
    return { ok: false, tier: null, reason: 'consent' }
  }
  if (donor.paused) {
    return { ok: false, tier: null, reason: 'paused' }
  }
  const tier = tierFor(donor, request)
  if (!reachAllows(donor, tier)) {
    return { ok: false, tier, reason: 'far' }
  }
  if (!freeOn(donor, request.neededBy)) {
    return { ok: false, tier, reason: 'day' }
  }
  if (invited) return { ok: true, tier, invited: true, reason: 'asked' }
  return { ok: true, tier, invited: false, reason: 'eligible' }
}

export function hoursBetween(a, b) {
  return (new Date(b).getTime() - new Date(a).getTime()) / 36e5
}

export function summarize(requests, invitations) {
  const verified = requests.filter((r) => r.verificationStatus === 'verified')
  const fulfilled = verified.filter((r) => r.status === 'fulfilled')
  const open = requests.filter(
    (r) => !['fulfilled', 'closed', 'cancelled'].includes(r.status) && r.verificationStatus !== 'rejected',
  )
  const responded = invitations.filter((i) => i.response)
  const samples = []
  for (const req of requests) {
    const inv = invitations.filter((i) => i.requestId === req.id)
    const sent = inv.map((i) => i.notifiedAt).sort()
    const replies = inv.filter((i) => i.respondedAt).map((i) => i.respondedAt).sort()
    if (sent.length && replies.length) samples.push(hoursBetween(sent[0], replies[0]))
  }
  const byGroup = Object.fromEntries(BLOOD_GROUPS.map((g) => [g, requests.filter((r) => r.bloodGroup === g).length]))
  return {
    total: requests.length,
    open: open.length,
    verified: verified.length,
    fulfilled: fulfilled.length,
    fulfillmentRate: verified.length ? Math.round((fulfilled.length / verified.length) * 100) : 0,
    invitations: invitations.length,
    responses: responded.length,
    responseRate: invitations.length ? Math.round((responded.length / invitations.length) * 100) : 0,
    avgFirstResponse: samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : null,
    byGroup,
    waiting: invitations.filter((i) => !i.response).length,
  }
}

export function volumeByMonth(requests) {
  const map = new Map()
  for (const request of requests) {
    const d = new Date(request.createdAt)
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    map.set(key, (map.get(key) || 0) + 1)
  }
  return [...map.entries()].sort().map(([key, value]) => {
    const [y, m] = key.split('-')
    const label = new Intl.DateTimeFormat(dateLocale(), { month: 'short' }).format(new Date(Date.UTC(Number(y), Number(m) - 1, 1)))
    return { key, label, value }
  })
}

export function campaignFill(campaigns) {
  const upcoming = campaigns.filter((c) => !isPastDate(c.date))
  let seats = 0
  let taken = 0
  for (const campaign of upcoming) {
    seats += campaign.slots.length * campaign.capacityPerSlot
    taken += campaign.registrations.length
  }
  return {
    upcoming: upcoming.length,
    seats,
    taken,
    rate: seats ? Math.round((taken / seats) * 100) : 0,
  }
}

export function slotTaken(campaign, slot) {
  return campaign.registrations.filter((r) => r.slot === slot).length
}

export function buildPassport(donor, users, invitations, campaigns) {
  const mine = invitations.filter((i) => i.donorId === donor.id)
  const responses = mine.filter((i) => i.response)
  const available = responses.filter((i) => i.response === 'available')
  const registrations = []
  const attended = []
  for (const campaign of campaigns) {
    const reg = campaign.registrations.find((r) => r.donorId === donor.id)
    if (reg) registrations.push({ campaign, reg })
    if (campaign.attendance?.includes(donor.id)) attended.push(campaign)
  }
  const badges = []
  if (responses.length) {
    badges.push({ id: 'reply', name: 'First reply', detail: 'Responded to a verified invitation.' })
  }
  if (available.length) {
    badges.push({ id: 'ready', name: 'Open to contact', detail: 'Told a hospital they can be contacted.' })
  }
  if (registrations.length) {
    badges.push({ id: 'campaign', name: 'Campaign supporter', detail: 'Reserved a seat at a community drive.' })
  }
  if (attended.length) {
    badges.push({ id: 'verified', name: 'Verified participant', detail: 'An organization confirmed campaign participation.' })
  }
  if (attended.length >= 2) {
    badges.push({ id: 'milestone', name: 'Community milestone', detail: 'Took part in more than one campaign.' })
  }
  return {
    name: users.find((u) => u.id === donor.userId)?.name || 'Donor',
    invitations: mine,
    responses,
    available,
    registrations,
    attended,
    badges,
  }
}

export function weekDates(anchor = new Date()) {
  const date = new Date(anchor)
  const day = date.getDay()
  const saturdayOffset = (day + 1) % 7
  const start = new Date(date)
  start.setDate(date.getDate() - saturdayOffset)
  start.setHours(0, 0, 0, 0)
  return DAYS.map((label, index) => {
    const current = new Date(start)
    current.setDate(start.getDate() + index)
    return { label, date: current.getDate(), month: current.toLocaleString(dateLocale(), { month: 'short' }) }
  })
}

export function defaultNeededBy() {
  const d = new Date()
  d.setDate(d.getDate() + 2)
  d.setHours(18, 0, 0, 0)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
