import { supabase } from './supabase'

/**
 * Transactional email via Supabase Edge Function `send-email` (Resend API key stays server-side).
 */

async function invokeSendEmail({ type, to, data }) {
  const { data: res, error } = await supabase.functions.invoke('send-email', {
    body: { type, to, data },
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
 * Package spotted — notify recipient unit.
 */
export async function sendPackageSpottedEmail({ to, firstName, buildingAddress }) {
  return invokeSendEmail({
    type: 'package_spotted',
    to,
    data: { firstName, buildingAddress },
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
}) {
  return invokeSendEmail({
    type: 'volunteer_offered',
    to,
    data: { firstName, volunteerName, volunteerUnit },
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
