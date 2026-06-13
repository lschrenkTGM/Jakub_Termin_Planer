<template>
  <LoginScreen v-if="!username" @login="handleLogin" />

  <div v-else class="app">

    <!-- ── DESKTOP SIDEBAR ── -->
    <aside class="sidebar">
      <div class="sidebar-top">
        <div class="brand-row">
          <div class="brand" @click="selectedDay = null" style="cursor:pointer">
            <div class="brand-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="17" rx="3" stroke="#1a73e8" stroke-width="2"/>
                <path d="M3 9h18" stroke="#1a73e8" stroke-width="2"/>
                <path d="M8 2v4M16 2v4" stroke="#1a73e8" stroke-width="2" stroke-linecap="round"/>
                <rect x="7" y="13" width="3" height="3" rx="0.5" fill="#1a73e8"/>
                <rect x="11" y="13" width="3" height="3" rx="0.5" fill="#34a853"/>
              </svg>
            </div>
            <span class="brand-name">Terminplaner</span>
          </div>
          <button class="theme-btn" @click="toggleTheme" :title="dark ? 'Hellmodus' : 'Dunkelmodus'">
            <svg v-if="dark" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
              <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <button class="create-btn" @click="openGlobalModal">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
          Erstellen
        </button>
      </div>

      <div class="user-card" @click="logout" title="Abmelden">
        <div class="user-avatar">{{ username[0].toUpperCase() }}</div>
        <div class="user-info">
          <span class="user-name">{{ username }}</span>
          <span class="user-sub">Klicken zum Abmelden</span>
        </div>
      </div>

      <div class="upcoming-section">
        <h3 class="section-title">Bevorstehend</h3>
        <div class="person-filter">
          <button class="person-chip" :class="{ active: selectedPerson === null }" @click="selectedPerson = null">Alle</button>
          <button
            v-for="p in upcomingPersons"
            :key="p"
            class="person-chip"
            :class="{ active: selectedPerson === p }"
            @click="selectedPerson = p"
          >{{ p }}</button>
        </div>
        <div v-if="loading" class="loading-hint">Lade Termine…</div>
        <div v-else-if="upcoming.length === 0" class="empty-state">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" opacity=".3">
            <rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor" stroke-width="1.5"/>
            <path d="M3 9h18" stroke="currentColor" stroke-width="1.5"/>
          </svg>
          <span>Keine Termine</span>
        </div>
        <div v-for="appt in upcoming" :key="appt.id" class="upcoming-item" @click="selectDay(appt.date)">
          <div class="up-dot" :style="{ background: appt.color || '#1a73e8' }"></div>
          <div class="up-content">
            <span class="up-title">{{ appt.title }}</span>
            <span class="up-meta">{{ formatUpDate(appt.date) }} · {{ appt.time }} · {{ appt.created_by }}</span>
            <span v-if="appt.accepted_by" class="up-accepted">✓ {{ appt.accepted_by }}</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- ── MOBILE HEADER ── -->
    <header class="mobile-header">
      <div class="mh-brand" @click="selectedDay = null; upcomingDrawer = false" style="cursor:pointer">
        <div class="brand-icon-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="17" rx="3" stroke="#1a73e8" stroke-width="2"/>
            <path d="M3 9h18" stroke="#1a73e8" stroke-width="2"/>
          </svg>
        </div>
        <div class="mh-brand-text">
          <span class="mh-title">Terminplaner</span>
          <span class="mh-date">{{ todayLabel }}</span>
        </div>
      </div>
      <div class="mh-right">
        <button class="theme-btn-sm" @click="toggleTheme" :title="dark ? 'Hellmodus' : 'Dunkelmodus'">
          <svg v-if="dark" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
            <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <span v-if="loading" class="mh-loading">●</span>
        <div class="user-avatar-sm" @click="logout" title="Abmelden">{{ username[0].toUpperCase() }}</div>
      </div>
    </header>

    <!-- ── MAIN CONTENT ── -->
    <main class="main">
      <DayView v-if="selectedDay" :date-str="selectedDay" :username="username" :user-role="userRole" @back="selectedDay = null" @navigate="selectedDay = $event" />
      <MonthCalendar v-else @select-day="selectDay" />
    </main>

    <!-- ── MOBILE BOTTOM NAV ── -->
    <nav class="bottom-nav">
      <button class="bn-item" :class="{ active: !selectedDay && !upcomingDrawer }" @click="selectedDay = null; upcomingDrawer = false">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor" stroke-width="1.8"/>
          <path d="M3 9h18" stroke="currentColor" stroke-width="1.8"/>
          <path d="M8 2v4M16 2v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
        <span>Kalender</span>
      </button>
      <button class="bn-fab" @click="openGlobalModal">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </button>
      <button class="bn-item" :class="{ active: upcomingDrawer }" @click="upcomingDrawer = true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" stroke-width="1.8"/>
          <path d="M9 12h6M9 16h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
        <span>Termine</span>
      </button>
    </nav>

    <AppointmentModal
      v-if="globalModal"
      :username="username"
      @close="globalModal = false"
      @save="handleGlobalSave"
      @delete="handleGlobalDelete"
      @delete-series="handleGlobalDeleteSeries"
    />
  </div>

  <!-- Drawer OUTSIDE .app to avoid overflow clipping -->
  <TransitionGroup v-if="username" tag="div" name="toast" class="toast-container">
    <div v-for="t in toasts" :key="t.id" class="toast">
      <span class="toast-dot" :class="'dot-' + t.type"></span>
      {{ t.msg }}
    </div>
  </TransitionGroup>

  <div v-if="username && upcomingDrawer" class="drawer-backdrop" @click.self="upcomingDrawer = false">
    <div class="drawer">
      <div class="drawer-handle"></div>
      <div class="drawer-header">
        <h3>Nächste Termine</h3>
        <button class="drawer-close" @click="upcomingDrawer = false">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div class="drawer-person-filter">
        <button class="person-chip" :class="{ active: selectedPerson === null }" @click="selectedPerson = null">Alle</button>
        <button
          v-for="p in upcomingPersons"
          :key="p"
          class="person-chip"
          :class="{ active: selectedPerson === p }"
          @click="selectedPerson = p"
        >{{ p }}</button>
      </div>
      <div class="drawer-body">
        <div v-if="loading" class="drawer-loading">Lade Termine…</div>
        <div v-else-if="upcoming.length === 0" class="drawer-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" opacity=".25">
            <rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor" stroke-width="1.5"/>
            <path d="M3 9h18" stroke="currentColor" stroke-width="1.5"/>
          </svg>
          <span>Keine bevorstehenden Termine</span>
        </div>
        <div
          v-for="appt in upcoming"
          :key="appt.id"
          class="drawer-item"
          @click="selectDay(appt.date); upcomingDrawer = false"
        >
          <div class="drawer-dot" :style="{ background: appt.color || '#1a73e8' }"></div>
          <div class="drawer-item-info">
            <span class="drawer-item-title">{{ appt.title }}</span>
            <span class="drawer-item-meta">{{ formatUpDate(appt.date) }} · {{ appt.time }} · {{ appt.created_by }}</span>
            <span v-if="appt.accepted_by" class="drawer-accepted">✓ Akzeptiert von {{ appt.accepted_by }}</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="drawer-arrow">
            <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import LoginScreen from './components/LoginScreen.vue'
