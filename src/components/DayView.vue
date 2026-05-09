<template>
  <div class="day-view">
    <div class="dv-header">
      <button class="back-btn" @click="$emit('back')">
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
      <button class="add-btn" @click="openModal(null, null)">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
        <span>Termin</span>
      </button>
    </div>

    <div class="timeline" ref="timelineEl">
      <!-- Grid rows (click targets) -->
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

      <!-- Absolutely positioned events layer -->
      <div class="events-layer">
        <div
          v-for="appt in dayAppointments"
          :key="appt.id"
          class="event-block"
          :style="eventStyle(appt)"
          @click.stop
        >
          <div class="event-dot" :style="{ background: appt.color || '#1a73e8' }"></div>
          <div class="event-info">
            <div class="event-top-row">
              <span class="event-title">{{ appt.title }}</span>
              <span class="event-creator-badge">{{ appt.created_by }}</span>
            </div>
            <span class="event-time">
              {{ appt.time }}{{ appt.end_time ? ' – ' + appt.end_time : '' }}
              {{ appt.location ? ' · ' + appt.location : '' }}
            </span>
            <div v-if="appt.accepted_by" class="accepted-tag">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Akzeptiert von {{ appt.accepted_by }} · {{ formatAcceptedAt(appt.accepted_at) }}
            </div>
          </div>
          <div class="event-actions">
            <button
              v-if="canAccept(userRole) && !appt.accepted_by"
              class="action-btn accept-btn"
              title="Termin akzeptieren"
              @click.stop="handleAccept(appt.id)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button
              v-if="userRole === 'admin' && appt.accepted_by"
              class="action-btn unaccept-btn"
              title="Akzeptierung zurückziehen"
              @click.stop="handleUnaccept(appt.id)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <button
              v-if="canEdit(username, appt, userRole)"
              class="action-btn edit-btn"
              title="Bearbeiten"
              @click.stop="openModal(appt, null)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <AppointmentModal
      v-if="modal.open"
      :prefill-date="dateStr"
      :prefill-time="modal.prefillTime"
      :editing="modal.editing"
      :username="username"
      :user-role="userRole"
      @close="modal.open = false"
      @save="handleSave"
      @delete="handleDelete"
    />
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import AppointmentModal from './AppointmentModal.vue'
import { useAppointments } from '../composables/useAppointments.js'
import { canEdit, canAccept } from '../config/users.js'

const props = defineProps({ dateStr: String, username: String, userRole: String })
defineEmits(['back'])

const ROW_H = 60 // px per hour (must match CSS)
const LABEL_W = 64 // px label column width (must match CSS)

const { getForDate, addAppointment, updateAppointment, deleteAppointment, acceptAppointment, unacceptAppointment } = useAppointments()
const hours = Array.from({ length: 24 }, (_, i) => i)
const timelineEl = ref(null)

const dayAppointments = computed(() => getForDate(props.dateStr))

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

const modal = reactive({ open: false, editing: null, prefillTime: null })

function toMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + (m || 0)
}

function eventStyle(appt) {
  const startMin = toMinutes(appt.time)
  let endMin = appt.end_time ? toMinutes(appt.end_time) : startMin + 60
  const durationMin = Math.max(endMin - startMin, 30)
  return {
    top: `${startMin / 60 * ROW_H}px`,
    height: `${durationMin / 60 * ROW_H - 4}px`,
    borderLeftColor: appt.color || '#1a73e8',
    background: hexToRgba(appt.color || '#1a73e8', 0.08),
  }
}

function openModal(appt, time) {
  modal.editing = appt || null
  modal.prefillTime = time
  modal.open = true
}
async function handleSave(data) {
  if (modal.editing) await updateAppointment(modal.editing.id, data)
  else await addAppointment(data)
  modal.open = false
}
async function handleDelete(id) { await deleteAppointment(id); modal.open = false }
async function handleAccept(id) { await acceptAppointment(id, props.username) }
async function handleUnaccept(id) { await unacceptAppointment(id) }

function formatAcceptedAt(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return `rgba(${r},${g},${b},${alpha})`
}
</script>

<style scoped>
.day-view { display: flex; flex-direction: column; height: 100%; background: var(--surface); }

