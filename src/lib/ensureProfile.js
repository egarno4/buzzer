import { supabase } from './supabase'

/**
 * Inserts a profiles row after magic-link sign-in if missing.
 * Requires onboarding data in localStorage (same browser as signup).
 */
export async function ensureProfile(user, onboarding) {
  const fn = onboarding.firstName?.trim()
  const ln = onboarding.lastName?.trim()
  const address = onboarding.address?.trim()
  const unit = onboarding.unit?.trim()
  const borough = onboarding.borough?.trim()

  if (!fn || !ln || !address || !unit || !borough) {
    throw new Error(
      'Missing signup details. Open the magic link in the same browser where you entered your name and address, or start again from the beginning.',
    )
  }

  const email = (user.email || onboarding.email || '').trim().toLowerCase()
  if (!email) {
    throw new Error('Missing email on account.')
  }

  const row = {
    id: user.id,
    first_name: fn,
    last_name: ln,
    address,
    unit,
    borough,
    email,
    proof_type: null,
    proof_file_url: null,
    status: 'pending',
  }

  const { data: existing, error: selErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (selErr) throw selErr
  if (existing) return

  const { error: insErr } = await supabase.from('profiles').insert(row)
  if (insErr) throw insErr
}