import MonthCalendar from './components/MonthCalendar.vue'
import DayView from './components/DayView.vue'
import AppointmentModal from './components/AppointmentModal.vue'
import { useAppointments } from './composables/useAppointments.js'
import { useToast } from './composables/useToast.js'
import { loadUsers, verifyLogin } from './composables/useAuth.js'
import { useTheme } from './composables/useTheme.js'
import { runMaintenance } from './lib/maintenance.js'
import { sendGamingReminderIfNeeded } from './lib/discord.js'

const { dark, toggle: toggleTheme, init: initTheme } = useTheme()

const username = ref('')
const userRole = ref('')

onMounted(async () => {
  initTheme()
  runMaintenance()
  const storedUser = sessionStorage.getItem('tp_user')
  const storedPass = sessionStorage.getItem('tp_pass')
  if (storedUser && storedPass) {
    await loadUsers()
    const user = await verifyLogin(storedUser, storedPass)
    if (user) {
      username.value = user.name
      userRole.value = user.role
    } else {
      sessionStorage.clear()
    }
  }
})

function handleLogin({ name, role, password }) {
  sessionStorage.setItem('tp_user', name)
  sessionStorage.setItem('tp_role', role)
  sessionStorage.setItem('tp_pass', password)
  username.value = name
  userRole.value = role
}
function logout() {
  if (!confirm(`Als "${username.value}" abmelden?`)) return
  sessionStorage.clear()
  username.value = ''
  userRole.value = ''
  selectedDay.value = null
}

