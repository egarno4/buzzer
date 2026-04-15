import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function timingSafeEqualString(a: string, b: string): boolean {
  const enc = new TextEncoder()
  const ba = enc.encode(a)
  const bb = enc.encode(b)
  if (ba.length !== bb.length) return false
  let diff = 0
  for (let i = 0; i < ba.length; i++) diff |= ba[i]! ^ bb[i]!
  return diff === 0
}

async function sendAccountApprovedEmail(params: {
  supabaseUrl: string
  anonKey: string
  inviteSecret: string
  to: string
  firstName: string
  buildingAddress: string
  magicLink: string
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const url = `${params.supabaseUrl.replace(/\/$/, '')}/functions/v1/send-email`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.anonKey}`,
      apikey: params.anonKey,
      'x-invite-secret': params.inviteSecret,
    },
    body: JSON.stringify({
      type: 'account_approved',
      to: params.to.trim(),
      data: {
        first_name: params.firstName,
        building_address: params.buildingAddress,
        magic_link: params.magicLink,
      },
    }),
  })
  const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: { message?: string } }
  if (!res.ok || body?.ok !== true) {
    const msg = body?.error?.message ?? res.statusText
    return { ok: false, message: msg }
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
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const inviteSecret = Deno.env.get('INVITE_SECRET') ?? ''
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

    if (!anonKey || !inviteSecret) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Configure SUPABASE_ANON_KEY and INVITE_SECRET on admin-portal (needed for approval email).',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Magic link must land on /app (not site root). Accept redirectBase with or without /app.
    const rawBase = (body.redirectBase ?? 'https://buzzer.nyc').replace(/\/$/, '')
    const redirectTo = rawBase.endsWith('/app') ? rawBase : `${rawBase}/app`

    const { data: profile, error: fetchErr } = await admin
      .from('profiles')
      .select('id,email,first_name,status,address,approval_email_sent_at')
      .eq('id', userId)
      .maybeSingle()

    if (fetchErr || !profile) {
      return new Response(JSON.stringify({ ok: false, error: fetchErr?.message || 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (profile.status === 'approved' && profile.approval_email_sent_at) {
      return new Response(JSON.stringify({ ok: true, skipped: 'already_approved_and_emailed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const wasPending = profile.status === 'pending'
    const resendAfterFailedEmail = profile.status === 'approved' && !profile.approval_email_sent_at

    if (!wasPending && !resendAfterFailedEmail) {
      return new Response(JSON.stringify({ ok: false, error: 'Profile is not pending' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (wasPending) {
      const { error: updErr } = await admin.from('profiles').update({ status: 'approved' }).eq('id', userId).eq('status', 'pending')
      if (updErr) {
        return new Response(JSON.stringify({ ok: false, error: updErr.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: profile.email,
      options: { redirectTo },
    })

    if (linkErr) {
      if (wasPending) {
        await admin.from('profiles').update({ status: 'pending' }).eq('id', userId)
      }
      return new Response(JSON.stringify({ ok: false, error: linkErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const props = linkData?.properties as Record<string, string> | undefined
    const actionLink = props?.action_link ?? (linkData as unknown as { action_link?: string })?.action_link
    if (!actionLink) {
      if (wasPending) {
        await admin.from('profiles').update({ status: 'pending' }).eq('id', userId)
      }
      return new Response(JSON.stringify({ ok: false, error: 'generateLink did not return action_link' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const sentMail = await sendAccountApprovedEmail({
      supabaseUrl,
      anonKey,
      inviteSecret,
      to: profile.email,
      firstName: profile.first_name,
      buildingAddress: profile.address ?? '',
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

    const { error: stampErr } = await admin
      .from('profiles')
      .update({ approval_email_sent_at: new Date().toISOString() })
      .eq('id', userId)

    if (stampErr) {
      console.warn('approval_email_sent_at update failed:', stampErr.message)
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
