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
        Termin
      </button>
    </div>

    <div class="timeline">
      <div v-for="hour in hours" :key="hour" class="hour-row">
        <span class="hour-label">{{ String(hour).padStart(2,'0') }}:00</span>
        <div class="hour-slot" @click="openModal(null, String(hour).padStart(2,'00') + ':00')">
          <div
            v-for="appt in getApptForHour(hour)"
            :key="appt.id"
            class="event-block"
            :style="{ borderLeftColor: appt.color || '#1a73e8', background: hexToRgba(appt.color || '#1a73e8', 0.08) }"
            @click.stop="openModal(appt, null)"
          >
            <div class="event-dot" :style="{ background: appt.color || '#1a73e8' }"></div>
            <div class="event-info">
              <span class="event-title">{{ appt.title }}</span>
              <span class="event-time">
                {{ appt.time }}{{ appt.end_time ? ' – ' + appt.end_time : '' }}
                {{ appt.location ? ' · ' + appt.location : '' }}
              </span>
            </div>
            <span class="event-creator">{{ appt.created_by }}</span>
          </div>
          <div v-if="!getApptForHour(hour).length" class="slot-hint">+ Termin hinzufügen</div>
        </div>
      </div>
    </div>

    <AppointmentModal
      v-if="modal.open"
      :prefill-date="dateStr"
      :prefill-time="modal.prefillTime"
      :editing="modal.editing"
      :username="username"
      @close="modal.open = false"
      @save="handleSave"
      @delete="handleDelete"
    />
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue'
import AppointmentModal from './AppointmentModal.vue'
import { useAppointments } from '../composables/useAppointments.js'

const props = defineProps({ dateStr: String, username: String })
defineEmits(['back'])

const { getForDate, addAppointment, updateAppointment, deleteAppointment } = useAppointments()
const hours = Array.from({ length: 24 }, (_, i) => i)

const dayAppointments = computed(() => getForDate(props.dateStr))
const getApptForHour = (h) => dayAppointments.value.filter(a => parseInt(a.time.split(':')[0]) === h)

const d = computed(() => new Date(props.dateStr + 'T00:00:00'))
const today = new Date()
const isToday = computed(() =>
  d.value.getFullYear() === today.getFullYear() &&
  d.value.getMonth() === today.getMonth() &&
  d.value.getDate() === today.getDate()
)
const weekday  = computed(() => d.value.toLocaleDateString('de-DE', { weekday: 'short' }))
const dayNum   = computed(() => d.value.getDate())
const monthYear = computed(() => d.value.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }))

const modal = reactive({ open: false, editing: null, prefillTime: null })

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
async function handleDelete(id) {
  await deleteAppointment(id)
  modal.open = false
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
  padding: 0.9rem 1.5rem;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.back-btn {
  width: 38px; height: 38px; border-radius: 50%; border: none;
  background: transparent; color: var(--text-2);
  display: flex; align-items: center; justify-content: center;
  transition: background 0.13s;
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
  box-shadow: 0 2px 6px rgba(26,115,232,.3); transition: background 0.13s, transform 0.1s;
  flex-shrink: 0;
}
.add-btn:hover { background: var(--blue-hover); transform: translateY(-1px); }

.timeline { flex: 1; overflow-y: auto; }
.hour-row { display: flex; align-items: stretch; min-height: 60px; border-bottom: 1px solid #f1f3f4; }
.hour-label {
  width: 64px; flex-shrink: 0;
  padding: 0.65rem 0.75rem 0 0.75rem;
  font-size: 0.7rem; font-weight: 600; color: var(--text-3); text-align: right; line-height: 1;
}
.hour-slot {
  flex: 1; padding: 0.4rem 1rem 0.4rem 0.75rem;
  cursor: pointer; display: flex; flex-direction: column; gap: 4px;
  transition: background 0.1s;
}
.hour-slot:hover { background: #fafbff; }
.hour-slot:hover .slot-hint { opacity: 1; }
.slot-hint { font-size: 0.72rem; color: var(--text-3); opacity: 0; transition: opacity 0.15s; pointer-events: none; }

.event-block {
  display: flex; align-items: center; gap: 8px;
  padding: 0.45rem 0.65rem;
  border-left: 3px solid; border-radius: 0 var(--radius-s) var(--radius-s) 0;
  cursor: pointer; transition: filter 0.13s;
}
.event-block:hover { filter: brightness(0.96); }
.event-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.event-info { flex: 1; display: flex; flex-direction: column; gap: 1px; overflow: hidden; }
.event-title { font-size: 0.85rem; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.event-time { font-size: 0.72rem; color: var(--text-2); }
.event-creator {
  font-size: 0.68rem; font-weight: 600; color: var(--text-3);
  background: rgba(0,0,0,.06); border-radius: 20px; padding: 2px 7px; white-space: nowrap;
}
</style>