const { appointments, loading, addAppointment, deleteAppointment, deleteRecurringGroup } = useAppointments()

// Gaming-Reminder: einmalig senden wenn Termine geladen und User eingeloggt
let reminderSent = false
watch([loading, username], ([isLoading, user]) => {
  if (!isLoading && user && !reminderSent) {
    reminderSent = true
    sendGamingReminderIfNeeded(appointments.value)
  }
})
const { toasts, show: showToast } = useToast()

const selectedDay = ref(null)
const globalModal = ref(false)
const upcomingDrawer = ref(false)
const selectedPerson = ref(null)
function selectDay(d) { selectedDay.value = d }

const todayStr = new Date().toISOString().slice(0, 10)
const todayLabel = new Date().toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })

const upcomingPersons = computed(() => {
  const persons = appointments.value
    .filter(a => a.date >= todayStr && !a.recurring_group_id && !a.rejected_by)
    .map(a => a.created_by)
    .filter(Boolean)
  return [...new Set(persons)].sort()
})

const upcoming = computed(() => {
  let list = appointments.value.filter(a => a.date >= todayStr && !a.recurring_group_id && !a.rejected_by)
  if (selectedPerson.value) list = list.filter(a => a.created_by === selectedPerson.value)
  return list
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 15)
})

function formatUpDate(dateStr) {
  if (dateStr === todayStr) return 'Heute'
  const tom = new Date(); tom.setDate(tom.getDate() + 1)
  if (dateStr === tom.toISOString().slice(0, 10)) return 'Morgen'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
}

function goToday() { selectedDay.value = todayStr }
function openGlobalModal() { globalModal.value = true }
async function handleGlobalSave(data) { await addAppointment(data); globalModal.value = false; showToast('Termin erstellt') }
async function handleGlobalDelete(id) { await deleteAppointment(id); globalModal.value = false; showToast('Termin gelöscht', 'info') }
async function handleGlobalDeleteSeries(groupId) {
  if (!confirm('Alle Termine dieser Serie löschen?')) return
  await deleteRecurringGroup(groupId)
  globalModal.value = false
  showToast('Serie gelöscht', 'info')
}
</script>

<style scoped>
.app { display: flex; height: 100vh; overflow: hidden; }

