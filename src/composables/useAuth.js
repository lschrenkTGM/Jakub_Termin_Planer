import { ref } from 'vue'
import { supabase } from '../lib/supabase.js'

const users = ref([])

export async function loadUsers() {
  const { data } = await supabase.from('users').select('name, role, password')
  if (data) users.value = data
}

export async function verifyLogin(name, password) {
  const user = users.value.find(u => u.name === name && u.password === password)
  return user ?? null
}

export function getUsers() {
  return users
}
