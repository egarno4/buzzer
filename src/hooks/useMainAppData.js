import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  sendHelpRequestedEmail,
  sendPackageCollectedEmail,
  sendPackageSpottedEmail,
  sendVolunteerChosenEmail,
  sendVolunteerOfferedEmail,
} from '../lib/sendEmail'

export default function useMainAppData(navigate) {
  const [sessionChecked, setSessionChecked] = useState(false)
  const [profile, setProfile] = useState(null)
  const [myPkgs, setMyPkgs] = useState([])
  const [feed, setFeed] = useState([])
  const [approvedNeighbors, setApprovedNeighbors] = useState([])
  const [ambientOtherNeighborCount, setAmbientOtherNeighborCount] = useState(null)
  const ambientNeighborSnapshotDoneRef = useRef(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    async function verifySessionFirst() {
      const { data: s } = await supabase.auth.getSession()
      if (!live) return
      if (!s.session?.user?.id) {
        navigate('/', { replace: true })
        return
      }
      setSessionChecked(true)
    }
    void verifySessionFirst()
    return () => {
      live = false
    }
  }, [navigate])

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data: s } = await supabase.auth.getSession()
    const userId = s.session?.user?.id
    if (!userId) {
      navigate('/', { replace: true })
      return
    }
    const { data: p, error: pErr } = await supabase
      .from('profiles')
      .select('id,first_name,last_name,address,unit,email,email_notifications,status')
      .eq('id', userId)
      .maybeSingle()
    if (pErr || !p) {
      await supabase.auth.signOut()
      navigate('/', { replace: true })
      return
    }

    if (p.status !== 'approved') {
      navigate('/onboarding/pending', { replace: true })
      return
    }

    const user = {
      id: p.id,
      name: `${p.first_name} ${p.last_name}`.trim(),
      unit: p.unit,
      building: p.address,
      email: p.email,
      emailNotifications: p.email_notifications !== false,
    }
    setProfile(user)

    const myUnit = String(user.unit).trim()
    const [{ data: pkgRows, error: pkgErr }, { data: reqRows, error: reqErr }, { data: neighborRows, error: neighborErr }] = await Promise.all([
      supabase
        .from('packages')
        .select('*')
        .eq('building_address', user.building)
        .eq('from_unit', myUnit)
        .order('created_at', { ascending: false }),
      supabase
        .from('requests')
        .select('*')
        .eq('building_address', user.building)
        .neq('status', 'collected')
        .order('created_at', { ascending: false }),
      supabase.rpc('get_building_neighbors', { p_building: user.building }),
    ])

    if (pkgErr || reqErr || neighborErr) {
      setError(pkgErr?.message || reqErr?.message || neighborErr?.message || 'Could not load app data.')
      setLoading(false)
      return
    }

    setApprovedNeighbors(
      (neighborRows || []).map((n, i) => ({
        id: `${n.unit}|${i}`,
        unit: n.unit,
        name: (n.first_name || '').trim() || 'Neighbor',
      })),
    )

    if (!ambientNeighborSnapshotDoneRef.current) {
      ambientNeighborSnapshotDoneRef.current = true
      setAmbientOtherNeighborCount((neighborRows || []).length)
    }

    const requestIds = (reqRows || []).map((r) => r.id)
    let volunteerMap = {}
    if (requestIds.length > 0) {
      const { data: volRows } = await supabase.from('volunteers').select('request_id,unit,name,created_at').in('request_id', requestIds).order('created_at', { ascending: true })
      volunteerMap = (volRows || []).reduce((acc, v) => {
        acc[v.request_id] = acc[v.request_id] || []
        acc[v.request_id].push({ unit: v.unit, name: v.name })
        return acc
      }, {})
    }

    // My Packages = recipient only (this building + my unit). Never show rows I logged as spotter.
    const recipientOnly = (pkgRows || []).filter((row) => row.created_by !== user.id)
    setMyPkgs(
      recipientOnly.map((x) => ({
        id: x.id,
        loggedBy: x.held_by_name,
        loggerUnit: x.held_by_unit,
        timestamp: x.created_at,
        status: x.status,
        note: x.note,
      })),
    )
    setFeed((reqRows || []).map((x) => ({ id: x.id, requester: x.requester_name, requesterUnit: x.requester_unit, timestamp: x.created_at, note: x.note, volunteers: volunteerMap[x.id] || [], status: x.status, chosenVolunteer: x.chosen_volunteer_name ? { name: x.chosen_volunteer_name, unit: x.chosen_volunteer_unit } : null })))
    setLoading(false)
  }, [navigate])

  useEffect(() => {
    if (!sessionChecked) return
    void loadAll()
  }, [sessionChecked, loadAll])

  const dismissPackage = useCallback(async (id) => {
    setMyPkgs((p) => p.filter((x) => x.id !== id))
    const { error: uErr } = await supabase.from('packages').update({ status: 'dismissed' }).eq('id', id)
    if (uErr) setError(uErr.message)
  }, [])

  const logPackage = useCallback(async ({ unit, note }) => {
    if (!profile) return false
    const { error: insErr } = await supabase.from('packages').insert({
      building_address: profile.building,
      from_unit: unit,
      held_by_unit: profile.unit,
      held_by_name: profile.name,
      note: note || null,
      status: 'waiting',
      created_by: profile.id,
    })
    if (insErr) {
      setError(insErr.message)
      return false
    }

    const { error: naErr } = await supabase.from('neighbor_actions').insert({
      actor_id: profile.id,
      action_type: 'package_spotted',
      building_address: profile.building,
    })
    if (naErr) {
      console.warn('neighbor_actions package_spotted:', naErr.message)
    }

    const { data: recipient } = await supabase.rpc('neighbor_contact_for_unit', {
      p_building: profile.building,
      p_unit: unit,
    })
    if (recipient?.email && recipient.email_notifications !== false) {
      const result = await sendPackageSpottedEmail({
        to: recipient.email,
        firstName: recipient.first_name,
        loggerUnit: profile.unit,
      })
      if (!result.ok) window.alert('Spotted alert saved, but notification email failed to send.')
    }

    // Do not add to myPkgs here — spotter is not the recipient; recipient sees it after loadAll/realtime.
    return true
  }, [profile])

  const createRequest = useCallback(async ({ note }) => {
    if (!profile) return false
    const { data: row, error: insErr } = await supabase.from('requests').insert({
      building_address: profile.building,
      requester_unit: profile.unit,
      requester_name: profile.name,
      note,
      status: 'open',
      created_by: profile.id,
    }).select('*').single()
    if (insErr) {
      setError(insErr.message)
      return false
    }
    setFeed((p) => [{ id: row.id, requester: row.requester_name, requesterUnit: row.requester_unit, timestamp: row.created_at, note: row.note, volunteers: [], status: row.status, chosenVolunteer: null }, ...p])

    const { data: recipients, error: recErr } = await supabase.rpc('get_building_neighbor_emails_for_notifications', {
      p_building: profile.building,
    })
    if (recErr) {
      setError(recErr.message)
    } else {
      let anyFailed = false
      for (const rec of recipients || []) {
        const to = String(rec?.email || '').trim()
        if (!to) continue
        const result = await sendHelpRequestedEmail({
          to,
          firstName: rec.first_name || '',
          requesterName: row.requester_name,
          requesterUnit: row.requester_unit,
          address: profile.building,
          note: row.note || '',
        })
        if (!result.ok) anyFailed = true
      }
      if (anyFailed) window.alert('Your post is live, but some neighbor notification emails failed to send.')
    }
    return true
  }, [profile])

  const volunteerForRequest = useCallback(async (id) => {
    if (!profile) return
    // Being chosen as holder (package_held) is logged when the requester picks a volunteer (DB trigger on requests).
    // Must match profiles row exactly (RLS: unit + trim(first || ' ' || last)).
    const unit = String(profile.unit).trim()
    const name = String(profile.name).trim()
    const { error: insErr } = await supabase.from('volunteers').insert({ request_id: id, unit, name })
    if (insErr) {
      if (!String(insErr.message).includes('duplicate')) setError(insErr.message)
      return
    }
    setFeed((p) => p.map((x) => (x.id === id ? { ...x, volunteers: [...x.volunteers, { name, unit }] } : x)))

    const { data: req } = await supabase
      .from('requests')
      .select('building_address, requester_unit')
      .eq('id', id)
      .maybeSingle()
    if (!req) return
    const { data: requester } = await supabase.rpc('neighbor_contact_for_unit', {
      p_building: req.building_address,
      p_unit: req.requester_unit,
    })
    if (requester?.email && requester.email_notifications !== false) {
      const result = await sendVolunteerOfferedEmail({
        to: requester.email,
        firstName: requester.first_name,
        volunteerName: name,
        volunteerUnit: unit,
        requestId: id,
      })
      if (!result.ok) window.alert('Volunteer saved, but notification email failed to send.')
    }
  }, [profile])

  const chooseVolunteer = useCallback(async (id, v) => {
    // package_held neighbor_actions row is inserted by DB trigger trg_requests_neighbor_action_package_held
    // when status transitions to claimed (see supabase/schema.sql).
    const { error: upErr } = await supabase.from('requests').update({
      status: 'claimed',
      chosen_volunteer_name: v.name,
      chosen_volunteer_unit: v.unit,
    }).eq('id', id)
    if (upErr) {
      setError(upErr.message)
      return
    }
    setFeed((p) => p.map((x) => (x.id === id ? { ...x, status: 'claimed', chosenVolunteer: v } : x)))

    const { data: req } = await supabase
      .from('requests')
      .select('building_address, requester_name, requester_unit')
      .eq('id', id)
      .maybeSingle()
    if (!req) return
    const { data: volunteer } = await supabase.rpc('neighbor_contact_for_unit', {
      p_building: req.building_address,
      p_unit: v.unit,
    })
    if (!volunteer?.email || volunteer.email_notifications === false) return
    const result = await sendVolunteerChosenEmail({
      to: volunteer.email,
      firstName: volunteer.first_name,
      requesterName: req.requester_name,
      requesterUnit: req.requester_unit,
    })
    if (!result.ok) window.alert('Volunteer chosen, but notification email failed to send.')
  }, [])

  const markRequestCollected = useCallback(async (id) => {
    const { data: req, error: selErr } = await supabase
      .from('requests')
      .select('building_address, requester_name, chosen_volunteer_unit, status')
      .eq('id', id)
      .maybeSingle()
    if (selErr || !req) {
      if (selErr) setError(selErr.message)
      return
    }
    if (req.status !== 'claimed' || !req.chosen_volunteer_unit) {
      setError('That request is not ready to mark as collected.')
      return
    }

    const { error: upErr } = await supabase.from('requests').update({ status: 'collected' }).eq('id', id).eq('status', 'claimed')
    if (upErr) {
      setError(upErr.message)
      return
    }
    setFeed((p) => p.filter((x) => x.id !== id))

    const volUnit = String(req.chosen_volunteer_unit).trim()
    const { data: holder } = await supabase.rpc('neighbor_contact_for_unit', {
      p_building: req.building_address,
      p_unit: volUnit,
    })
    if (holder?.email && holder.email_notifications !== false) {
      const result = await sendPackageCollectedEmail({
        to: holder.email,
        firstName: holder.first_name,
        collectorName: req.requester_name,
      })
      if (!result.ok) window.alert('Marked as collected, but we could not email the neighbor who held it.')
    }
  }, [])

  const updateEmailNotifications = useCallback(async (enabled) => {
    if (!profile) return false
    const { error: uErr } = await supabase
      .from('profiles')
      .update({ email_notifications: enabled })
      .eq('id', profile.id)
    if (uErr) {
      setError(uErr.message)
      return false
    }
    setProfile((prev) => (prev ? { ...prev, emailNotifications: enabled } : null))
    return true
  }, [profile])

  const deleteAccount = useCallback(async () => {
    if (!profile) return { ok: false, error: 'No profile.' }
    const userId = profile.id

    const { data: proofFiles, error: listErr } = await supabase.storage.from('proofs').list(userId, { limit: 200 })
    if (listErr) return { ok: false, error: listErr.message }
    if (proofFiles?.length) {
      const paths = proofFiles.map((f) => `${userId}/${f.name}`)
      const { error: rmErr } = await supabase.storage.from('proofs').remove(paths)
      if (rmErr) return { ok: false, error: rmErr.message }
    }

    const { error: pkgErr } = await supabase.from('packages').delete().eq('created_by', userId)
    if (pkgErr) return { ok: false, error: pkgErr.message }

    const { error: naErr } = await supabase.from('neighbor_actions').delete().eq('actor_id', userId)
    if (naErr) return { ok: false, error: naErr.message }

    const { error: reqErr } = await supabase.from('requests').delete().eq('created_by', userId)
    if (reqErr) return { ok: false, error: reqErr.message }

    const { error: profErr } = await supabase.from('profiles').delete().eq('id', userId)
    if (profErr) return { ok: false, error: profErr.message }

    await supabase.auth.signOut()
    navigate('/', { replace: true })
    return { ok: true }
  }, [profile, navigate])

  return {
    sessionChecked,
    profile,
    myPkgs,
    feed,
    approvedNeighbors,
    ambientOtherNeighborCount,
    loading,
    error,
    loadAll,
    dismissPackage,
    logPackage,
    createRequest,
    volunteerForRequest,
    chooseVolunteer,
    markRequestCollected,
    updateEmailNotifications,
    deleteAccount,
    signOut: async () => {
      await supabase.auth.signOut()
      navigate('/')
    },
  }
}
