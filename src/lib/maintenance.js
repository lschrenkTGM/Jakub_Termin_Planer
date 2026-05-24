import { supabase } from './supabase.js'

const STORAGE_KEY = 'tp_last_maintenance'

function isMaintenanceDay() {
  const day = new Date().getDay()
  return day === 0 || day === 4 // Sonntag=0, Donnerstag=4
}

async function sendHeartbeat() {
  await supabase.from('appointments').select('id').limit(1)
}

async function purgeOldAppointments() {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 14)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  await supabase.from('appointments').delete().lt('date', cutoffStr)
}

export async function runMaintenance() {
  if (!isMaintenanceDay()) return

  const today = new Date().toISOString().slice(0, 10)
  if (localStorage.getItem(STORAGE_KEY) === today) return

  await sendHeartbeat()
  await purgeOldAppointments()
  localStorage.setItem(STORAGE_KEY, today)
}
