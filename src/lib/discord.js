const WEBHOOK_URL = '***REMOVED***'

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function buildUpcomingList(appointments) {
  const today = new Date().toISOString().slice(0, 10)
  return appointments
    .filter(a => a.date >= today && !a.recurring_group_id && !a.rejected_by)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 6)
    .map(a => {
      const d = new Date(a.date + 'T00:00:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
      const status = a.accepted_by ? '✅' : (a.is_suggestion ? '💡' : '⏳')
      return `${status} **${a.title}** · ${d} ${a.time}`
    })
    .join('\n')
}

async function post(body) {
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    // silently ignore network errors
  }
}

export async function sendNewAppointment(appt, allAppointments) {
  if (appt.recurring_group_id) return

  const fields = [
    { name: '📆 Datum', value: formatDate(appt.date), inline: true },
    { name: '⏰ Uhrzeit', value: appt.time + (appt.end_time ? ` – ${appt.end_time}` : ''), inline: true },
    { name: '👤 Erstellt von', value: appt.created_by || 'Unbekannt', inline: true },
  ]
  if (appt.location) fields.push({ name: '📍 Ort', value: appt.location, inline: true })
  if (appt.description) fields.push({ name: '📝 Beschreibung', value: appt.description })

  const upcoming = buildUpcomingList(allAppointments)
  if (upcoming) fields.push({ name: '📋 Nächste Termine', value: upcoming })

  await post({
    content: '<@700819386100875345> neuer Termin',
    embeds: [{
      title: '📅 Neuer Termin',
      description: `**${appt.title}**`,
      color: parseInt((appt.color || '#1a73e8').replace('#', ''), 16),
      fields,
      footer: { text: '⚠️ Noch nicht akzeptiert' },
      timestamp: new Date().toISOString(),
    }],
  })
}

export async function sendAppointmentAccepted(appt, username) {
  if (appt.recurring_group_id) return

  await post({
    embeds: [{
      title: '✅ Termin akzeptiert',
      description: `**${appt.title}**`,
      color: 0x34a853,
      fields: [
        { name: '📆 Datum', value: formatDate(appt.date), inline: true },
        { name: '⏰ Uhrzeit', value: appt.time + (appt.end_time ? ` – ${appt.end_time}` : ''), inline: true },
        { name: '✓ Akzeptiert von', value: username, inline: true },
      ],
      timestamp: new Date().toISOString(),
    }],
  })
}

export async function sendAppointmentRejected(appt, username, reason) {
  const fields = [
    { name: '📆 Datum', value: formatDate(appt.date), inline: true },
    { name: '⏰ Uhrzeit', value: appt.time + (appt.end_time ? ` – ${appt.end_time}` : ''), inline: true },
    { name: '❌ Abgelehnt von', value: username, inline: true },
  ]
  if (reason) fields.push({ name: '💬 Grund', value: reason })
  fields.push({ name: '💡 Tipp', value: 'Gegenvorschlag im Terminplaner einreichen!' })

  await post({
    content: '<@700819386100875345> Termin abgelehnt',
    embeds: [{
      title: '❌ Termin abgelehnt',
      description: `**${appt.title}**`,
      color: 0xea4335,
      fields,
      timestamp: new Date().toISOString(),
    }],
  })
}

export async function sendAppointmentSuggested(newAppt, originalTitle, username) {
  const fields = [
    { name: '📆 Datum', value: formatDate(newAppt.date), inline: true },
    { name: '⏰ Uhrzeit', value: newAppt.time + (newAppt.end_time ? ` – ${newAppt.end_time}` : ''), inline: true },
    { name: '👤 Vorgeschlagen von', value: username, inline: true },
  ]
  if (originalTitle) fields.push({ name: '🔄 Als Ersatz für', value: originalTitle })

  await post({
    content: '<@700819386100875345> neuer Terminvorschlag',
    embeds: [{
      title: '💡 Terminvorschlag',
      description: `**${newAppt.title}**`,
      color: 0xff9800,
      fields,
      footer: { text: 'Im Terminplaner bestätigen oder ablehnen' },
      timestamp: new Date().toISOString(),
    }],
  })
}

export async function sendGamingReminderIfNeeded(allAppointments) {
  const COOLDOWN_KEY = 'tp_gaming_reminder_last'
  const COOLDOWN_DAYS = 4

  const lastSent = localStorage.getItem(COOLDOWN_KEY)
  if (lastSent) {
    const daysSince = (Date.now() - new Date(lastSent).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince < COOLDOWN_DAYS) return
  }

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  const busyDays = new Set(
    allAppointments
      .filter(a => !a.recurring_group_id && !a.rejected_by && a.date >= todayStr)
      .map(a => a.date)
  )

  const freeDays = []
  for (let i = 1; i <= 8; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    if (!busyDays.has(dateStr)) freeDays.push(d)
  }

  // Only send if 3+ free days to avoid spamming when it's obvious
  if (freeDays.length < 3) return

  const freeList = freeDays.slice(0, 4)
    .map(d => d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'short' }))
    .join('\n')

  await post({
    content: '<@700819386100875345>',
    embeds: [{
      title: '🎮 Gaming-Abend planen?',
      description: 'In den nächsten Tagen ist noch viel frei — wäre ein Gaming-Abend drin?',
      color: 0x9c27b0,
      fields: [
        { name: '📅 Freie Tage', value: freeList },
        { name: '💡', value: 'Einfach im Terminplaner eintragen wenn gewünscht!' },
      ],
      timestamp: new Date().toISOString(),
    }],
  })

  localStorage.setItem(COOLDOWN_KEY, new Date().toISOString())
}
