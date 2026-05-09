export const USERS = {
  Lukas: { password: 'Lukas', role: 'admin' },
  Jakub: { password: 'Jakub', role: 'acceptor' },
  Amel:  { password: 'Amel',  role: 'basic' },
  David: { password: 'David', role: 'basic' },
  Omar:  { password: 'Omar',  role: 'basic' },
}

export const PIN = '6767'

export function getRole(name) {
  return USERS[name]?.role ?? 'basic'
}

// Can the user edit/delete this appointment?
export function canEdit(username, appt) {
  const role = getRole(username)
  if (role === 'admin') return true
  return appt.created_by === username
}

// Can the user accept appointments?
export function canAccept(username) {
  const role = getRole(username)
  return role === 'admin' || role === 'acceptor'
}
