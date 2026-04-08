import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-invite-secret',
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
    const configuredSecret = Deno.env.get('INVITE_SECRET')
    if (!configuredSecret) {
      return new Response(
        JSON.stringify({ ok: false, error: { message: 'INVITE_SECRET not configured' } }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    const headerSecret = req.headers.get('x-invite-secret') ?? ''
    if (!timingSafeEqualString(headerSecret, configuredSecret)) {
      return new Response(JSON.stringify({ ok: false, error: { message: 'Unauthorized' } }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } else {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ ok: false, error: { message: 'Missing authorization' } }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()
    if (userErr || !user) {
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
