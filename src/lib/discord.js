const WEBHOOK_URL = 'https://discord.com/api/webhooks/1503712417300086885/KotK6CqeXwH4dYtIUeIig2GyUrY0bBIng1mTk_lxlWvjhmH1A6Lz12RRsi3PbiK8Piur'

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function buildUpcomingList(appointments) {
  const today = new Date().toISOString().slice(0, 10)
  return appointments
    .filter(a => a.date >= today && !a.recurring_group_id)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 6)
    .map(a => {
      const d = new Date(a.date + 'T00:00:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
      const status = a.accepted_by ? '✅' : '⏳'
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
