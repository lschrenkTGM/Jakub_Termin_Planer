export const PIN = '6767'

export function getRole(name, usersFromDb = []) {
  return usersFromDb.find(u => u.name === name)?.role ?? 'basic'
}

export function canEdit(username, appt, role) {
  if (role === 'admin') return true
  return appt.created_by === username
}

export function canAccept(role) {
  return role === 'admin' || role === 'acceptor'
}
