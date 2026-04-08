import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

function loadEnvFile() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const envPath = path.resolve(__dirname, '..', '.env')
  if (!fs.existsSync(envPath)) return
  const raw = fs.readFileSync(envPath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx <= 0) continue
    const key = trimmed.slice(0, idx).trim()
    let value = trimmed.slice(idx + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

function requiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

async function main() {
  loadEnvFile()
  const supabaseUrl = requiredEnv('VITE_SUPABASE_URL')
  const supabaseAnonKey = requiredEnv('VITE_SUPABASE_ANON_KEY')

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const pageSize = 200
  let offset = 0
  let totalSent = 0
  let totalFailed = 0

  while (true) {
    const { data: rows, error } = await supabase
      .from('profiles')
      .select('id,email,first_name,address,status,invite_sent')
      .eq('status', 'approved')
      .eq('invite_sent', false)
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1)

    if (error) {
      throw new Error(`Failed to read profiles: ${error.message}`)
    }

    if (!rows || rows.length === 0) break

    for (const row of rows) {
      const label = `${row.email || row.id} (${row.first_name || 'there'})`
      const { data: sendResp, error: sendErr } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'building_invite',
          to: row.email,
          data: {
            first_name: row.first_name,
            building_address: row.address,
          },
        },
      })

      if (sendErr || sendResp?.ok === false) {
        totalFailed += 1
        const message = sendErr?.message || sendResp?.error?.message || 'unknown send error'
        console.error(`[FAIL] invite ${label}: ${message}`)
        continue
      }

      const { error: updErr } = await supabase
        .from('profiles')
        .update({ invite_sent: true })
        .eq('id', row.id)

      if (updErr) {
        totalFailed += 1
        console.error(`[FAIL] sent but could not mark invite_sent for ${label}: ${updErr.message}`)
        continue
      }

      totalSent += 1
      console.log(`[OK] invite sent to ${label}`)
    }

    if (rows.length < pageSize) break
    offset += pageSize
  }

  console.log(`Done. Sent: ${totalSent}, Failed: ${totalFailed}`)
}

main().catch((err) => {
  console.error(err?.message || err)
  process.exit(1)
})
