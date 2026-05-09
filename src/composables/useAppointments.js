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
    if (appt.recurring) {
      const groupId = crypto.randomUUID()
      const rows = []
      const [y, mo, dy] = appt.date.split('-').map(Number)
      for (let i = 0; i < 52; i++) {
        const d = new Date(y, mo - 1, dy + i * 7)
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        rows.push({
          title:              appt.title,
          date:               dateStr,
          time:               appt.time,
          end_time:           appt.endTime || null,
          description:        appt.description || null,
          location:           appt.location || null,
          color:              appt.color || '#1a73e8',
          created_by:         appt.created_by,
          recurring_group_id: groupId,
        })
      }
      const { data } = await supabase.from('appointments').insert(rows).select()
      if (data) appointments.value.push(...data)
    } else {
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

  async function deleteRecurringGroup(groupId) {
    await supabase.from('appointments').delete().eq('recurring_group_id', groupId)
    appointments.value = appointments.value.filter(a => a.recurring_group_id !== groupId)
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
    addAppointment, updateAppointment, deleteAppointment, deleteRecurringGroup,
    acceptAppointment, unacceptAppointment,
    getForDate, getCountForDate,
  }
}
