import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FROM = 'noreply@buzzer.nyc'

function timingSafeEqualString(a: string, b: string): boolean {
  const enc = new TextEncoder()
  const ba = enc.encode(a)
  const bb = enc.encode(b)
  if (ba.length !== bb.length) return false
  let diff = 0
  for (let i = 0; i < ba.length; i++) diff |= ba[i]! ^ bb[i]!
  return diff === 0
}

function escapeHtml(s: string) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function sendApprovalEmail(params: {
  to: string
  firstName: string
  magicLink: string
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) {
    return { ok: false, message: 'RESEND_API_KEY not configured on admin-portal function' }
  }
  const fn = escapeHtml((params.firstName || 'there').trim())
  const subject = "You're approved — open Buzzer"
  const html = `<p>Hey ${fn}!</p><p>Your building profile has been approved. Tap below to open Buzzer — you'll be signed in automatically.</p><p style="margin:24px 0"><a href="${escapeHtml(params.magicLink)}" style="display:inline-block;background:#D4773A;color:#fff;font-weight:700;padding:12px 20px;border-radius:10px;text-decoration:none">Open Buzzer</a></p><p style="font-size:13px;color:#666">If the button doesn't work, copy this link into your browser:<br/><span style="word-break:break-all">${escapeHtml(params.magicLink)}</span></p><p style="margin-top:24px">The Buzzer Team</p>`
  const text = `Hey ${params.firstName || 'there'}!\n\nYour building profile has been approved. Open this link to sign in and go to Buzzer:\n\n${params.magicLink}\n\nThe Buzzer Team`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from: FROM,
      to: [params.to.trim()],
      subject,
      html,
      text,
    }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { ok: false, message: typeof body === 'object' && body && 'message' in body ? String(body.message) : res.statusText }
  }
  return { ok: true }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: { action?: string; password?: string; userId?: string; redirectBase?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const configured = Deno.env.get('ADMIN_PASSWORD') ?? ''
  const sent = (body.password ?? '').trim()
  if (!configured || !timingSafeEqualString(sent, configured)) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!supabaseUrl || !serviceRole) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing Supabase admin configuration' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  if (body.action === 'list') {
    const { data: rows, error } = await admin
      .from('profiles')
      .select('id,first_name,last_name,address,unit,email,proof_file_url,status')
      .eq('status', 'pending')
      .order('address', { ascending: true })
      .order('unit', { ascending: true })

    if (error) {
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const list = await Promise.all(
      (rows ?? []).map(async (r) => {
        let proofUrl: string | null = null
        if (r.proof_file_url && typeof r.proof_file_url === 'string') {
          const { data: signed, error: signErr } = await admin.storage
            .from('proofs')
            .createSignedUrl(r.proof_file_url, 60 * 60)
          if (!signErr && signed?.signedUrl) proofUrl = signed.signedUrl
        }
        return {
          id: r.id,
          first_name: r.first_name,
          last_name: r.last_name,
          address: r.address,
          unit: r.unit,
          email: r.email,
          proof_signed_url: proofUrl,
        }
      }),
    )

    return new Response(JSON.stringify({ ok: true, rows: list }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (body.action === 'approve') {
    const userId = body.userId
    if (!userId || typeof userId !== 'string') {
      return new Response(JSON.stringify({ ok: false, error: 'Missing userId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const redirectBase = (body.redirectBase ?? 'https://buzzer.nyc').replace(/\/$/, '')
    const redirectTo = `${redirectBase}/app`

    const { data: profile, error: fetchErr } = await admin
      .from('profiles')
      .select('id,email,first_name,status')
      .eq('id', userId)
      .maybeSingle()

    if (fetchErr || !profile) {
      return new Response(JSON.stringify({ ok: false, error: fetchErr?.message || 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (profile.status !== 'pending') {
      return new Response(JSON.stringify({ ok: false, error: 'Profile is not pending' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { error: updErr } = await admin.from('profiles').update({ status: 'approved' }).eq('id', userId).eq('status', 'pending')
    if (updErr) {
      return new Response(JSON.stringify({ ok: false, error: updErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: profile.email,
      options: { redirectTo },
    })

    if (linkErr) {
      await admin.from('profiles').update({ status: 'pending' }).eq('id', userId)
      return new Response(JSON.stringify({ ok: false, error: linkErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const props = linkData?.properties as Record<string, string> | undefined
    const actionLink = props?.action_link ?? (linkData as unknown as { action_link?: string })?.action_link
    if (!actionLink) {
      await admin.from('profiles').update({ status: 'pending' }).eq('id', userId)
      return new Response(JSON.stringify({ ok: false, error: 'generateLink did not return action_link' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const sentMail = await sendApprovalEmail({
      to: profile.email,
      firstName: profile.first_name,
      magicLink: actionLink,
    })

    if (!sentMail.ok) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: `Approved but email failed: ${sentMail.message}. Copy the magic link below and send it manually.`,
          magicLink: actionLink,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ ok: false, error: 'Unknown action' }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