/* ── Toasts ── */
.toast-container {
  position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%);
  z-index: 9999; display: flex; flex-direction: column; gap: 8px; align-items: center;
  pointer-events: none;
}
.toast {
  background: #1e2028; color: #e8eaed;
  padding: .6rem 1.2rem; border-radius: 10px;
  font-size: .87rem; font-weight: 500;
  box-shadow: 0 4px 20px rgba(0,0,0,.4);
  display: flex; align-items: center; gap: 9px;
  white-space: nowrap;
}
.toast-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.dot-success { background: #4eca6e; }
.dot-info { background: #9aa0ab; }
.dot-error { background: #f28b82; }
.toast-enter-active { transition: all .22s cubic-bezier(.16,1,.3,1); }
.toast-leave-active { transition: all .18s ease; }
.toast-enter-from { opacity: 0; transform: translateY(14px) scale(.95); }
.toast-leave-to { opacity: 0; transform: translateY(-6px); }

/* ── SIDEBAR (desktop only) ── */
.sidebar {
  width: 268px; flex-shrink: 0;
  background: var(--surface); border-right: 1px solid var(--border);
  display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden;
}
.sidebar-top { padding: 1.25rem 1rem 1rem; display: flex; flex-direction: column; gap: 1rem; }
.brand-row { display: flex; align-items: center; justify-content: space-between; }
.brand { display: flex; align-items: center; gap: 10px; padding: 0 4px; }
.theme-btn {
  width: 34px; height: 34px; border-radius: 50%; border: none;
  background: var(--bg); color: var(--text-2);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.13s, color 0.13s; flex-shrink: 0;
}
.theme-btn:hover { background: var(--border); color: var(--text); }
.brand-icon { width: 38px; height: 38px; background: var(--blue-light); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.brand-name { font-family: var(--font-head); font-size: 1.1rem; font-weight: 800; color: var(--text); letter-spacing: -0.3px; }
.create-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 0.7rem 1.25rem; background: var(--blue); color: #fff;
  border: none; border-radius: 24px; font-size: 0.9rem; font-weight: 600;
  box-shadow: 0 2px 8px rgba(26,115,232,.3);
  transition: background 0.15s, transform 0.1s;
}
.create-btn:hover { background: var(--blue-hover); transform: translateY(-1px); }
.user-card {
  display: flex; align-items: center; gap: 10px;
  padding: 0.75rem 1.25rem; margin: 0 0.5rem;
  border-radius: var(--radius-m); cursor: pointer; transition: background 0.15s;
}
.user-card:hover { background: var(--blue-light); }
.user-avatar {
  width: 36px; height: 36px; background: var(--blue); border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-family: var(--font-head); font-size: 0.9rem; font-weight: 800; flex-shrink: 0;
}
.user-info { display: flex; flex-direction: column; gap: 1px; overflow: hidden; }
.user-name { font-size: 0.9rem; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-sub { font-size: 0.72rem; color: var(--text-3); }
.upcoming-section { flex: 1; padding: 0 0.75rem 1rem; margin-top: 0.5rem; }
.section-title { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-3); padding: 0.5rem 0.5rem 0.4rem; }
.person-filter { display: flex; flex-wrap: wrap; gap: 5px; padding: 0 0.25rem 0.6rem; }
.person-chip {
  padding: 0.25rem 0.7rem; border-radius: 20px; border: 1.5px solid var(--border);
  background: transparent; font-size: 0.75rem; font-weight: 600; color: var(--text-2);
  cursor: pointer; transition: all 0.13s;
}
.person-chip:hover { border-color: var(--blue); color: var(--blue); }
.person-chip.active { background: var(--blue); border-color: var(--blue); color: #fff; }
.loading-hint { font-size: 0.8rem; color: var(--text-3); padding: 0.5rem; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 1.5rem 0; color: var(--text-3); font-size: 0.8rem; }
.upcoming-item { display: flex; align-items: flex-start; gap: 10px; padding: 0.6rem 0.75rem; border-radius: var(--radius-s); cursor: pointer; transition: background 0.13s; margin-bottom: 2px; }
.upcoming-item:hover { background: var(--bg); }
.up-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
.up-content { display: flex; flex-direction: column; gap: 1px; overflow: hidden; }
.up-title { font-size: 0.88rem; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.up-meta { font-size: 0.72rem; color: var(--text-2); }
.up-accepted { font-size: 0.68rem; color: #34a853; font-weight: 700; }

/* ── UPCOMING DRAWER (always available, shown via v-if) ── */
.drawer-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.6);
  z-index: 100;
  display: flex; align-items: flex-end;
  animation: backdropIn 0.2s ease;
}
@keyframes backdropIn { from { opacity: 0; } to { opacity: 1; } }

.drawer {
  width: 100%;
  background: var(--surface);
  border-radius: 20px 20px 0 0;
  max-height: 92vh;
  display: flex; flex-direction: column;
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
  animation: drawerUp 0.3s cubic-bezier(0.16,1,0.3,1);
}
@keyframes drawerUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

.drawer-handle {
  width: 36px; height: 4px; background: var(--border);
  border-radius: 2px; margin: 12px auto 0; flex-shrink: 0;
}
.drawer-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.25rem 0.5rem; flex-shrink: 0;
}
.drawer-header h3 { font-family: var(--font-head); font-size: 1.1rem; font-weight: 800; color: var(--text); }
.drawer-close {
  width: 32px; height: 32px; border-radius: 50%; border: none;
  background: var(--bg); color: var(--text-2);
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.drawer-person-filter { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 1.25rem 0.75rem; flex-shrink: 0; }
.drawer-body { overflow-y: auto; flex: 1; padding: 0 0.75rem 0.5rem; }
.drawer-loading { padding: 2rem 0; text-align: center; color: var(--text-3); font-size: 0.85rem; }
.drawer-empty {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 2rem 0; color: var(--text-3); font-size: 0.85rem;
}
.drawer-item {
  display: flex; align-items: center; gap: 12px;
  padding: 0.85rem 0.5rem; border-radius: var(--radius-s);
  cursor: pointer; transition: background 0.13s;
  border-bottom: 1px solid var(--border);
}
.drawer-item:last-child { border-bottom: none; }
.drawer-item:active { background: var(--bg); }
.drawer-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.drawer-item-info { flex: 1; display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
.drawer-item-title { font-size: 0.95rem; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.drawer-item-meta { font-size: 0.75rem; color: var(--text-2); }
.drawer-arrow { color: var(--text-3); flex-shrink: 0; }
.drawer-accepted { font-size: 0.7rem; color: #34a853; font-weight: 600; }

/* ── MOBILE HEADER ── */
.mobile-header { display: none; }

/* ── MAIN ── */
.main { flex: 1; overflow: hidden; display: flex; flex-direction: column; background: var(--surface); }

/* ── BOTTOM NAV (mobile only) ── */
.bottom-nav { display: none; }

/* ── MOBILE BREAKPOINT ── */
@media (max-width: 768px) {
  .app { flex-direction: column; }

  .sidebar { display: none; }

  .mobile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
    position: sticky;
    top: 0;
    z-index: 20;
  }
  .mh-brand {
    display: flex; align-items: center; gap: 10px;
  }
  .mh-brand-text { display: flex; flex-direction: column; gap: 1px; }
  .mh-title { font-family: var(--font-head); font-size: 0.95rem; font-weight: 800; color: var(--text); line-height: 1.1; }
  .mh-date { font-size: 0.7rem; color: var(--text-3); font-weight: 500; }
  .brand-icon-sm {
    width: 34px; height: 34px; background: var(--blue-light);
    border-radius: 10px; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .mh-right { display: flex; align-items: center; gap: 8px; }
  .mh-loading { color: var(--blue); font-size: 1.2rem; animation: pulse 1s ease-in-out infinite; }
  .theme-btn-sm {
    width: 32px; height: 32px; border-radius: 50%; border: none;
    background: var(--bg); color: var(--text-2);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: background 0.13s;
  }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
  .user-avatar-sm {
    width: 32px; height: 32px; background: var(--blue); border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-family: var(--font-head); font-size: 0.85rem; font-weight: 800;
    cursor: pointer;
  }

  .main { flex: 1; overflow: hidden; min-height: 0; }

  .bottom-nav {
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 0.4rem 0.75rem;
    padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
    background: var(--surface);
    border-top: 1px solid var(--border);
    flex-shrink: 0;
    gap: 0.25rem;
  }
  .bn-item {
    display: flex; flex-direction: column; align-items: center; gap: 3px;
    background: none; border: none; color: var(--text-3);
    font-size: 0.67rem; font-weight: 600;
    padding: 0.45rem 1.1rem; border-radius: 14px;
    transition: color 0.15s, background 0.15s;
    flex: 1;
  }
  .bn-item.active { color: var(--blue); background: var(--blue-light); }
  .bn-item span { letter-spacing: 0; }
  .bn-item:active:not(.active) { background: var(--bg); }

  .bn-fab {
    width: 52px; height: 52px;
    background: var(--blue); color: #fff;
    border: none; border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 18px rgba(26,115,232,.5);
    margin-top: -16px;
    flex-shrink: 0;
    transition: background 0.15s, transform 0.12s;
  }
  .bn-fab:active { transform: scale(0.88); }

  .toast-container { bottom: 5.5rem; }
}
</style>
