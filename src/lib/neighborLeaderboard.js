/** NYC calendar month/year (matches leaderboard RPC filter). */
export function nycCalendarMonthYear(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: 'numeric',
    year: 'numeric',
  }).formatToParts(date)
  const month = Number(parts.find((p) => p.type === 'month')?.value)
  const year = Number(parts.find((p) => p.type === 'year')?.value)
  return { month, year }
}

export function nycMonthDisplayLabel(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

/** Rows must be sorted by action_count descending (as returned by RPC). */
export function withCompetitionRanks(rpcRows) {
  const sorted = [...(rpcRows || [])].sort((a, b) => Number(b.action_count) - Number(a.action_count))
  let rank = 0
  return sorted.map((r, i) => {
    const c = Number(r.action_count)
    if (i === 0 || c < Number(sorted[i - 1].action_count)) {
      rank = i + 1
    }
    return {
      actorId: r.actor_id,
      firstName: (r.first_name || '').trim() || 'Neighbor',
      unit: r.unit,
      actionCount: c,
      rank,
    }
  })
}

export function ordinalRank(n) {
  const abs = Math.abs(n) % 100
  const t = n % 10
  if (abs >= 11 && abs <= 13) return `${n}th`
  if (t === 1) return `${n}st`
  if (t === 2) return `${n}nd`
  if (t === 3) return `${n}rd`
  return `${n}th`
}

export function neighborsHelpedLabel(count) {
  const n = Number(count) || 0
  if (n === 1) return '1 neighbor helped'
  return `${n} neighbors helped`
}
