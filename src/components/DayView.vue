<template>
  <div class="day-view">
    <!-- ── Header ── -->
    <div class="dv-header">
      <button class="back-btn" @click="$emit('back')" title="Zum Kalender">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <div class="dv-title-block">
        <div class="dv-date-badge">
          <span class="dv-weekday">{{ weekday }}</span>
          <span class="dv-day-num" :class="{ today: isToday }">{{ dayNum }}</span>
        </div>
        <div>
          <h2 class="dv-title">{{ monthYear }}</h2>
          <p class="dv-sub">{{ dayAppointments.length }} Termin{{ dayAppointments.length !== 1 ? 'e' : '' }}</p>
        </div>
      </div>

      <!-- Day navigation -->
      <div class="day-nav">
        <button class="nav-btn" @click="prevDay" title="Vorheriger Tag">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="nav-btn" @click="nextDay" title="Nächster Tag">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <button v-if="!isToday" class="today-jump-btn" @click="emit('navigate', todayDateStr)">Heute</button>
      <button class="add-btn" @click="openModal(null, null)">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
        <span>Termin</span>
      </button>
    </div>

    <div v-if="!loading && dayAppointments.length === 0" class="empty-day-notice">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" opacity=".5">
        <rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor" stroke-width="1.5"/>
        <path d="M3 9h18" stroke="currentColor" stroke-width="1.5"/>
        <path d="M8 2v4M16 2v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <span>Noch keine Termine · Klicke auf eine Uhrzeit zum Hinzufügen</span>
    </div>

    <!-- ── Timeline ── -->
    <div class="timeline" ref="timelineEl">
      <div class="grid-layer">
        <div
          v-for="hour in hours"
          :key="hour"
          class="hour-row"
          @click="openModal(null, String(hour).padStart(2,'0') + ':00')"
        >
          <span class="hour-label">{{ String(hour).padStart(2,'0') }}:00</span>
          <div class="hour-slot">
            <div class="slot-hint">+ Termin hinzufügen</div>
          </div>
        </div>
      </div>

      <div class="events-layer">
        <div
          v-for="appt in dayAppointments"
          :key="appt.id"
          class="event-block"
          :class="{ 'event-rejected': appt.rejected_by, 'event-suggestion': appt.is_suggestion && !appt.accepted_by }"
          :style="eventStyle(appt)"
          @click.stop="openDetail(appt)"
        >
          <div class="event-dot" :style="{ background: appt.color || '#1a73e8' }"></div>
          <div class="event-info">
            <div class="event-top-row">
              <span class="event-title">{{ appt.title }}</span>
              <svg v-if="appt.recurring_group_id" class="recur-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" title="Wiederkehrend">
                <path d="M17 2l4 4-4 4M3 11V9a4 4 0 014-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="event-creator-badge">{{ appt.created_by }}</span>
            </div>
            <span class="event-time">
              {{ appt.time }}{{ appt.end_time ? ' – ' + appt.end_time : '' }}
              {{ appt.location ? ' · ' + appt.location : '' }}
            </span>
            <div v-if="appt.rejected_by" class="rejected-tag">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Abgelehnt
            </div>
            <div v-else-if="appt.is_suggestion && !appt.accepted_by" class="suggestion-tag">💡 Vorschlag</div>
            <div v-else-if="appt.accepted_by" class="accepted-tag">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              {{ appt.accepted_by }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="currentTimeTop !== null" class="current-time-line" :style="{ top: currentTimeTop + 'px' }">
        <span class="ctl-dot"></span>
        <span class="ctl-rule"></span>
      </div>
    </div>

    <!-- ── Detail Sheet ── -->
    <div v-if="detail" class="detail-backdrop" @click.self="detail = null">
      <div class="detail-sheet">
        <!-- color bar -->
        <div class="detail-color-bar" :style="{ background: detail.color || '#1a73e8' }"></div>

        <div class="detail-body">
          <div class="detail-header-row">
            <h2 class="detail-title">{{ detail.title }}</h2>
            <button class="detail-close" @click="detail = null">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="detail-meta">
            <!-- Date & Time -->
            <div class="detail-row">
              <div class="detail-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor" stroke-width="1.8"/>
                  <path d="M3 9h18" stroke="currentColor" stroke-width="1.8"/>
                  <path d="M8 2v4M16 2v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="detail-row-text">
                <span class="detail-val">{{ formatDetailDate(dateStr) }}</span>
                <span class="detail-sub">{{ detail.time }}{{ detail.end_time ? ' – ' + detail.end_time : '' }}</span>
              </div>
            </div>

            <!-- Location -->
            <div v-if="detail.location" class="detail-row">
              <div class="detail-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" stroke-width="1.8"/>
                  <circle cx="12" cy="9" r="2.5" stroke="currentColor" stroke-width="1.8"/>
                </svg>
              </div>
              <span class="detail-val">{{ detail.location }}</span>
            </div>

            <!-- Description -->
            <div v-if="detail.description" class="detail-row">
              <div class="detail-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h16M4 10h16M4 14h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </div>
              <span class="detail-val detail-desc">{{ detail.description }}</span>
            </div>

            <!-- Created by -->
            <div class="detail-row">
              <div class="detail-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8"/>
                  <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="detail-row-text">
                <span class="detail-val">{{ detail.created_by }}</span>
                <span class="detail-sub">Erstellt von</span>
              </div>
            </div>

            <!-- Recurring -->
            <div v-if="detail.recurring_group_id" class="detail-row">
              <div class="detail-icon recurring-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M17 2l4 4-4 4M3 11V9a4 4 0 014-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <span class="detail-val">Wöchentlich wiederkehrend</span>
            </div>

            <!-- Accepted -->
            <div v-if="detail.accepted_by" class="detail-row">
              <div class="detail-icon accepted-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="detail-row-text">
                <span class="detail-val accepted-val">Akzeptiert von {{ detail.accepted_by }}</span>
                <span class="detail-sub">{{ formatAcceptedAt(detail.accepted_at) }}</span>
              </div>
            </div>

            <!-- Rejected -->
            <div v-if="detail.rejected_by" class="detail-row">
              <div class="detail-icon rejected-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="detail-row-text">
                <span class="detail-val rejected-val">Abgelehnt von {{ detail.rejected_by }}</span>
                <span class="detail-sub">{{ formatAcceptedAt(detail.rejected_at) }}</span>
                <span v-if="detail.rejection_reason" class="detail-sub detail-reason">{{ detail.rejection_reason }}</span>
              </div>
            </div>

            <!-- Is suggestion -->
            <div v-if="detail.is_suggestion && !detail.accepted_by" class="detail-row">
              <div class="detail-icon suggestion-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/>
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="detail-row-text">
                <span class="detail-val suggestion-val">Gegenvorschlag</span>
                <span v-if="detail.suggestion_note" class="detail-sub">Als Ersatz für: {{ detail.suggestion_note }}</span>
              </div>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="detail-actions">
            <button
              v-if="detail.recurring_group_id && canEdit(username, detail, userRole)"
              class="detail-btn btn-delete-series"
              @click="doDeleteSeries"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M17 2l4 4-4 4M3 11V9a4 4 0 014-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Serie löschen
            </button>
            <button
              v-if="canAccept(userRole) && !detail.accepted_by && !detail.rejected_by"
              class="detail-btn btn-accept"
              @click="doAccept"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Akzeptieren
            </button>
            <button
              v-if="userRole === 'admin' && detail.accepted_by"
              class="detail-btn btn-unaccept"
              @click="doUnaccept"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Akzeptierung zurückziehen
            </button>
            <template v-if="!detail.rejected_by && !rejecting">
              <button
                v-if="canReject(username, detail, userRole)"
                class="detail-btn btn-reject"
                @click="rejecting = true"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                Ablehnen
              </button>
            </template>
            <template v-if="rejecting">
              <div class="reject-inline">
                <textarea
                  v-model="rejectionNote"
                  class="reject-reason-input"
                  placeholder="Ablehnungsgrund (optional)…"
                  rows="2"
                />
                <div class="reject-confirm-row">
                  <button class="detail-btn btn-cancel-reject" @click="rejecting = false; rejectionNote = ''">Abbrechen</button>
                  <button class="detail-btn btn-confirm-reject" @click="doReject">Bestätigen</button>
                </div>
              </div>
            </template>
            <button
              v-if="detail.rejected_by && !rejecting"
              class="detail-btn btn-suggest"
              @click="startSuggestion"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Gegenvorschlag machen
            </button>
            <button
              v-if="canEdit(username, detail, userRole) && !detail.rejected_by"
              class="detail-btn btn-edit"
              @click="editFromDetail"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
              Bearbeiten
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Edit/Create Modal ── -->
    <AppointmentModal
      v-if="modal.open"
      :prefill-date="modal.prefillData?.date || dateStr"
      :prefill-time="modal.prefillData?.time || modal.prefillTime"
      :prefill-data="modal.prefillData"
      :editing="modal.editing"
      :suggestion-mode="modal.suggestionMode"
      :username="username"
      :user-role="userRole"
      @close="modal.open = false; modal.suggestionMode = false; suggestionForAppt = null"
      @save="handleSave"
      @delete="handleDelete"
      @delete-series="handleDeleteSeries"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, nextTick, reactive, ref, watch } from 'vue'
