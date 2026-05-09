<template>
  <LoginScreen v-if="!username" @login="handleLogin" />

  <div v-else class="app">

    <!-- ── DESKTOP SIDEBAR ── -->
    <aside class="sidebar">
      <div class="sidebar-top">
        <div class="brand">
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

      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-n">{{ todayCount }}</span>
          <span class="stat-l">Heute</span>
        </div>
        <div class="stat-card">
          <span class="stat-n">{{ totalCount }}</span>
          <span class="stat-l">Gesamt</span>
        </div>
      </div>

      <div class="upcoming-section">
        <h3 class="section-title">Bevorstehend</h3>
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
          </div>
        </div>
      </div>
    </aside>

    <!-- ── MOBILE HEADER ── -->
    <header class="mobile-header">
      <div class="mh-brand">
        <div class="brand-icon-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="17" rx="3" stroke="#1a73e8" stroke-width="2"/>
            <path d="M3 9h18" stroke="#1a73e8" stroke-width="2"/>
          </svg>
        </div>
        <span>Terminplaner</span>
      </div>
      <div class="mh-right">
        <span v-if="loading" class="mh-loading">●</span>
        <div class="user-avatar-sm" @click="logout" title="Abmelden">{{ username[0].toUpperCase() }}</div>
      </div>
    </header>

    <!-- ── MAIN CONTENT ── -->
    <main class="main">
      <DayView v-if="selectedDay" :date-str="selectedDay" :username="username" @back="selectedDay = null" />
      <MonthCalendar v-else @select-day="selectDay" />
    </main>

    <!-- ── MOBILE UPCOMING DRAWER ── -->
    <transition name="drawer">
      <div v-if="upcomingDrawer" class="drawer-backdrop" @click.self="upcomingDrawer = false">
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

          <div class="drawer-stats">
            <div class="stat-card">
              <span class="stat-n">{{ todayCount }}</span>
              <span class="stat-l">Heute</span>
            </div>
            <div class="stat-card">
              <span class="stat-n">{{ totalCount }}</span>
              <span class="stat-l">Gesamt</span>
            </div>
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
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="drawer-arrow">
                <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </transition>

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
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import LoginScreen from './components/LoginScreen.vue'
import MonthCalendar from './components/MonthCalendar.vue'
import DayView from './components/DayView.vue'
import AppointmentModal from './components/AppointmentModal.vue'
import { useAppointments } from './composables/useAppointments.js'

const username = ref(sessionStorage.getItem('tp_user') || '')

function handleLogin(name) {
  sessionStorage.setItem('tp_user', name)
  username.value = name
}
function logout() {
  if (!confirm(`Als "${username.value}" abmelden?`)) return
  sessionStorage.removeItem('tp_user')
  username.value = ''
  selectedDay.value = null
}

const { appointments, loading, addAppointment, deleteAppointment, getCountForDate } = useAppointments()

const selectedDay = ref(null)
const globalModal = ref(false)
const upcomingDrawer = ref(false)
function selectDay(d) { selectedDay.value = d }

const todayStr = new Date().toISOString().slice(0, 10)
const todayCount = computed(() => getCountForDate(todayStr))
const totalCount = computed(() => appointments.value.length)

const upcoming = computed(() =>
  appointments.value
    .filter(a => a.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 7)
)

function formatUpDate(dateStr) {
  if (dateStr === todayStr) return 'Heute'
  const tom = new Date(); tom.setDate(tom.getDate() + 1)
  if (dateStr === tom.toISOString().slice(0, 10)) return 'Morgen'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
}

function goToday() { selectedDay.value = todayStr }
function openGlobalModal() { globalModal.value = true }
async function handleGlobalSave(data) { await addAppointment(data); globalModal.value = false }
async function handleGlobalDelete(id) { await deleteAppointment(id); globalModal.value = false }
</script>

<style scoped>
.app { display: flex; height: 100vh; overflow: hidden; }

