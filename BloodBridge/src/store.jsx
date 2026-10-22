import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { seedState } from './data/seed'
import { assessDonor, BLOOD_GROUPS, uid } from './lib/blood'

const KEY = 'bloodbridge.demo.v1'
const StoreContext = createContext(null)

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return seedState()
    const parsed = JSON.parse(raw)
    if (parsed?.version !== 1 || !Array.isArray(parsed.users) || !Array.isArray(parsed.requests)) return seedState()
    return parsed
  } catch {
    return seedState()
  }
}

function staffOf(state, orgId) {
  return state.users.filter((user) => user.role === 'staff' && user.orgId === orgId)
}

function admins(state) {
  return state.users.filter((user) => user.role === 'admin')
}

function pushNotes(state, notes) {
  return { ...state, notifications: [...notes, ...state.notifications] }
}

function sendWave(state, requestId, actor, at) {
  const request = state.requests.find((item) => item.id === requestId)
  if (!request || request.verificationStatus !== 'verified') return state
  if (['fulfilled', 'closed', 'cancelled'].includes(request.status)) return state
  if ((request.wave || 0) >= 3) {
    return {
      ...state,
      requests: state.requests.map((item) =>
        item.id === requestId ? { ...item, waveNote: { key: 'wave.none' } } : item,
      ),
    }
  }

  const invited = new Set(state.invitations.filter((item) => item.requestId === requestId).map((item) => item.donorId))
  const pool = state.donors
    .map((donor) => ({ donor, ...assessDonor(donor, request, invited.has(donor.id)) }))
    .filter((row) => row.ok && !row.invited)

  const critical = request.priority === 'critical'
  const target = critical ? 3 : (request.wave || 0) + 1
  const chosen = critical ? pool : pool.filter((row) => row.tier === target)
  const org = state.orgs.find((item) => item.id === request.orgId)

  let waveNote = ''
  if (critical && chosen.length) {
    waveNote = { key: 'wave.emergency', count: chosen.length }
  } else if (critical) {
    waveNote = { key: 'wave.nobody' }
  } else if (!chosen.length) {
    waveNote = target < 3 ? { key: 'wave.emptyNext' } : { key: 'wave.emptyDone' }
  } else {
    const where = target === 1 ? 'city' : target === 2 ? 'nearby' : 'far'
    waveNote = { key: 'wave.asked', count: chosen.length, where }
  }

  const invitations = chosen.map((row) => ({
    id: `inv-${requestId}-${row.donor.id}`,
    requestId,
    donorId: row.donor.id,
    wave: row.tier,
    response: null,
    notifiedAt: at,
    respondedAt: null,
  }))

  const notes = chosen
    .map((row) => {
      const userId = row.donor.userId
      if (!userId) return null
      return {
        id: `nt-${at}-${userId}-${requestId}`,
        userId,
        titleKey: critical ? 'note.emergency.title' : 'note.need.title',
        bodyKey: 'note.need.body',
        vars: { ref: request.reference, group: request.bloodGroup, place: org?.name || 'Healthcare organization', city: request.city },
        title: critical ? 'Emergency: a hospital needs blood' : 'A hospital needs blood',
        body: `${request.reference} · ${request.bloodGroup} at ${org?.name || 'a verified organization'}, ${request.city}.`,
        at,
        read: false,
        view: 'invitations',
      }
    })
    .filter(Boolean)

  const nextStatus =
    chosen.length && (request.status === 'verified' || request.status === 'pending_verification')
      ? 'matching'
      : request.status

  return pushNotes(
    {
      ...state,
      invitations: [...state.invitations, ...invitations],
      requests: state.requests.map((item) => {
        if (item.id !== requestId) return item
        return {
          ...item,
          wave: target,
          waveNote,
          status: nextStatus,
          history:
            nextStatus !== item.status
              ? [...item.history, { status: nextStatus, at, by: actor || (critical ? 'Emergency ask' : 'Asked people who can help') }]
              : item.history,
        }
      }),
    },
    notes,
  )
}