import AppointmentModal from './AppointmentModal.vue'
import { useAppointments } from '../composables/useAppointments.js'
import { useToast } from '../composables/useToast.js'
import { canEdit, canAccept, canReject } from '../config/users.js'

const props = defineProps({ dateStr: String, username: String, userRole: String })
const emit = defineEmits(['back', 'navigate'])

const ROW_H = 60 // px per hour — must match CSS .hour-row height

const { appointments, getForDate, loading, addAppointment, updateAppointment, deleteAppointment, deleteRecurringGroup, acceptAppointment, unacceptAppointment, rejectAppointment } = useAppointments()
const { show: showToast } = useToast()
const hours = Array.from({ length: 24 }, (_, i) => i)

const timelineEl = ref(null)
const now = ref(new Date())
let timeInterval = null

const dayAppointments = computed(() => getForDate(props.dateStr))

// ── Date helpers ──────────────────────────────────────────────────────────────

const d = computed(() => new Date(props.dateStr + 'T00:00:00'))
const today = new Date()
const isToday = computed(() =>
  d.value.getFullYear() === today.getFullYear() &&
  d.value.getMonth() === today.getMonth() &&
  d.value.getDate() === today.getDate()
)
const weekday   = computed(() => d.value.toLocaleDateString('de-DE', { weekday: 'short' }))
const dayNum    = computed(() => d.value.getDate())
const monthYear = computed(() => d.value.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }))