.dv-header {
  display: flex; align-items: center; gap: 1rem;
  padding: 0.9rem 1.5rem; border-bottom: 1px solid var(--border); flex-shrink: 0;
}
.back-btn {
  width: 38px; height: 38px; border-radius: 50%; border: none;
  background: transparent; color: var(--text-2);
  display: flex; align-items: center; justify-content: center; transition: background 0.13s;
}
.back-btn:hover { background: var(--bg); }
.dv-title-block { display: flex; align-items: center; gap: 1rem; flex: 1; }
.dv-date-badge { display: flex; flex-direction: column; align-items: center; }
.dv-weekday { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-3); }
.dv-day-num {
  width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
  font-family: var(--font-head); font-size: 1.2rem; font-weight: 800; color: var(--text); border-radius: 50%;
}
.dv-day-num.today { background: var(--blue); color: #fff; }
.dv-title { font-family: var(--font-head); font-size: 1rem; font-weight: 700; color: var(--text); margin: 0; }
.dv-sub { font-size: 0.75rem; color: var(--text-2); margin: 0; }
.add-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 0.55rem 1.1rem; background: var(--blue); color: #fff;
  border: none; border-radius: 20px; font-size: 0.85rem; font-weight: 600;
  box-shadow: 0 2px 6px rgba(26,115,232,.3); transition: background 0.13s, transform 0.1s; flex-shrink: 0;
}
.add-btn:hover { background: var(--blue-hover); transform: translateY(-1px); }

/* Timeline: scrollable, relative for event overlay */
.timeline { flex: 1; overflow-y: auto; position: relative; }

/* Grid layer */
.grid-layer { }
.hour-row {
  display: flex; align-items: flex-start;
  height: 60px; border-bottom: 1px solid #f1f3f4;
  cursor: pointer;
}
.hour-row:hover .slot-hint { opacity: 1; }
.hour-label {
  width: 64px; flex-shrink: 0;
  padding: 0.45rem 0.75rem 0;
  font-size: 0.7rem; font-weight: 600; color: var(--text-3); text-align: right; line-height: 1;
}
.hour-slot { flex: 1; padding: 0.4rem 0.75rem; }
.slot-hint { font-size: 0.72rem; color: var(--text-3); opacity: 0; transition: opacity 0.15s; }

/* Events overlay */
.events-layer {
  position: absolute;
  top: 0; left: 64px; right: 0;
  pointer-events: none;
}

.event-block {
  position: absolute;
  left: 8px; right: 8px;
  display: flex; align-items: flex-start; gap: 8px;
  padding: 0.35rem 0.65rem;
  border-left: 3px solid;
  border-radius: 0 var(--radius-s) var(--radius-s) 0;
  overflow: hidden;
  pointer-events: auto;
  cursor: default;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.event-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
.event-info { flex: 1; display: flex; flex-direction: column; gap: 2px; overflow: hidden; min-width: 0; }
.event-top-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.event-title { font-size: 0.85rem; font-weight: 600; color: var(--text); }
.event-creator-badge { font-size: 0.68rem; background: rgba(0,0,0,.07); border-radius: 20px; padding: 1px 7px; color: var(--text-2); white-space: nowrap; }
.event-time { font-size: 0.72rem; color: var(--text-2); }

.accepted-tag {
  display: flex; align-items: center; gap: 4px;
  font-size: 0.7rem; color: #34a853; font-weight: 600;
  background: #e6f4ea; border-radius: 20px;
  padding: 2px 8px; margin-top: 2px; width: fit-content;
}

.event-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
.action-btn {
  width: 28px; height: 28px; border-radius: 50%; border: none;
  display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.13s;
}
.accept-btn { background: #e6f4ea; color: #34a853; }
.accept-btn:hover { background: #ceead6; }
.unaccept-btn { background: #fce8e6; color: #ea4335; }
.unaccept-btn:hover { background: #fad2cf; }
.edit-btn { background: var(--blue-light); color: var(--blue); }
.edit-btn:hover { background: #d2e3fc; }

@media (max-width: 768px) {
  .dv-header { padding: 0.65rem 0.75rem; gap: 0.6rem; }
  .dv-title { font-size: 0.9rem; }
  .add-btn span { display: none; }
  .add-btn { padding: 0.55rem 0.75rem; border-radius: 50%; }
  .hour-row { height: 52px; }
  .hour-label { width: 46px; font-size: 0.62rem; padding: 0.4rem 0.4rem 0; }
  .hour-slot { padding: 0.3rem 0.5rem; }
  .slot-hint { display: none; }
  .events-layer { left: 46px; }
}
</style>
