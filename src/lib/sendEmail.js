import { supabase } from './supabase'

/**
 * Transactional email via Supabase Edge Function `send-email` (Resend API key stays server-side).
 */

async function invokeSendEmail({ type, to, data }) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const headers = {}
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`
    // Fallback if the runtime does not forward Authorization to the function worker (some Edge paths).
    headers['x-access-token'] = session.access_token
  }

  const { data: res, error } = await supabase.functions.invoke('send-email', {
    body: { type, to, data },
    headers,
  })

  if (res && typeof res === 'object') {
    if (res.ok === true) return { ok: true, data: res.data }
    if (res.ok === false) {
      return { ok: false, error: res.error ?? { message: 'send-email failed' } }
    }
  }
  if (error) {
    return { ok: false, error: { message: error.message } }
  }
  return { ok: false, error: { message: 'Unexpected response from send-email' } }
}

/**
 * Package spotted — notify recipient unit (private; not posted to feed).
 */
export async function sendPackageSpottedEmail({ to, firstName, loggerUnit }) {
  return invokeSendEmail({
    type: 'package_spotted',
    to,
    data: { firstName, loggerUnit },
  })
}

/**
 * New help request posted — notify other approved residents in the building.
 */
export async function sendHelpRequestedEmail({
  to,
  firstName,
  requesterName,
  requesterUnit,
  address,
  note,
}) {
  return invokeSendEmail({
    type: 'help_requested',
    to,
    data: { firstName, requesterName, requesterUnit, address, note },
  })
}

/**
 * A neighbor volunteered — notify the requester.
 */
export async function sendVolunteerOfferedEmail({
  to,
  firstName,
  volunteerName,
  volunteerUnit,
  requestId,
}) {
  return invokeSendEmail({
    type: 'volunteer_offered',
    to,
    data: { firstName, volunteerName, volunteerUnit, requestId },
  })
}

/**
 * Requester chose this volunteer — notify the volunteer.
 */
export async function sendVolunteerChosenEmail({
  to,
  firstName,
  requesterName,
  requesterUnit,
}) {
  return invokeSendEmail({
    type: 'volunteer_chosen',
    to,
    data: { firstName, requesterName, requesterUnit },
  })
}

/**
 * Requester marked package collected — thank the neighbor who held it.
 */
export async function sendPackageCollectedEmail({ to, firstName, collectorName }) {
  return invokeSendEmail({
    type: 'package_collected',
    to,
    data: { firstName, collectorName },
  })
}

/**
 * Invite a resident when their building joins Buzzer.
 */
export async function sendBuildingInviteEmail({ to, firstName, buildingAddress }) {
  return invokeSendEmail({
    type: 'building_invite',
    to,
    data: { first_name: firstName, building_address: buildingAddress },
  })
}

/**
 * Proof submitted — confirmation while account is pending (logged-in applicant).
 */
export async function sendApplicationReceivedEmail({ to, firstName, address, unit }) {
  return invokeSendEmail({
    type: 'application_received',
    to,
    data: {
      first_name: firstName,
      address,
      unit,
    },
  })
}
