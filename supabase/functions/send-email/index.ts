import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-invite-secret, x-access-token',
}

const FROM = 'noreply@buzzer.nyc'
const APP_URL = 'https://buzzer.nyc/app'
const HOME_URL = 'https://buzzer.nyc'
const OPEN_BUZZER_URL = 'https://buzzer.nyc'

const EMAIL_TYPES = [
  'package_spotted',
  'volunteer_offered',
  'volunteer_chosen',
  'building_invite',
  'account_approved',
  'application_received',
] as const
type EmailType = (typeof EMAIL_TYPES)[number]

function escapeHtml(s: string) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function viewInBuzzerHtml() {
  return `<p style="margin:20px 0 0"><a href="${APP_URL}" style="color:#D4773A;font-weight:700">View in Buzzer →</a></p>`
}

function viewInBuzzerText() {
  return `View in Buzzer: ${APP_URL}`
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

/** Constant-time comparison for invite secret (UTF-8 byte lengths must match). */
function timingSafeEqualString(a: string, b: string): boolean {
  const enc = new TextEncoder()
  const ba = enc.encode(a)
  const bb = enc.encode(b)
  if (ba.length !== bb.length) return false
  let diff = 0
  for (let i = 0; i < ba.length; i++) diff |= ba[i]! ^ bb[i]!
  return diff === 0
}

/** Bearer from Authorization / authorization / x-access-token (fallback if proxies alter headers). */
function getAccessTokenFromRequest(req: Request): string {
  const raw =
    req.headers.get('Authorization') ??
    req.headers.get('authorization') ??
    req.headers.get('x-access-token') ??
    ''
  return raw.replace(/^Bearer\s+/i, '').trim()
}

/** Validate JWT against GoTrue (more reliable in Edge than supabase-js getUser in some runtimes). */
async function verifyUserWithGoTrue(
  supabaseUrl: string,
  anonKey: string,
  accessToken: string,
): Promise<{ ok: true; userId: string } | { ok: false; detail: string }> {
  const base = supabaseUrl.replace(/\/$/, '')
  const res = await fetch(`${base}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    return { ok: false, detail: `auth/v1/user ${res.status}: ${text.slice(0, 160)}` }
  }
  const body = (await res.json()) as { id?: string }
  if (!body?.id) return { ok: false, detail: 'auth/v1/user: missing id' }
  return { ok: true, userId: body.id }
}

function buildEmail(
  type: EmailType,
  data: Record<string, unknown>,
): { subject: string; html: string; text: string } | { error: string } {
  if (type === 'package_spotted') {
    const firstName = typeof data.firstName === 'string' ? data.firstName : ''
    const buildingAddress = typeof data.buildingAddress === 'string' ? data.buildingAddress : ''
    const fn = (firstName || 'there').trim()
    const addr = (buildingAddress || 'your building').trim()
    const subject = '📦 Someone spotted a package for you!'
    const html = `<p>Hey ${escapeHtml(fn)}! A neighbor spotted a package for you at ${escapeHtml(addr)}. Log in to Buzzer to take action.</p>${viewInBuzzerHtml()}`
    const text = `Hey ${fn}! A neighbor spotted a package for you at ${addr}. Log in to Buzzer to take action.\n\n${viewInBuzzerText()}`
    return { subject, html, text }
  }
  if (type === 'volunteer_offered') {
    const firstName = typeof data.firstName === 'string' ? data.firstName : ''
    const volunteerName = typeof data.volunteerName === 'string' ? data.volunteerName : ''
    const volunteerUnit = typeof data.volunteerUnit === 'string' ? data.volunteerUnit : ''
    const fn = (firstName || 'there').trim()
    const vn = (volunteerName || 'A neighbor').trim()
    const vu = volunteerUnit.trim()
    const subject = '🙋 A neighbor offered to help!'
    const html = `<p>Hey ${escapeHtml(fn)}! ${escapeHtml(vn)} in Unit ${escapeHtml(vu)} offered to hold your package. Log in to choose them or wait for more volunteers.</p>${viewInBuzzerHtml()}`
    const text = `Hey ${fn}! ${vn} in Unit ${vu} offered to hold your package. Log in to choose them or wait for more volunteers.\n\n${viewInBuzzerText()}`
    return { subject, html, text }
  }
  if (type === 'volunteer_chosen') {
    const firstName = typeof data.firstName === 'string' ? data.firstName : ''
    const requesterName = typeof data.requesterName === 'string' ? data.requesterName : ''
    const requesterUnit = typeof data.requesterUnit === 'string' ? data.requesterUnit : ''
    const fn = (firstName || 'there').trim()
    const rn = (requesterName || 'A neighbor').trim()
    const ru = requesterUnit.trim()
    const subject = "✅ You've been chosen to hold a package!"
    const html = `<p>Hey ${escapeHtml(fn)}! ${escapeHtml(rn)} in Unit ${escapeHtml(ru)} chose you to hold their package. Please grab it when you can!</p>${viewInBuzzerHtml()}`
    const text = `Hey ${fn}! ${rn} in Unit ${ru} chose you to hold their package. Please grab it when you can!\n\n${viewInBuzzerText()}`
    return { subject, html, text }
  }
  if (type === 'account_approved') {
    const firstName = typeof data.first_name === 'string' ? data.first_name : ''
    const buildingAddress = typeof data.building_address === 'string' ? data.building_address : ''
    const fn = (firstName || 'there').trim()
    const addr = (buildingAddress || 'your building').trim()
    const subject = "✅ You're approved on Buzzer!"
    const html = `<p>Hey ${escapeHtml(fn)}! 🎉</p><p>You've been approved on Buzzer for ${escapeHtml(addr)}.</p><p>Your neighbors are waiting — tap below to get started:</p><p style="margin:20px 0 0"><a href="${OPEN_BUZZER_URL}" style="color:#D4773A;font-weight:700">Open Buzzer →</a></p><p style="margin:20px 0 0">No doorman required. 🙌</p><p style="margin:24px 0 0">The Buzzer Team</p>`
    const text = `Hey ${fn}! 🎉\n\nYou've been approved on Buzzer for ${addr}.\n\nYour neighbors are waiting — tap below to get started:\n\nOpen Buzzer → (${OPEN_BUZZER_URL})\n\nNo doorman required. 🙌\nThe Buzzer Team`
    return { subject, html, text }
  }
  if (type === 'building_invite') {
    const firstName = typeof data.first_name === 'string' ? data.first_name : ''
    const buildingAddress = typeof data.building_address === 'string' ? data.building_address : ''
    const fn = (firstName || 'there').trim()
    const addr = (buildingAddress || 'your building').trim()
    const subject = '🏠 Your building just joined Buzzer!'
    const html = `<p>Hey ${escapeHtml(fn)}!</p><p>Your building at ${escapeHtml(addr)} has joined Buzzer — the app that helps neighbors keep each other's packages safe. No doorman required. 🙌</p><p>Your landlord has already verified your address so you're good to go. Click below to activate your account:</p><p style="margin:20px 0 0"><a href="${HOME_URL}" style="color:#D4773A;font-weight:700">Activate My Account →</a></p><p style="margin:24px 0 0">See you in the building,<br/>The Buzzer Team</p>`
    const text = `Hey ${fn}!\n\nYour building at ${addr} has joined Buzzer - the app that helps neighbors keep each other's packages safe. No doorman required.\n\nYour landlord has already verified your address so you're good to go. Click below to activate your account:\n\nActivate My Account: ${HOME_URL}\n\nSee you in the building,\nThe Buzzer Team`
    return { subject, html, text }
  }
  if (type === 'application_received') {
    const firstName = typeof data.first_name === 'string' ? data.first_name : ''
    const address = typeof data.address === 'string' ? data.address : ''
    const unit = typeof data.unit === 'string' ? data.unit : ''
    const fn = (firstName || 'there').trim()
    const addr = (address || 'your building').trim()
    const u = unit.trim()
    const subject = 'We got your Buzzer application 📦'
    const html = `<p>Hi ${escapeHtml(fn)},</p>
<p>Thanks for joining Buzzer — we're glad you're here. We've got your application for ${escapeHtml(addr)}, Unit ${escapeHtml(u)}, and we're looking over your proof of residence now.</p>
<p>You'll hear from us again within a few hours once you're approved. That next email will include a link that signs you straight into the app.</p>
<p>If anything's on your mind before then, just hit reply — a real human reads this inbox.</p>
<p style="margin:28px 0 0">— The Buzzer Team<br/>buzzer.nyc</p>`
    const text = `Hi ${fn},

Thanks for joining Buzzer — we're glad you're here. We've got your application for ${addr}, Unit ${u}, and we're looking over your proof of residence now.

You'll hear from us again within a few hours once you're approved. That next email will include a link that signs you straight into the app.

If anything's on your mind before then, just hit reply — a real human reads this inbox.

— The Buzzer Team
buzzer.nyc`
    return { subject, html, text }
  }
  return { error: 'invalid_type' }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: { message: 'Method not allowed' } }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let payload: { type?: string; to?: string; data?: Record<string, unknown> }
  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ ok: false, error: { message: 'Invalid JSON' } }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { type, to, data } = payload
  if (!type || !EMAIL_TYPES.includes(type as EmailType)) {
    return new Response(JSON.stringify({ ok: false, error: { message: 'Invalid or missing type' } }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  if (!isNonEmptyString(to) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) {
    return new Response(JSON.stringify({ ok: false, error: { message: 'Invalid or missing to' } }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  if (!data || typeof data !== 'object') {
    return new Response(JSON.stringify({ ok: false, error: { message: 'Invalid or missing data' } }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const built = buildEmail(type as EmailType, data)
  if ('error' in built) {
    return new Response(JSON.stringify({ ok: false, error: { message: built.error } }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (type === 'building_invite' || type === 'account_approved') {
    const envSecret = Deno.env.get('INVITE_SECRET') ?? ''
    const receivedSecret = req.headers.get('x-invite-secret') ?? ''
    console.log('Secret check - env secret length:', Deno.env.get('INVITE_SECRET')?.length ?? 'MISSING')
    console.log('Secret check - header length:', receivedSecret?.length ?? 'MISSING')
    console.log('Secret check - match:', timingSafeEqualString(receivedSecret, envSecret))
    if (!envSecret) {
      return new Response(
        JSON.stringify({ ok: false, error: { message: 'INVITE_SECRET not configured' } }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    if (!timingSafeEqualString(receivedSecret, envSecret)) {
      return new Response(JSON.stringify({ ok: false, error: { message: 'Unauthorized' } }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } else {
    const accessToken = getAccessTokenFromRequest(req)
    const jwtPresent = accessToken.length > 0
    const hasAuthHeader =
      Boolean(req.headers.get('Authorization')?.trim()) ||
      Boolean(req.headers.get('authorization')?.trim())
    const hasAccessTokenHeader = Boolean(req.headers.get('x-access-token')?.trim())
    console.log('Auth check - JWT present (token length):', jwtPresent ? accessToken.length : 'MISSING')
    console.log('Auth check - header sources:', {
      authorization: hasAuthHeader,
      x_access_token: hasAccessTokenHeader,
    })

    if (!jwtPresent) {
      return new Response(JSON.stringify({ ok: false, error: { message: 'Missing authorization' } }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    if (!supabaseUrl || !supabaseAnon) {
      console.log('Auth check - missing SUPABASE_URL or SUPABASE_ANON_KEY in function env')
      return new Response(JSON.stringify({ ok: false, error: { message: 'Server misconfigured' } }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const verified = await verifyUserWithGoTrue(supabaseUrl, supabaseAnon, accessToken)
    console.log('Auth check - GoTrue verify ok:', verified.ok)
    if (!verified.ok) {
      console.log('Auth check - GoTrue verify detail:', verified.detail)
    }
    if (!verified.ok) {
      return new Response(JSON.stringify({ ok: false, error: { message: 'Unauthorized' } }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) {
    return new Response(JSON.stringify({ ok: false, error: { message: 'RESEND_API_KEY not configured' } }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from: FROM,
      to: [to.trim()],
      subject: built.subject,
      html: built.html,
      text: built.text,
    }),
  })

  const resendBody = await res.json().catch(() => ({}))
  if (!res.ok) {
    return new Response(
      JSON.stringify({ ok: false, error: resendBody }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  return new Response(JSON.stringify({ ok: true, data: resendBody }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
