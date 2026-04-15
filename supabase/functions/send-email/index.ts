import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-invite-secret, x-access-token',
}

const FROM = 'noreply@buzzer.nyc'
const APP_BASE = 'https://buzzer.nyc/app'
const HOME_URL = 'https://buzzer.nyc'

const BRAND = {
  bg: '#F5F0E8',
  accent: '#D4773A',
  dark: '#1C1812',
  muted: '#6b5f52',
  line: '#E8E1D5',
}

const EMAIL_TYPES = [
  'package_spotted',
  'help_requested',
  'volunteer_offered',
  'volunteer_chosen',
  'package_collected',
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

function buzzerEmailShell(innerHtml: string) {
  const font =
    "https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@700&display=swap"
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><link rel="stylesheet" href="${font}"/></head><body style="margin:0;background:${BRAND.bg};"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:28px 16px;font-family:Barlow,Helvetica Neue,Arial,sans-serif;color:${BRAND.dark};font-size:16px;line-height:1.55;"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid ${BRAND.line};overflow:hidden;box-shadow:0 4px 24px rgba(28,24,18,0.06);"><tr><td style="padding:22px 24px 26px;">${innerHtml}</td></tr></table><p style="max-width:560px;margin:18px auto 0;font-size:12px;color:${BRAND.muted};text-align:center;">Buzzer · buzzer.nyc</p></td></tr></table></body></html>`
}

function ctaRow(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 0;"><tr><td><a href="${escapeHtml(href)}" style="display:inline-block;background:${BRAND.accent};color:#ffffff;font-weight:700;padding:14px 22px;border-radius:10px;text-decoration:none;font-size:16px;">${escapeHtml(label)}</a></td></tr></table>`
}

function wordmarkHtml() {
  return `<p style="margin:0 0 18px;font-family:'Barlow Condensed',Barlow,sans-serif;font-size:20px;font-weight:800;letter-spacing:0.02em;text-transform:uppercase;color:${BRAND.dark};line-height:1;">BUZZ<span style="color:${BRAND.accent};">ER</span></p>`
}

function truncateNote(s: string, max = 400) {
  const t = String(s ?? '').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
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
    const loggerUnit = typeof data.loggerUnit === 'string' ? data.loggerUnit : ''
    const fn = (firstName || 'there').trim()
    const lu = loggerUnit.trim() || '—'
    const subject = '📦 Heads up — a package might be yours'
    const cta = `${APP_BASE}?modal=request`
    const inner = `${wordmarkHtml()}<p style="margin:0 0 14px;">Hi ${escapeHtml(fn)},</p><p style="margin:0 0 14px;">Your neighbor in Unit ${escapeHtml(lu)} spotted a package in the lobby that looks like it could be yours. Head home to grab it, or if you need someone to hold it for you, post a request to your building feed.</p>${ctaRow(cta, 'Request Help from Neighbors')}`
    const html = buzzerEmailShell(inner)
    const text = `Hi ${fn},

Your neighbor in Unit ${lu} spotted a package in the lobby that looks like it could be yours. Head home to grab it, or if you need someone to hold it for you, post a request to your building feed.

Request Help from Neighbors: ${cta}

— The Buzzer Team`
    return { subject, html, text }
  }
  if (type === 'help_requested') {
    const firstName = typeof data.firstName === 'string' ? data.firstName : ''
    const requesterName = typeof data.requesterName === 'string' ? data.requesterName : ''
    const requesterUnit = typeof data.requesterUnit === 'string' ? data.requesterUnit : ''
    const address = typeof data.address === 'string' ? data.address : ''
    const note = truncateNote(typeof data.note === 'string' ? data.note : '')
    const fn = (firstName || 'there').trim()
    const rn = (requesterName || 'A neighbor').trim()
    const ru = requesterUnit.trim() || '—'
    const addr = (address || 'your building').trim()
    const subject = '🙋 A neighbor needs help with a package'
    const cta = `${APP_BASE}?tab=feed`
    const noteBlock = note
      ? `<p style="margin:0 0 14px;color:${BRAND.muted};font-size:15px;">“${escapeHtml(note)}”</p>`
      : ''
    const inner = `${wordmarkHtml()}<p style="margin:0 0 14px;">Hi ${escapeHtml(fn)},</p><p style="margin:0 0 14px;">${escapeHtml(rn)} in Unit ${escapeHtml(ru)} at ${escapeHtml(addr)} is expecting a delivery and needs a neighbor to hold it until they get home.</p>${noteBlock}<p style="margin:0 0 14px;">Tap below to volunteer — they’ll choose who holds it.</p>${ctaRow(cta, 'Offer to Help')}`
    const html = buzzerEmailShell(inner)
    const textNote = note ? `\n\n“${note}”\n` : '\n'
    const text = `Hi ${fn},

${rn} in Unit ${ru} at ${addr} is expecting a delivery and needs a neighbor to hold it until they get home.${textNote}
Tap below to volunteer — they'll choose who holds it.

Offer to Help: ${cta}

— The Buzzer Team`
    return { subject, html, text }
  }
  if (type === 'volunteer_offered') {
    const firstName = typeof data.firstName === 'string' ? data.firstName : ''
    const volunteerName = typeof data.volunteerName === 'string' ? data.volunteerName : ''
    const volunteerUnit = typeof data.volunteerUnit === 'string' ? data.volunteerUnit : ''
    const requestId = typeof data.requestId === 'string' ? data.requestId : ''
    const fn = (firstName || 'there').trim()
    const vn = (volunteerName || 'A neighbor').trim()
    const vu = volunteerUnit.trim() || '—'
    const subject = '🙌 A neighbor offered to help'
    const cta = requestId ? `${APP_BASE}?tab=feed&request=${encodeURIComponent(requestId)}` : `${APP_BASE}?tab=feed`
    const inner = `${wordmarkHtml()}<p style="margin:0 0 14px;">Hi ${escapeHtml(fn)},</p><p style="margin:0 0 14px;">${escapeHtml(vn)} in Unit ${escapeHtml(vu)} has offered to hold your package. Open Buzzer to review your volunteers and choose who holds it — you stay in control of who you interact with.</p>${ctaRow(cta, 'Choose Who Holds It')}`
    const html = buzzerEmailShell(inner)
    const text = `Hi ${fn},

${vn} in Unit ${vu} has offered to hold your package. Open Buzzer to review your volunteers and choose who holds it — you stay in control of who you interact with.

Choose Who Holds It: ${cta}

— The Buzzer Team`
    return { subject, html, text }
  }
  if (type === 'volunteer_chosen') {
    const firstName = typeof data.firstName === 'string' ? data.firstName : ''
    const requesterName = typeof data.requesterName === 'string' ? data.requesterName : ''
    const requesterUnit = typeof data.requesterUnit === 'string' ? data.requesterUnit : ''
    const fn = (firstName || 'there').trim()
    const rn = (requesterName || 'A neighbor').trim()
    const ru = requesterUnit.trim() || '—'
    const subject = "✅ You've been chosen to hold a package!"
    const cta = `${APP_BASE}?tab=feed`
    const inner = `${wordmarkHtml()}<p style="margin:0 0 14px;">Hey ${escapeHtml(fn)},</p><p style="margin:0 0 14px;">${escapeHtml(rn)} in Unit ${escapeHtml(ru)} chose you to hold their package. When you can, grab it from the lobby — they’re counting on you.</p>${ctaRow(cta, 'Open Buzzer')}`
    const html = buzzerEmailShell(inner)
    const text = `Hey ${fn},

${rn} in Unit ${ru} chose you to hold their package. When you can, grab it from the lobby — they're counting on you.

Open Buzzer: ${cta}

— The Buzzer Team`
    return { subject, html, text }
  }
  if (type === 'package_collected') {
    const firstName = typeof data.firstName === 'string' ? data.firstName : ''
    const collectorName = typeof data.collectorName === 'string' ? data.collectorName : ''
    const fn = (firstName || 'there').trim()
    const cn = (collectorName || 'Your neighbor').trim()
    const subject = '✅ Package collected — thanks for helping!'
    const cta = APP_BASE
    const inner = `${wordmarkHtml()}<p style="margin:0 0 14px;">Hi ${escapeHtml(fn)},</p><p style="margin:0 0 14px;">${escapeHtml(cn)} just picked up their package. You’re a good neighbor — that’s what Buzzer is all about.</p>${ctaRow(cta, 'Open Buzzer')}`
    const html = buzzerEmailShell(inner)
    const text = `Hi ${fn},

${cn} just picked up their package. You're a good neighbor — that's what Buzzer is all about.

Open Buzzer: ${cta}

— The Buzzer Team`
    return { subject, html, text }
  }
  if (type === 'account_approved') {
    const firstName = typeof data.first_name === 'string' ? data.first_name : ''
    const buildingAddress = typeof data.building_address === 'string' ? data.building_address : ''
    const magicLink = typeof data.magic_link === 'string' ? data.magic_link.trim() : ''
    const fn = (firstName || 'there').trim()
    const addr = (buildingAddress || 'your building').trim()
    const ctaHref = magicLink || APP_BASE
    const subject = "You're approved on Buzzer!"
    const magicExtra = magicLink
      ? `<p style="margin:14px 0 0;font-size:13px;color:${BRAND.muted};">Tap below to open Buzzer — you'll be signed in automatically.</p><p style="margin:12px 0 0;font-size:12px;color:${BRAND.muted};">If the button doesn't work, copy this link into your browser:<br/><span style="word-break:break-all">${escapeHtml(magicLink)}</span></p>`
      : ''
    const inner = `${wordmarkHtml()}<p style="margin:0 0 14px;">Hey ${escapeHtml(fn)}! 🎉</p><p style="margin:0 0 14px;">You’ve been approved on Buzzer for ${escapeHtml(addr)}.</p><p style="margin:0 0 14px;">Your neighbors are waiting — tap below to get started.</p>${ctaRow(ctaHref, 'Open Buzzer')}${magicExtra}<p style="margin:22px 0 0;font-size:14px;color:${BRAND.muted};">No doorman required. 🙌</p><p style="margin:18px 0 0;">The Buzzer Team</p>`
    const html = buzzerEmailShell(inner)
    const textMagic = magicLink
      ? `\n\nTap this link to open Buzzer and sign in automatically:\n${magicLink}\n`
      : `\n\nOpen Buzzer: ${APP_BASE}\n`
    const text = `Hey ${fn}! 🎉

You've been approved on Buzzer for ${addr}.

Your neighbors are waiting — tap below to get started.${textMagic}
No doorman required. 🙌
The Buzzer Team`
    return { subject, html, text }
  }
  if (type === 'building_invite') {
    const firstName = typeof data.first_name === 'string' ? data.first_name : ''
    const buildingAddress = typeof data.building_address === 'string' ? data.building_address : ''
    const fn = (firstName || 'there').trim()
    const addr = (buildingAddress || 'your building').trim()
    const subject = '🏠 Your building just joined Buzzer!'
    const inner = `${wordmarkHtml()}<p style="margin:0 0 14px;">Hey ${escapeHtml(fn)}!</p><p style="margin:0 0 14px;">Your building at ${escapeHtml(addr)} has joined Buzzer — the app that helps neighbors keep each other’s packages safe. No doorman required. 🙌</p><p style="margin:0 0 14px;">Your landlord has already verified your address, so you’re good to go. Tap below to activate your account.</p>${ctaRow(HOME_URL, 'Activate My Account')}<p style="margin:22px 0 0;">See you in the building,<br/>The Buzzer Team</p>`
    const html = buzzerEmailShell(inner)
    const text = `Hey ${fn}!

Your building at ${addr} has joined Buzzer — the app that helps neighbors keep each other's packages safe. No doorman required.

Your landlord has already verified your address, so you're good to go.

Activate My Account: ${HOME_URL}

See you in the building,
The Buzzer Team`
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
    const inner = `${wordmarkHtml()}<p style="margin:0 0 14px;">Hi ${escapeHtml(fn)},</p><p style="margin:0 0 14px;">Thanks for joining Buzzer — we’re glad you’re here. We’ve got your application for ${escapeHtml(addr)}, Unit ${escapeHtml(u)}, and we’re looking over your proof of residence now.</p><p style="margin:0 0 14px;">You’ll hear from us again within a few hours once you’re approved. That next email will include a link that signs you straight into the app.</p><p style="margin:0 0 14px;">If anything’s on your mind before then, just hit reply — a real human reads this inbox.</p><p style="margin:22px 0 0;">— The Buzzer Team<br/>buzzer.nyc</p>`
    const html = buzzerEmailShell(inner)
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