function shiftDay(delta) {
  const dt = new Date(props.dateStr + 'T00:00:00')
  dt.setDate(dt.getDate() + delta)
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const d = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
function prevDay() { emit('navigate', shiftDay(-1)) }
function nextDay() { emit('navigate', shiftDay(+1)) }

function formatDetailDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const todayDateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

const currentTimeTop = computed(() => {
  if (!isToday.value) return null
  return (now.value.getHours() * 60 + now.value.getMinutes()) / 60 * ROW_H
})

function scrollToNow() {
  if (!timelineEl.value) return
  const min = now.value.getHours() * 60 + now.value.getMinutes()
  timelineEl.value.scrollTop = Math.max(0, (min / 60 * ROW_H) - 150)
}

onMounted(() => {
  if (isToday.value) {
    timeInterval = setInterval(() => { now.value = new Date() }, 60000)
    nextTick(scrollToNow)
  }
  const escHandler = (e) => { if (e.key === 'Escape') detail.value = null }
  window.addEventListener('keydown', escHandler)
  onUnmounted(() => window.removeEventListener('keydown', escHandler))
})

watch(() => props.dateStr, () => {
  clearInterval(timeInterval)
  if (isToday.value) {
    now.value = new Date()
    timeInterval = setInterval(() => { now.value = new Date() }, 60000)
    nextTick(scrollToNow)
  }
})

onUnmounted(() => clearInterval(timeInterval))

// ── Time helpers ──────────────────────────────────────────────────────────────

function toMin(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + (m || 0)
}

function apptRange(appt) {
  const start = toMin(appt.time)
  let end = appt.end_time ? toMin(appt.end_time) : start + 60
  if (end <= start) end += 24 * 60
  end = Math.min(end, Math.min(start + 24 * 60, 1440))
  return { start, end }
}

// ── Column layout ─────────────────────────────────────────────────────────────

const columnLayout = computed(() => {
  const appts = dayAppointments.value
  if (!appts.length) return {}
  const sorted = [...appts].sort((a, b) => toMin(a.time) - toMin(b.time))
  const colEnds = []
  const placement = {}
  for (const appt of sorted) {
    const { start, end } = apptRange(appt)
    let placed = -1
    for (let c = 0; c < colEnds.length; c++) {
      if (colEnds[c] <= start) { placed = c; break }
    }
    if (placed === -1) { placed = colEnds.length; colEnds.push(0) }
    colEnds[placed] = end
    placement[appt.id] = { col: placed }
  }
  const result = {}
  for (const appt of sorted) {
    const { start, end } = apptRange(appt)
    let maxCol = placement[appt.id].col
    for (const other of sorted) {
      if (other.id === appt.id) continue
      const { start: os, end: oe } = apptRange(other)
      if (os < end && oe > start) maxCol = Math.max(maxCol, placement[other.id].col)
    }
    result[appt.id] = { col: placement[appt.id].col, totalCols: maxCol + 1 }
  }
  return result
})

function eventStyle(appt) {
  const { start, end } = apptRange(appt)
  const durationMin = Math.max(end - start, 30)
  const { col = 0, totalCols = 1 } = columnLayout.value[appt.id] || {}
  const gutter = 4
  const pct = 100 / totalCols
  return {
    top: `${start / 60 * ROW_H}px`,
    height: `${durationMin / 60 * ROW_H - 3}px`,
    left: `calc(${col * pct}% + ${gutter / 2}px)`,
    width: `calc(${pct}% - ${gutter}px)`,
    borderLeftColor: appt.color || '#1a73e8',
    background: hexToRgba(appt.color || '#1a73e8', 0.13),
  }
}

// ── Detail sheet ──────────────────────────────────────────────────────────────

const detail = ref(null)
const rejecting = ref(false)
const rejectionNote = ref('')
const suggestionForAppt = ref(null)

function openDetail(appt) {
  detail.value = appt
  rejecting.value = false
  rejectionNote.value = ''
}

async function doAccept() {
  const id = detail.value.id
  await acceptAppointment(id, props.username)
  detail.value = appointments.value.find(a => a.id === id) || null
  showToast('Termin akzeptiert')
}
async function doUnaccept() {
  const id = detail.value.id
  await unacceptAppointment(id)
  detail.value = appointments.value.find(a => a.id === id) || null
  showToast('Akzeptierung zurückgezogen', 'info')
}
async function doReject() {
  const id = detail.value.id
  await rejectAppointment(id, props.username, rejectionNote.value || null)
  rejecting.value = false
  rejectionNote.value = ''
  detail.value = appointments.value.find(a => a.id === id) || null
  showToast('Termin abgelehnt', 'info')
}
function startSuggestion() {
  suggestionForAppt.value = detail.value
  detail.value = null
  modal.editing = null
  modal.prefillData = suggestionForAppt.value
  modal.suggestionMode = true
  modal.prefillTime = null
  modal.open = true
}
function editFromDetail() {
  const appt = detail.value
  detail.value = null
  openModal(appt, null)
}

async function doDeleteSeries() {
  if (!confirm('Alle Termine dieser Serie löschen?')) return
  await deleteRecurringGroup(detail.value.recurring_group_id)
  detail.value = null
  showToast('Serie gelöscht', 'info')
}

// ── Modal ─────────────────────────────────────────────────────────────────────

const modal = reactive({ open: false, editing: null, prefillTime: null, prefillData: null, suggestionMode: false })

function openModal(appt, time) {
  modal.editing = appt || null
  modal.prefillTime = time
  modal.prefillData = null
  modal.suggestionMode = false
  modal.open = true
}
async function handleSave(data) {
  const wasEditing = !!modal.editing
  const isSuggestion = modal.suggestionMode
  if (modal.editing) {
    await updateAppointment(modal.editing.id, data)
  } else if (isSuggestion) {
    await addAppointment({
      ...data,
      is_suggestion: true,
      suggestion_note: suggestionForAppt.value?.title || null,
    })
    suggestionForAppt.value = null
  } else {
    await addAppointment(data)
  }
  modal.open = false
  modal.suggestionMode = false
  showToast(wasEditing ? 'Termin gespeichert' : isSuggestion ? 'Vorschlag gemacht' : 'Termin erstellt')
}
async function handleDelete(id) {
  await deleteAppointment(id)
  modal.open = false
  detail.value = null
  showToast('Termin gelöscht', 'info')
}

async function handleDeleteSeries(groupId) {
  if (!confirm('Alle Termine dieser Serie löschen?')) return
  await deleteRecurringGroup(groupId)
  modal.open = false
  detail.value = null
  showToast('Serie gelöscht', 'info')
}

async function handleAccept(id) { await acceptAppointment(id, props.username) }
async function handleUnaccept(id) { await unacceptAppointment(id) }

function formatAcceptedAt(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return `rgba(${r},${g},${b},${alpha})`
}
</script>

<style scoped>
.day-view { display: flex; flex-direction: column; height: 100%; background: var(--surface); position: relative; }

/* ── Header ── */
.dv-header {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.9rem 1.5rem; border-bottom: 1px solid var(--border); flex-shrink: 0;
}
.back-btn {
  width: 38px; height: 38px; border-radius: 50%; border: none;
  background: transparent; color: var(--text-2);
  display: flex; align-items: center; justify-content: center; transition: background 0.13s; flex-shrink: 0;
}
.back-btn:hover { background: var(--bg); }
.dv-title-block { display: flex; align-items: center; gap: 1rem; flex: 1; min-width: 0; }
.dv-date-badge { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
.dv-weekday { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-3); }
.dv-day-num {
  width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
  font-family: var(--font-head); font-size: 1.2rem; font-weight: 800; color: var(--text); border-radius: 50%;
}
.dv-day-num.today { background: var(--blue); color: #fff; }
.dv-title { font-family: var(--font-head); font-size: 1rem; font-weight: 700; color: var(--text); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dv-sub { font-size: 0.75rem; color: var(--text-2); margin: 0; }

.day-nav { display: flex; gap: 2px; flex-shrink: 0; }
.nav-btn {
  width: 34px; height: 34px; border-radius: 50%; border: none;
  background: transparent; color: var(--text-2);
  display: flex; align-items: center; justify-content: center; transition: background 0.13s;
}
.nav-btn:hover { background: var(--bg); color: var(--text); }

.add-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 0.55rem 1.1rem; background: var(--blue); color: #fff;
  border: none; border-radius: 20px; font-size: 0.85rem; font-weight: 600;
  box-shadow: 0 2px 6px rgba(26,115,232,.3); transition: background 0.13s, transform 0.1s; flex-shrink: 0;
}
.add-btn:hover { background: var(--blue-hover); transform: translateY(-1px); }

/* ── Timeline ── */
.timeline { flex: 1; overflow-y: auto; overflow-x: hidden; position: relative; }

.hour-row {
  display: flex; align-items: flex-start;
  height: 60px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}
.hour-row:hover .slot-hint { opacity: 1; }
.hour-label {
  width: 64px; flex-shrink: 0;
  padding: 0.4rem 0.75rem 0;
  font-size: 0.7rem; font-weight: 600; color: var(--text-3); text-align: right; line-height: 1;
}
.hour-slot { flex: 1; padding: 0.3rem 0.5rem; }
.slot-hint { font-size: 0.72rem; color: var(--text-3); opacity: 0; transition: opacity 0.15s; pointer-events: none; }

.events-layer {
  position: absolute; top: 0; left: 64px; right: 0;
  pointer-events: none; padding: 0 6px;
}
.event-block {
  position: absolute; box-sizing: border-box;
  display: flex; align-items: flex-start; gap: 6px;
  padding: 0.3rem 0.5rem;
  border-left: 3px solid; border-radius: 0 6px 6px 0;
  overflow: hidden; pointer-events: auto; cursor: pointer;
  box-shadow: 0 1px 4px rgba(0,0,0,0.09); min-width: 0;
  transition: filter 0.12s, box-shadow 0.12s;
}
.event-block:hover { filter: brightness(0.96); box-shadow: 0 2px 8px rgba(0,0,0,0.14); }
.event-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
.event-info { flex: 1; display: flex; flex-direction: column; gap: 1px; overflow: hidden; min-width: 0; }
.event-top-row { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; min-width: 0; }
.event-title { font-size: 0.82rem; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.event-creator-badge { font-size: 0.65rem; background: var(--color-badge-bg); border-radius: 20px; padding: 1px 6px; color: var(--text-2); white-space: nowrap; flex-shrink: 0; }
.event-time { font-size: 0.68rem; color: var(--text-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.accepted-tag {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 0.62rem; color: var(--color-accepted-fg); font-weight: 600;
  background: var(--color-accepted-bg); border-radius: 20px; padding: 1px 5px; width: fit-content;
}
.rejected-tag {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 0.62rem; color: var(--color-error-fg); font-weight: 600;
  background: var(--color-error-bg); border-radius: 20px; padding: 1px 5px; width: fit-content;
}
.suggestion-tag {
  font-size: 0.62rem; color: #e65100; font-weight: 600;
  background: #fff3e0; border-radius: 20px; padding: 1px 5px; width: fit-content;
}
.event-block.event-rejected { opacity: 0.45; }
.event-block.event-rejected .event-title { text-decoration: line-through; }
.event-block.event-suggestion { border-left-style: dashed; }
.recur-icon { color: var(--text-3); flex-shrink: 0; }

/* ── Detail Sheet ── */
.detail-backdrop {
  position: absolute; inset: 0; z-index: 50;
  background: rgba(0,0,0,.55);
  display: flex; align-items: flex-end;
  animation: backdropIn 0.18s ease;
}
@keyframes backdropIn { from { opacity: 0; } to { opacity: 1; } }

.detail-sheet {
  width: 100%; max-height: 85%;
  background: var(--surface);
  border-radius: 20px 20px 0 0;
  overflow: hidden;
  display: flex; flex-direction: column;
  animation: sheetUp 0.25s cubic-bezier(0.16,1,0.3,1);
  box-shadow: 0 -4px 24px rgba(0,0,0,0.12);
}
@keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

.detail-color-bar { height: 5px; flex-shrink: 0; }

.detail-body { padding: 1.25rem 1.5rem 1.5rem; overflow-y: auto; }

.detail-header-row {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem;
  margin-bottom: 1.1rem;
}
.detail-title {
  font-family: var(--font-head); font-size: 1.25rem; font-weight: 800;
  color: var(--text); margin: 0; flex: 1; line-height: 1.3;
}
.detail-close {
  width: 32px; height: 32px; border-radius: 50%; border: none;
  background: var(--bg); color: var(--text-2); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  transition: background 0.13s;
}
.detail-close:hover { background: var(--border); }

.detail-meta { display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 1.25rem; }
.detail-row { display: flex; align-items: flex-start; gap: 0.85rem; }
.detail-icon {
  width: 32px; height: 32px; border-radius: 8px; background: var(--bg);
  display: flex; align-items: center; justify-content: center;
  color: var(--text-2); flex-shrink: 0;
}
.accepted-icon { background: var(--color-accepted-bg); color: var(--color-accepted-fg); }
.rejected-icon { background: var(--color-error-bg); color: var(--color-error-fg); }
.suggestion-icon { background: #fff3e0; color: #e65100; }
.recurring-icon { background: var(--color-recurring-bg); color: var(--color-recurring-fg); }
.detail-row-text { display: flex; flex-direction: column; gap: 1px; }
.detail-val { font-size: 0.9rem; font-weight: 500; color: var(--text); }
.detail-sub { font-size: 0.75rem; color: var(--text-2); }
.detail-reason { font-style: italic; }
.detail-desc { white-space: pre-wrap; line-height: 1.5; }
.accepted-val { color: var(--color-accepted-fg); font-weight: 600; }
.rejected-val { color: var(--color-error-fg); font-weight: 600; }
.suggestion-val { color: #e65100; font-weight: 600; }

.detail-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.detail-btn {
  display: flex; align-items: center; gap: 7px;
  padding: 0.6rem 1.1rem; border: none; border-radius: 20px;
  font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.13s;
}
.btn-accept { background: var(--color-accepted-bg); color: var(--color-accepted-fg); }
.btn-accept:hover { filter: brightness(0.92); }
.btn-unaccept { background: var(--color-error-bg); color: var(--color-error-fg); }
.btn-unaccept:hover { background: var(--color-error-hover); }
.btn-edit { background: var(--blue-light); color: var(--blue); }
.btn-edit:hover { filter: brightness(0.92); }
.btn-delete-series { background: var(--color-error-bg); color: var(--color-error-fg); }
.btn-delete-series:hover { background: var(--color-error-hover); }
.btn-reject { background: var(--color-error-bg); color: var(--color-error-fg); }
.btn-reject:hover { background: var(--color-error-hover); }
.btn-suggest { background: #fff3e0; color: #e65100; }
.btn-suggest:hover { filter: brightness(0.92); }
.reject-inline { display: flex; flex-direction: column; gap: 0.5rem; width: 100%; }
.reject-reason-input {
  width: 100%; padding: 0.6rem 0.75rem; border-radius: var(--radius-s);
  border: 1.5px solid var(--color-error-fg); background: var(--bg);
  color: var(--text); font-size: 0.85rem; resize: none; font-family: var(--font-body);
  outline: none;
}
.reject-confirm-row { display: flex; gap: 0.5rem; }
.btn-cancel-reject { background: var(--bg); color: var(--text-2); }
.btn-cancel-reject:hover { background: var(--border); }
.btn-confirm-reject { background: var(--color-error-fg); color: #fff; }
.btn-confirm-reject:hover { filter: brightness(0.88); }

/* ── Current time indicator ── */
.current-time-line {
  position: absolute; left: 0; right: 6px; z-index: 10; pointer-events: none;
  display: flex; align-items: center;
}
.ctl-dot {
  width: 10px; height: 10px; border-radius: 50%; background: #ea4335;
  flex-shrink: 0; margin-left: 58px;
}
.ctl-rule { flex: 1; height: 1.5px; background: #ea4335; opacity: .8; }

/* ── Empty day notice ── */
.empty-day-notice {
  display: flex; align-items: center; gap: 10px;
  padding: .6rem 1.5rem; border-bottom: 1px solid var(--border);
  background: var(--bg); color: var(--text-3); font-size: .8rem; flex-shrink: 0;
}

/* ── Today jump button ── */
.today-jump-btn {
  padding: .4rem .9rem; border: 1.5px solid var(--border); border-radius: 20px;
  background: transparent; font-size: .82rem; font-weight: 600; color: var(--text-2);
  transition: all .13s; flex-shrink: 0;
}
.today-jump-btn:hover { border-color: var(--blue); color: var(--blue); background: var(--blue-light); }

/* ── Mobile ── */
@media (max-width: 768px) {
  .dv-header { padding: 0.65rem 0.75rem; gap: 0.5rem; }
  .dv-title { font-size: 0.88rem; }
  .add-btn span { display: none; }
  .add-btn { padding: 0.55rem 0.75rem; border-radius: 50%; }
  .hour-label { width: 46px; font-size: 0.6rem; padding: 0.35rem 0.4rem 0; }
  .hour-slot { padding: 0.2rem 0.4rem; }
  .slot-hint { display: none; }
  .events-layer { left: 46px; padding: 0 3px; }
  .event-block { padding: 0.3rem 0.5rem; gap: 4px; border-radius: 0 8px 8px 0; }
  .event-block:active { filter: brightness(0.85); }
  .event-title { font-size: 0.78rem; }
  .event-time { font-size: 0.65rem; }
  .event-creator-badge { display: none; }
  .detail-body { padding: 1rem 1.1rem 1.25rem; }
  .detail-title { font-size: 1.1rem; }
  .detail-btn { font-size: 0.82rem; padding: 0.55rem 1rem; }
  .today-jump-btn { display: none; }
  .ctl-dot { margin-left: 40px; }
  .empty-day-notice { padding: .5rem .75rem; font-size: .76rem; }
}
</style>
