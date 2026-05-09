<template>
  <div class="calendar">
    <div class="cal-header">
      <div class="nav-group">
        <button class="nav-btn" @click="prev">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <h2 class="month-label">{{ monthLabel }}</h2>
        <button class="nav-btn" @click="next">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
      <button class="today-btn" @click="goToday">Heute</button>
    </div>

    <div class="weekdays">
      <span v-for="d in weekdays" :key="d">{{ d }}</span>
    </div>

    <div class="grid">
      <div
        v-for="cell in cells"
        :key="cell.key"
        class="day-cell"
        :class="{
          'other-month': !cell.current,
          'is-today': cell.isToday,
          'is-weekend': cell.isWeekend,
        }"
        @click="cell.current && $emit('selectDay', cell.dateStr)"
      >
        <div class="day-top">
          <span class="day-num">{{ cell.day }}</span>
        </div>
        <div v-if="cell.appts.length" class="event-list">
          <div
            v-for="a in cell.appts.slice(0, 3)"
            :key="a.id"
            class="event-chip"
            :style="{ background: a.color || '#1a73e8' }"
          >
            {{ a.time }} {{ a.title }}
          </div>
          <div v-if="cell.appts.length > 3" class="more-chip">
            +{{ cell.appts.length - 3 }} weitere
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppointments } from '../composables/useAppointments.js'

defineEmits(['selectDay'])

const { appointments } = useAppointments()

const today = new Date()
const current = ref({ year: today.getFullYear(), month: today.getMonth() })
const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

const monthLabel = computed(() =>
  new Date(current.value.year, current.value.month, 1)
    .toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
)

function getApptForDate(dateStr) {
  return appointments.value
    .filter(a => a.date === dateStr)
    .sort((a, b) => a.time.localeCompare(b.time))
}

const cells = computed(() => {
  const { year, month } = current.value
  const first = new Date(year, month, 1)
  const last  = new Date(year, month + 1, 0)
  const startPad = (first.getDay() + 6) % 7
  const endPad   = (7 - ((last.getDay() + 6) % 7 + 1)) % 7
  const items = []
  for (let i = startPad - 1; i >= 0; i--) items.push(makeCell(new Date(year, month, -i), false))
  for (let d = 1; d <= last.getDate(); d++) items.push(makeCell(new Date(year, month, d), true))
  for (let i = 1; i <= endPad; i++) items.push(makeCell(new Date(year, month + 1, i), false))
  return items
})

function makeCell(date, isCurrent) {
  const dateStr = toDateStr(date)
  const dow = date.getDay()
  return {
    key: dateStr, day: date.getDate(), dateStr, current: isCurrent,
    isToday: isCurrent && sameDay(date, today),
    isWeekend: dow === 0 || dow === 6,
    appts: isCurrent ? getApptForDate(dateStr) : [],
  }
}
function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function prev() {
  current.value = current.value.month === 0
    ? { year: current.value.year - 1, month: 11 }
    : { ...current.value, month: current.value.month - 1 }
}
function next() {
  current.value = current.value.month === 11
    ? { year: current.value.year + 1, month: 0 }
    : { ...current.value, month: current.value.month + 1 }
}
function goToday() { current.value = { year: today.getFullYear(), month: today.getMonth() } }
</script>

<style scoped>
.calendar { display: flex; flex-direction: column; height: 100%; background: var(--surface); }

.cal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.5rem; border-bottom: 1px solid var(--border); flex-shrink: 0;
}
.nav-group { display: flex; align-items: center; gap: 0.5rem; }
.month-label {
  font-family: var(--font-head); font-size: 1.2rem; font-weight: 800;
  color: var(--text); letter-spacing: -0.3px; min-width: 200px; text-align: center;
}
.nav-btn {
  width: 36px; height: 36px; border-radius: 50%; border: none;
  background: transparent; color: var(--text-2);
  display: flex; align-items: center; justify-content: center; transition: background 0.13s;
}
.nav-btn:hover { background: var(--bg); color: var(--text); }
.today-btn {
  padding: 0.45rem 1rem; border: 1.5px solid var(--border); border-radius: 20px;
  background: transparent; font-size: 0.85rem; font-weight: 600; color: var(--text-2);
  transition: all 0.13s;
}
.today-btn:hover { border-color: var(--blue); color: var(--blue); background: var(--blue-light); }

.weekdays { display: grid; grid-template-columns: repeat(7, 1fr); padding: 0.5rem 1rem 0; flex-shrink: 0; }
.weekdays span {
  text-align: center; font-size: 0.72rem; font-weight: 700;
  color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; padding: 0.3rem 0;
}

.grid {
  display: grid; grid-template-columns: repeat(7, 1fr); grid-auto-rows: 1fr;
  flex: 1; padding: 0.5rem 1rem 1rem; gap: 3px; overflow: hidden;
}
.day-cell {
  border-radius: var(--radius-s); padding: 0.4rem; display: flex;
  flex-direction: column; gap: 3px; cursor: pointer; transition: background 0.13s;
  overflow: hidden; min-height: 0; border: 1px solid transparent;
}
.day-cell:hover:not(.other-month) { background: var(--bg); border-color: var(--border); }
.other-month { opacity: 0.25; cursor: default; }
.is-weekend .day-num { color: var(--text-2); }
.day-top { display: flex; align-items: center; justify-content: center; }
.day-num {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.82rem; font-weight: 600; color: var(--text);
}
.is-today .day-num { background: var(--blue); color: #fff; font-weight: 700; }
.event-list { display: flex; flex-direction: column; gap: 2px; overflow: hidden; flex: 1; }
.event-chip {
  border-radius: 3px; padding: 1px 5px;
  font-size: 0.68rem; font-weight: 500; color: #fff;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.6;
}
.more-chip { font-size: 0.66rem; color: var(--text-2); font-weight: 600; padding: 0 5px; }
</style>