function reducer(state, action) {
  switch (action.type) {
    case 'session':
      return { ...state, sessionUserId: action.userId }
    case 'reset':
      return seedState()
    case 'register':
      return {
        ...state,
        users: [...state.users, action.user],
        donors: [...state.donors, action.donor],
        sessionUserId: action.user.id,
      }
    case 'patchDonor':
      return {
        ...state,
        donors: state.donors.map((donor) => (donor.id === action.donorId ? { ...donor, ...action.patch } : donor)),
      }
    case 'insertRequest': {
      const notes = admins(state).map((admin) => ({
        id: `nt-${action.request.createdAt}-${admin.id}-new`,
        userId: admin.id,
        titleKey: action.request.priority === 'critical' ? 'note.emergency.title' : 'note.check.title',
        bodyKey: action.request.priority === 'critical' ? 'note.checkCrit.body' : 'note.check.body',
        vars: { org: action.orgName, ref: action.request.reference, group: action.request.bloodGroup, city: action.request.city },
        title: action.request.priority === 'critical' ? 'Critical request awaiting verification' : 'Request awaiting verification',
        body: `${action.orgName} submitted ${action.request.reference} (${action.request.bloodGroup}, ${action.request.city}).`,
        at: action.request.createdAt,
        read: false,
        view: 'review',
      }))
      return pushNotes({ ...state, requests: [action.request, ...state.requests] }, notes)
    }
    case 'verifyRequest': {
      const request = state.requests.find((item) => item.id === action.requestId)
      if (!request || request.verificationStatus === 'verified') return state
      const at = action.at
      let next = {
        ...state,
        requests: state.requests.map((item) =>
          item.id === action.requestId
            ? {
                ...item,
                verificationStatus: 'verified',
                status: 'verified',
                history: [...item.history, { status: 'verified', at, by: action.by }],
              }
            : item,
        ),
      }
      const notes = staffOf(state, request.orgId).map((staff) => ({
        id: `nt-${at}-${staff.id}-verified`,
        userId: staff.id,
        titleKey: 'note.verified.title',
        bodyKey: request.priority === 'critical' ? 'note.verifiedCrit.body' : 'note.verified.body',
        vars: { ref: request.reference },
        title: 'Request verified',
        body:
          request.priority === 'critical'
            ? `${request.reference} is verified. Critical outreach has started.`
            : `${request.reference} is verified. You can send the first donor wave.`,
        at,
        read: false,
        view: `request:${request.id}`,
      }))
      next = pushNotes(next, notes)
      if (request.priority === 'critical') next = sendWave(next, request.id, action.by, at)
      return next
    }
    case 'rejectRequest': {
      const request = state.requests.find((item) => item.id === action.requestId)
      if (!request) return state
      const at = action.at
      const next = {
        ...state,
        requests: state.requests.map((item) =>
          item.id === action.requestId
            ? {
                ...item,
                verificationStatus: 'rejected',
                status: 'cancelled',
                rejectReason: action.reason,
                history: [...item.history, { status: 'cancelled', at, by: action.by }],
              }
            : item,
        ),
      }
      const notes = staffOf(state, request.orgId).map((staff) => ({
        id: `nt-${at}-${staff.id}-rejected`,
        userId: staff.id,
        titleKey: 'note.rejected.title',
        bodyKey: 'note.rejected.body',
        vars: { ref: request.reference, reason: action.reason },
        title: 'Request was not verified',
        body: `${request.reference} was declined: ${action.reason}.`,
        at,
        read: false,
        view: `request:${request.id}`,
      }))
      return pushNotes(next, notes)
    }
    case 'verifyOrg':
      return {
        ...state,
        orgs: state.orgs.map((org) => (org.id === action.orgId ? { ...org, verified: true } : org)),
      }
    case 'sendWave':
      return sendWave(state, action.requestId, action.by, action.at)
    case 'setStatus': {
      const request = state.requests.find((item) => item.id === action.requestId)
      if (!request) return state
      return {
        ...state,
        requests: state.requests.map((item) =>
          item.id === action.requestId
            ? {
                ...item,
                status: action.status,
                history: [...item.history, { status: action.status, at: action.at, by: action.by }],
              }
            : item,
        ),
      }
    }
    case 'respond': {
      const invitation = state.invitations.find((item) => item.id === action.invitationId)
      if (!invitation) return state
      const donor = state.donors.find((item) => item.id === invitation.donorId)
      if (!donor || donor.userId !== action.userId) return state
      const request = state.requests.find((item) => item.id === invitation.requestId)
      const donorUser = state.users.find((item) => item.id === donor.userId)
      const finishes =
        action.response === 'available' &&
        request &&
        !['fulfilled', 'closed', 'cancelled'].includes(request.status)
      const notes = request
        ? staffOf(state, request.orgId).map((staff) => ({
            id: `nt-${action.at}-${staff.id}-${invitation.id}`,
            userId: staff.id,
            titleKey: finishes ? 'note.done.title' : 'note.response.title',
            bodyKey: finishes ? 'note.done.body' : `note.response.${action.response}`,
            vars: { name: donorUser?.name || 'A donor', ref: request.reference },
            title: finishes ? 'Request is done' : 'Donor response',
            body: finishes
              ? `${donorUser?.name || 'A donor'} said yes. ${request.reference} is done.`
              : `${donorUser?.name || 'A donor'} answered ${request.reference}.`,
            at: action.at,
            read: false,
            view: `request:${request.id}`,
          }))
        : []
      return pushNotes(
        {
          ...state,
          invitations: state.invitations.map((item) =>
            item.id === invitation.id ? { ...item, response: action.response, respondedAt: action.at } : item,
          ),
          requests: finishes
            ? state.requests.map((item) =>
                item.id === request.id
                  ? {
                      ...item,
                      status: 'fulfilled',
                      history: [...item.history, { status: 'fulfilled', at: action.at, by: donorUser?.name || 'Donor' }],
                    }
                  : item,
              )
            : state.requests,
        },
        notes,
      )
    }
    case 'offer': {
      const donor = state.donors.find((item) => item.userId === action.userId)
      if (!donor) return state
      const request = state.requests.find((item) => item.id === action.requestId)
      if (!request || request.verificationStatus !== 'verified') return state
      if (['fulfilled', 'closed', 'cancelled'].includes(request.status)) return state
      const groupOk = assessDonor({ ...donor, consent: true, paused: false }, request, false).reason !== 'group'
      if (!groupOk) return state
      const donorUser = state.users.find((item) => item.id === donor.userId)
      const invitation = state.invitations.find((item) => item.requestId === request.id && item.donorId === donor.id)
      const notes = staffOf(state, request.orgId).map((staff) => ({
        id: `nt-${action.at}-${staff.id}-offer-${request.id}`,
        userId: staff.id,
        titleKey: 'note.done.title',
        bodyKey: 'note.done.body',
        vars: { name: donorUser?.name || 'A donor', ref: request.reference },
        title: 'Request is done',
        body: `${donorUser?.name || 'A donor'} said yes. ${request.reference} is done.`,
        at: action.at,
        read: false,
        view: `request:${request.id}`,
      }))
      return pushNotes(
        {
          ...state,
          invitations: invitation
            ? state.invitations.map((item) =>
                item.id === invitation.id ? { ...item, response: 'available', respondedAt: action.at } : item,
              )
            : state.invitations,
          requests: state.requests.map((item) =>
            item.id === request.id
              ? {
                  ...item,
                  status: 'fulfilled',
                  history: [...item.history, { status: 'fulfilled', at: action.at, by: donorUser?.name || 'Donor' }],
                }
              : item,
          ),
        },
        notes,
      )
    }
    case 'insertCampaign':
      return { ...state, campaigns: [action.campaign, ...state.campaigns] }
    case 'registerCampaign':
      return {
        ...state,
        campaigns: state.campaigns.map((campaign) =>
          campaign.id === action.campaignId
            ? { ...campaign, registrations: [...campaign.registrations, action.registration] }
            : campaign,
        ),
      }
    case 'releaseCampaign':
      return {
        ...state,
        campaigns: state.campaigns.map((campaign) =>
          campaign.id === action.campaignId
            ? {
                ...campaign,
                registrations: campaign.registrations.filter((reg) => reg.donorId !== action.donorId),
              }
            : campaign,
        ),
      }
    case 'attend':
      return {
        ...state,
        campaigns: state.campaigns.map((campaign) => {
          if (campaign.id !== action.campaignId) return campaign
          if (campaign.attendance.includes(action.donorId)) return campaign
          return { ...campaign, attendance: [...campaign.attendance, action.donorId] }
        }),
      }
    case 'readAll': {
      if (!state.notifications.some((note) => note.userId === action.userId && !note.read)) return state
      return {
        ...state,
        notifications: state.notifications.map((note) =>
          note.userId === action.userId ? { ...note, read: true } : note,
        ),
      }
    }
    default:
      return state
  }
}

