import { ref } from 'vue'
import { supabase } from '../lib/supabase.js'

const appointments = ref([])
const loading = ref(true)
let subscribed = false

async function load() {
  loading.value = true
  const { data } = await supabase
    .from('appointments')
    .select('*')
    .order('date')
    .order('time')
  if (data) appointments.value = data
  loading.value = false
}

function subscribe() {
  if (subscribed) return
  subscribed = true
  supabase
    .channel('appointments-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => load())
    .subscribe()
}

load()
subscribe()

export function useAppointments() {
  async function addAppointment(appt) {
    const { data } = await supabase.from('appointments').insert([{
      title:       appt.title,
      date:        appt.date,
      time:        appt.time,
      end_time:    appt.endTime || null,
      description: appt.description || null,
      location:    appt.location || null,
      color:       appt.color || '#1a73e8',
      created_by:  appt.created_by,
    }]).select().single()
    if (data) appointments.value.push(data)
  }

  async function updateAppointment(id, appt) {
    await supabase.from('appointments').update({
      title:       appt.title,
      date:        appt.date,
      time:        appt.time,
      end_time:    appt.endTime || null,
      description: appt.description || null,
      location:    appt.location || null,
      color:       appt.color || '#1a73e8',
    }).eq('id', id)
    await load()
  }

  async function deleteAppointment(id) {
    await supabase.from('appointments').delete().eq('id', id)
    appointments.value = appointments.value.filter(a => a.id !== id)
  }

  async function acceptAppointment(id, username) {
    await supabase.from('appointments').update({
      accepted_by: username,
      accepted_at: new Date().toISOString(),
    }).eq('id', id)
    await load()
  }

  async function unacceptAppointment(id) {
    await supabase.from('appointments').update({
      accepted_by: null,
      accepted_at: null,
    }).eq('id', id)
    await load()
  }

  function getForDate(dateStr) {
    return appointments.value
      .filter(a => a.date === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time))
  }

  function getCountForDate(dateStr) {
    return appointments.value.filter(a => a.date === dateStr).length
  }

  return {
    appointments, loading,
    addAppointment, updateAppointment, deleteAppointment,
    acceptAppointment, unacceptAppointment,
    getForDate, getCountForDate,
  }
}
