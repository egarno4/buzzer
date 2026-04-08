import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
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
      .select('id,first_name,last_name,address,unit,email')
      .eq('id', userId)
      .maybeSingle()
    if (pErr || !p) {
      await supabase.auth.signOut()
      navigate('/', { replace: true })
      return
    }

    const user = { id: p.id, name: `${p.first_name} ${p.last_name}`.trim(), unit: p.unit, building: p.address, email: p.email }
    setProfile(user)

    const [{ data: pkgRows, error: pkgErr }, { data: reqRows, error: reqErr }, { data: neighborRows, error: neighborErr }] = await Promise.all([
      supabase.from('packages').select('*').eq('building_address', user.building).eq('from_unit', user.unit).order('created_at', { ascending: false }),
      supabase.from('requests').select('*').eq('building_address', user.building).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id,unit,first_name,last_name,status,address').eq('address', user.building).eq('status', 'approved').neq('id', user.id),
    ])

    if (pkgErr || reqErr || neighborErr) {
      setError(pkgErr?.message || reqErr?.message || neighborErr?.message || 'Could not load app data.')
      setLoading(false)
      return
    }

    setApprovedNeighbors((neighborRows || []).map((n) => ({ id: n.id, unit: n.unit, name: `${n.first_name || ''} ${n.last_name || ''}`.trim() || 'Neighbor' })))

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

    setMyPkgs((pkgRows || []).map((x) => ({ id: x.id, loggedBy: x.held_by_name, loggerUnit: x.held_by_unit, timestamp: x.created_at, status: x.status, note: x.note })))
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

    const { data: recipient } = await supabase.rpc('neighbor_contact_for_unit', {
      p_building: profile.building,
      p_unit: unit,
    })
    if (recipient?.email) {
      const result = await sendPackageSpottedEmail({
        to: recipient.email,
        firstName: recipient.first_name,
        buildingAddress: profile.building,
      })
      if (!result.ok) window.alert('Spotted alert saved, but notification email failed to send.')
    }

    setMyPkgs((p) => [{ id: crypto.randomUUID(), loggedBy: profile.name, loggerUnit: profile.unit, timestamp: new Date().toISOString(), status: 'waiting', note }, ...p])
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
    return true
  }, [profile])

  const volunteerForRequest = useCallback(async (id) => {
    if (!profile) return
    const { error: insErr } = await supabase.from('volunteers').insert({ request_id: id, unit: profile.unit, name: profile.name })
    if (insErr) {
      if (!String(insErr.message).includes('duplicate')) setError(insErr.message)
      return
    }
    setFeed((p) => p.map((x) => (x.id === id ? { ...x, volunteers: [...x.volunteers, { name: profile.name, unit: profile.unit }] } : x)))

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
    if (requester?.email) {
      const result = await sendVolunteerOfferedEmail({
        to: requester.email,
        firstName: requester.first_name,
        volunteerName: profile.name,
        volunteerUnit: profile.unit,
      })
      if (!result.ok) window.alert('Volunteer saved, but notification email failed to send.')
    }
  }, [profile])

  const chooseVolunteer = useCallback(async (id, v) => {
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
    if (!volunteer?.email) return
    const result = await sendVolunteerChosenEmail({
      to: volunteer.email,
      firstName: volunteer.first_name,
      requesterName: req.requester_name,
      requesterUnit: req.requester_unit,
    })
    if (!result.ok) window.alert('Volunteer chosen, but notification email failed to send.')
  }, [])

  return {
    sessionChecked,
    profile,
    myPkgs,
    feed,
    approvedNeighbors,
    loading,
    error,
    loadAll,
    dismissPackage,
    logPackage,
    createRequest,
    volunteerForRequest,
    chooseVolunteer,
    signOut: async () => {
      await supabase.auth.signOut()
      navigate('/')
    },
  }
}
