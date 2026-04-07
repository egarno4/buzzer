import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function useMainAppRealtime({ profile, loadAll }) {
  useEffect(() => {
    if (!profile) return undefined

    const channel = supabase
      .channel(`main-app-realtime-${profile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => {
        void loadAll()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'volunteers' }, () => {
        void loadAll()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'packages' }, () => {
        void loadAll()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [profile, loadAll])
}