const DONOR_FIELDS = ['bloodGroup', 'city', 'phone', 'reach', 'availability', 'paused', 'consent', 'reviewReminder', 'reminderSeenAt']

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, load)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state))
  }, [state])

  const api = useMemo(() => {
    const user = state.users.find((item) => item.id === state.sessionUserId) || null
    const donor = user?.role === 'donor' ? state.donors.find((item) => item.userId === user.id) || null : null
    const org = user?.orgId ? state.orgs.find((item) => item.id === user.orgId) || null : null
    const notifications = user ? state.notifications.filter((note) => note.userId === user.id) : []

    return {
      ...state,
      user,
      donor,
      org,
      myNotifications: notifications,
      unread: notifications.filter((note) => !note.read).length,
      login(email, password) {
        const found = state.users.find(
          (item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password,
        )
        if (!found) return { ok: false, error: 'err.login' }
        dispatch({ type: 'session', userId: found.id })
        return { ok: true }
      },
      logout() {
        dispatch({ type: 'session', userId: null })
      },
      reset() {
        dispatch({ type: 'reset' })
      },
      register(input) {
        const email = input.email.trim().toLowerCase()
        if (state.users.some((item) => item.email.toLowerCase() === email)) {
          return { ok: false, error: 'err.emailTaken' }
        }
        const id = uid('user')
        const donorId = uid('donor')
        dispatch({
          type: 'register',
          user: { id, role: 'donor', name: input.name.trim(), email, password: input.password },
          donor: {
            id: donorId,
            userId: id,
            bloodGroup: input.bloodGroup,
            city: input.city,
            phone: input.phone.trim(),
            consent: true,
            paused: false,
            reach: input.reach || 'nearby',
            availability: {},
            reviewReminder: true,
            reminderSeenAt: null,
          },
        })
        return { ok: true }
      },
      updateDonor(patch) {
        if (!donor) return { ok: false, error: 'err.noDonor' }
        const safe = {}
        for (const key of DONOR_FIELDS) {
          if (key in patch) safe[key] = patch[key]
        }
        dispatch({ type: 'patchDonor', donorId: donor.id, patch: safe })
        return { ok: true }
      },
      createRequest(input) {
        if (!user || user.role !== 'staff' || !org) return { ok: false, error: 'err.staffOnly' }
        const units = Number(input.units)
        if (!BLOOD_OK(input.bloodGroup)) return { ok: false, error: 'err.blood' }
        if (!Number.isInteger(units) || units < 1 || units > 20) return { ok: false, error: 'err.units' }
        if (!input.neededBy) return { ok: false, error: 'err.when' }
        if (!input.city) return { ok: false, error: 'err.city' }
        if (/\b(patient|mr\.|mrs\.|national id)\b/i.test(input.note || '')) {
          return { ok: false, error: 'err.patient' }
        }
        const at = new Date().toISOString()
        const request = {
          id: uid('req'),
          reference: nextReference(state.requests),
          orgId: org.id,
          bloodGroup: input.bloodGroup,
          units,
          city: input.city,
          facility: (input.facility || org.name).trim(),
          neededBy: input.neededBy,
          priority: input.priority,
          note: (input.note || '').trim(),
          verificationStatus: 'pending',
          status: 'pending_verification',
          wave: 0,
          waveNote: '',
          createdAt: at,
          createdBy: user.name,
          history: [{ status: 'pending_verification', at, by: user.name }],
        }
        dispatch({ type: 'insertRequest', request, orgName: org.name })
        return { ok: true, request }
      },
      verifyRequest(requestId) {
        if (user?.role !== 'admin') return { ok: false, error: 'err.adminVerify' }
        const request = state.requests.find((item) => item.id === requestId)
        if (!request) return { ok: false, error: 'err.missing' }
        const owner = state.orgs.find((item) => item.id === request.orgId)
        if (!owner?.verified) {
          return { ok: false, error: 'err.orgFirst' }
        }
        dispatch({ type: 'verifyRequest', requestId, by: user.name, at: new Date().toISOString() })
        return { ok: true, critical: request.priority === 'critical' }
      },
      rejectRequest(requestId, reason) {
        if (user?.role !== 'admin') return { ok: false, error: 'err.adminDecline' }
        dispatch({ type: 'rejectRequest', requestId, reason, by: user.name, at: new Date().toISOString() })
        return { ok: true }
      },
      verifyOrg(orgId) {
        if (user?.role !== 'admin') return { ok: false, error: 'err.adminOrg' }
        dispatch({ type: 'verifyOrg', orgId })
        return { ok: true }
      },
      sendWave(requestId) {
        if (user?.role !== 'staff' || !org) return { ok: false, error: 'err.outreach' }
        const request = state.requests.find((item) => item.id === requestId)
        if (!request || request.orgId !== org.id) return { ok: false, error: 'err.otherOrg' }
        if (!org.verified) return { ok: false, error: 'err.orgUnverified' }
        if (request.verificationStatus !== 'verified') return { ok: false, error: 'err.waitCheck' }
        dispatch({ type: 'sendWave', requestId, by: user.name, at: new Date().toISOString() })
        return { ok: true }
      },
      setStatus(requestId, status) {
        if (user?.role !== 'staff' || !org) return { ok: false, error: 'err.status' }
        const request = state.requests.find((item) => item.id === requestId)
        if (!request || request.orgId !== org.id) return { ok: false, error: 'err.otherOrg' }
        if (request.verificationStatus !== 'verified' && status !== 'cancelled') {
          return { ok: false, error: 'err.notVerified' }
        }
        dispatch({ type: 'setStatus', requestId, status, by: user.name, at: new Date().toISOString() })
        return { ok: true }
      },
      respond(invitationId, response) {
        if (!donor) return { ok: false, error: 'err.donorRespond' }
        const invitation = state.invitations.find((item) => item.id === invitationId)
        if (!invitation || invitation.donorId !== donor.id) return { ok: false, error: 'err.notYours' }
        dispatch({ type: 'respond', invitationId, response, userId: user.id, at: new Date().toISOString() })
        return { ok: true }
      },
      offerDonation(requestId) {
        if (!donor) return { ok: false, error: 'err.donorRespond' }
        const request = state.requests.find((item) => item.id === requestId)
        if (!request || request.verificationStatus !== 'verified') return { ok: false, error: 'err.notVerified' }
        if (['fulfilled', 'closed', 'cancelled'].includes(request.status)) return { ok: false, error: 'err.status' }
        const groupOk = assessDonor({ ...donor, consent: true, paused: false }, request, false).reason !== 'group'
        if (!groupOk) return { ok: false, error: 'err.cantGive' }
        dispatch({ type: 'offer', requestId, userId: user.id, at: new Date().toISOString() })
        return { ok: true }
      },
      createCampaign(input) {
        if (user?.role !== 'staff' || !org) return { ok: false, error: 'err.campaignStaff' }
        if (!org.verified) return { ok: false, error: 'err.orgVerifiedFirst' }
        if (!input.title.trim() || !input.location.trim() || !input.date) {
          return { ok: false, error: 'err.campaignFields' }
        }
        dispatch({
          type: 'insertCampaign',
          campaign: {
            id: uid('camp'),
            orgId: org.id,
            title: input.title.trim(),
            host: (input.host || org.name).trim(),
            city: input.city || org.city,
            location: input.location.trim(),
            date: input.date,
            description: input.description.trim() || 'Community blood donation campaign.',
            slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30'],
            capacityPerSlot: 4,
            registrations: [],
            attendance: [],
          },
        })
        return { ok: true }
      },
      registerCampaign(campaignId, slot) {
        if (!donor) return { ok: false, error: 'err.donorSeat' }
        const campaign = state.campaigns.find((item) => item.id === campaignId)
        if (!campaign) return { ok: false, error: 'err.noCampaign' }
        if (campaign.registrations.some((reg) => reg.donorId === donor.id)) {
          return { ok: false, error: 'err.hasSeat' }
        }
        const taken = campaign.registrations.filter((reg) => reg.slot === slot).length
        if (taken >= campaign.capacityPerSlot) return { ok: false, error: 'err.full' }
        dispatch({
          type: 'registerCampaign',
          campaignId,
          registration: { id: uid('reg'), donorId: donor.id, slot, at: new Date().toISOString() },
        })
        return { ok: true }
      },
      releaseCampaign(campaignId) {
        if (!donor) return { ok: false }
        dispatch({ type: 'releaseCampaign', campaignId, donorId: donor.id })
        return { ok: true }
      },
      confirmAttendance(campaignId, donorId) {
        if (user?.role !== 'staff' || !org) return { ok: false, error: 'err.hostOnly' }
        const campaign = state.campaigns.find((item) => item.id === campaignId)
        if (!campaign || campaign.orgId !== org.id) return { ok: false, error: 'err.otherCampaign' }
        dispatch({ type: 'attend', campaignId, donorId })
        return { ok: true }
      },
      markAllRead() {
        if (!user) return
        dispatch({ type: 'readAll', userId: user.id })
      },
    }
  }, [state])

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

function BLOOD_OK(group) {
  return BLOOD_GROUPS.includes(group)
}

function nextReference(requests) {
  let reference = ''
  do {
    reference = `BB-${26000 + Math.floor(Math.random() * 800)}`
  } while (requests.some((item) => item.reference === reference))
  return reference
}

// Hook shares this module with the provider so the context stays private.
// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useStore must be used inside StoreProvider')
  return value
}