/* ── SIDEBAR (desktop only) ── */
.sidebar {
  width: 268px; flex-shrink: 0;
  background: var(--surface); border-right: 1px solid var(--border);
  display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden;
}
.sidebar-top { padding: 1.25rem 1rem 1rem; display: flex; flex-direction: column; gap: 1rem; }
.brand { display: flex; align-items: center; gap: 10px; padding: 0 4px; }
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
.stats-row { display: flex; gap: 0.5rem; padding: 0 1rem; margin-top: 0.25rem; }
.stat-card { flex: 1; background: var(--bg); border-radius: var(--radius-m); padding: 0.85rem 0.75rem; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.stat-n { font-family: var(--font-head); font-size: 1.6rem; font-weight: 800; color: var(--blue); line-height: 1; }
.stat-l { font-size: 0.7rem; color: var(--text-2); text-transform: uppercase; letter-spacing: 0.6px; font-weight: 600; }
.upcoming-section { flex: 1; padding: 0 0.75rem 1rem; margin-top: 0.5rem; }
.section-title { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-3); padding: 0.5rem 0.5rem 0.6rem; }
.loading-hint { font-size: 0.8rem; color: var(--text-3); padding: 0.5rem; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 1.5rem 0; color: var(--text-3); font-size: 0.8rem; }
.upcoming-item { display: flex; align-items: center; gap: 10px; padding: 0.6rem 0.75rem; border-radius: var(--radius-s); cursor: pointer; transition: background 0.13s; margin-bottom: 2px; }
.upcoming-item:hover { background: var(--bg); }
.up-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.up-content { display: flex; flex-direction: column; gap: 1px; overflow: hidden; }
.up-title { font-size: 0.88rem; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.up-meta { font-size: 0.72rem; color: var(--text-2); }

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
    display: flex; align-items: center; gap: 8px;
    font-family: var(--font-head); font-size: 1rem; font-weight: 800; color: var(--text);
  }
  .brand-icon-sm {
    width: 30px; height: 30px; background: var(--blue-light);
    border-radius: 8px; display: flex; align-items: center; justify-content: center;
  }
  .mh-right { display: flex; align-items: center; gap: 8px; }
  .mh-loading { color: var(--blue); font-size: 1.2rem; animation: pulse 1s ease-in-out infinite; }
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
    padding: 0.5rem 1rem;
    padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
    background: var(--surface);
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }
  .bn-item {
    display: flex; flex-direction: column; align-items: center; gap: 3px;
    background: none; border: none; color: var(--text-3);
    font-size: 0.65rem; font-weight: 600; padding: 0.4rem 1rem;
    transition: color 0.13s;
  }
  .bn-item.active { color: var(--blue); }
  .bn-item span { text-transform: uppercase; letter-spacing: 0.4px; }

  .bn-fab {
    width: 52px; height: 52px;
    background: var(--blue); color: #fff;
    border: none; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 14px rgba(26,115,232,.4);
    margin-top: -20px;
    transition: background 0.15s, transform 0.1s;
  }
  .bn-fab:active { transform: scale(0.93); }

  /* ── UPCOMING DRAWER ── */
  .drawer-backdrop {
    position: fixed; inset: 0;
    background: rgba(32,33,36,.4);
    z-index: 50;
    display: flex; align-items: flex-end;
  }
  .drawer {
    width: 100%;
    background: var(--surface);
    border-radius: 20px 20px 0 0;
    max-height: 80vh;
    display: flex; flex-direction: column;
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
  }
  .drawer-handle {
    width: 36px; height: 4px; background: var(--border);
    border-radius: 2px; margin: 12px auto 0;
    flex-shrink: 0;
  }
  .drawer-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1rem 1.25rem 0.5rem;
    flex-shrink: 0;
  }
  .drawer-header h3 {
    font-family: var(--font-head); font-size: 1.1rem; font-weight: 800; color: var(--text);
  }
  .drawer-close {
    width: 32px; height: 32px; border-radius: 50%; border: none;
    background: var(--bg); color: var(--text-2);
    display: flex; align-items: center; justify-content: center;
  }
  .drawer-stats {
    display: flex; gap: 0.5rem; padding: 0.5rem 1.25rem 0.75rem; flex-shrink: 0;
  }
  .drawer-body {
    overflow-y: auto; flex: 1; padding: 0 0.75rem 0.5rem;
  }
  .drawer-loading, .drawer-empty {
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    padding: 2rem 0; color: var(--text-3); font-size: 0.85rem;
  }
  .drawer-item {
    display: flex; align-items: center; gap: 12px;
    padding: 0.85rem 0.75rem; border-radius: var(--radius-s);
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

  /* Drawer transition */
  .drawer-enter-active, .drawer-leave-active { transition: opacity 0.25s ease; }
  .drawer-enter-active .drawer, .drawer-leave-active .drawer { transition: transform 0.28s cubic-bezier(0.16,1,0.3,1); }
  .drawer-enter-from, .drawer-leave-to { opacity: 0; }
  .drawer-enter-from .drawer, .drawer-leave-to .drawer { transform: translateY(100%); }
}
</style>
