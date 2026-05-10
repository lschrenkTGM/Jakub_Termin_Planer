<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ editing ? 'Termin bearbeiten' : 'Neuer Termin' }}</h2>
        <button class="close-btn" @click="$emit('close')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <form @submit.prevent="submit">
        <div class="field" :class="{ focused: focuses.title, filled: form.title.length > 0 }">
          <label>Titel *</label>
          <input v-model="form.title" type="text" required
            @focus="focuses.title=true" @blur="focuses.title=false" />
        </div>

        <div class="two-col">
          <div class="field" :class="{ focused: focuses.date, filled: !!form.date }">
            <label>Datum *</label>
            <input v-model="form.date" type="date" required
              @focus="focuses.date=true" @blur="focuses.date=false" />
          </div>
          <div class="field" :class="{ focused: focuses.time, filled: !!form.time }">
            <label>Uhrzeit *</label>
            <input v-model="form.time" type="time" required
              @focus="focuses.time=true" @blur="focuses.time=false" />
          </div>
        </div>

        <div class="two-col">
          <div class="field" :class="{ focused: focuses.endTime, filled: !!form.endTime }">
            <label>Endzeit</label>
            <input v-model="form.endTime" type="time"
              @focus="focuses.endTime=true" @blur="focuses.endTime=false" />
          </div>
          <div class="field" :class="{ focused: focuses.location, filled: !!form.location }">
            <label>Ort</label>
            <input v-model="form.location" type="text" placeholder=" "
              @focus="focuses.location=true" @blur="focuses.location=false" />
          </div>
        </div>

        <div class="field" :class="{ focused: focuses.desc, filled: !!form.description }">
          <label>Beschreibung</label>
          <textarea v-model="form.description" rows="2"
            @focus="focuses.desc=true" @blur="focuses.desc=false" />
        </div>

        <!-- Recurring toggle (only when creating) -->
        <label v-if="!editing" class="recurring-toggle">
          <div class="toggle-switch" :class="{ on: form.recurring }" @click="form.recurring = !form.recurring">
            <div class="toggle-thumb"></div>
          </div>
          <div class="toggle-label">
            <span class="toggle-title">Wöchentlich wiederholen</span>
            <span class="toggle-sub">Erstellt 52 Termine (1 Jahr)</span>
          </div>
        </label>

        <!-- Recurring badge when editing a recurring appointment -->
        <div v-if="editing && editing.recurring_group_id" class="recurring-badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M17 2l4 4-4 4M3 11V9a4 4 0 014-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Wöchentlich wiederkehrender Termin
        </div>

        <!-- Color picker -->
        <div class="color-row">
          <span class="color-label">Farbe</span>
          <div class="color-swatches">
            <button
              v-for="c in colors"
              :key="c"
              type="button"
              class="swatch"
              :class="{ active: form.color === c }"
              :style="{ background: c }"
              @click="form.color = c"
            />
          </div>
        </div>

        <div class="modal-actions">
          <template v-if="editing">
            <button type="button" class="btn-delete" @click="$emit('delete', editing.id)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Löschen
            </button>
            <button
              v-if="editing.recurring_group_id"
              type="button"
              class="btn-delete-series"
              @click="$emit('delete-series', editing.recurring_group_id)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M17 2l4 4-4 4M3 11V9a4 4 0 014-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Serie löschen
            </button>
          </template>
          <div class="spacer" />
          <button type="button" class="btn-ghost" @click="$emit('close')">Abbrechen</button>
          <button type="submit" class="btn-primary">Speichern</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  prefillDate: String,
  prefillTime: String,
  editing: Object,
  username: String,
})
const emit = defineEmits(['close', 'save', 'delete', 'delete-series'])

const colors = ['#1a73e8','#34a853','#ea4335','#fbbc04','#ff6d00','#9c27b0','#00bcd4','#795548']

const focuses = reactive({ title: false, date: false, time: false, endTime: false, location: false, desc: false })
const form = reactive({
  title: '', date: props.prefillDate || '', time: props.prefillTime || '',
  endTime: '', description: '', location: '', color: '#1a73e8', recurring: false,
})

watch(() => props.editing, (appt) => {
  if (appt) {
    Object.assign(form, {
      title: appt.title || '',
      date: appt.date || '',
      time: appt.time || '',
      endTime: appt.end_time || '',
      description: appt.description || '',
      location: appt.location || '',
      color: appt.color || '#1a73e8',
      recurring: false,
    })
  }
}, { immediate: true })

function submit() {
  emit('save', { ...form, created_by: props.username })
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(32,33,36,.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 200; padding: 1rem;
  backdrop-filter: blur(2px);
}
.modal {
  background: var(--surface);
  border-radius: 20px;
  padding: 1.75rem;
  width: 100%; max-width: 480px;
  box-shadow: var(--shadow-l);
  animation: pop 0.22s cubic-bezier(0.16,1,0.3,1);
}
@keyframes pop {
  from { opacity: 0; transform: scale(0.94) translateY(10px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }
h2 { font-family: var(--font-head); font-size: 1.15rem; font-weight: 800; color: var(--text); margin: 0; }
.close-btn {
  width: 32px; height: 32px; border-radius: 50%; border: none;
  background: var(--bg); color: var(--text-2);
  display: flex; align-items: center; justify-content: center;
  transition: background 0.13s;
}
.close-btn:hover { background: var(--hover-muted); }

form { display: flex; flex-direction: column; gap: 0.85rem; }

.field { position: relative; }
.field label {
  position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
  font-size: 0.88rem; color: var(--text-2); pointer-events: none;
  transition: all 0.16s; background: var(--surface); padding: 0 4px; z-index: 1;
}
.field textarea ~ label,
.field.focused label,
.field.filled label { top: 0; font-size: 0.7rem; color: var(--blue); font-weight: 600; }

.field input, .field textarea {
  width: 100%; padding: 0.8rem 0.9rem;
  border: 1.5px solid var(--border); border-radius: var(--radius-s);
  font-size: 0.95rem; outline: none; transition: border-color 0.16s;
  background: transparent; font-family: var(--font-body);
}
.field.focused input, .field.focused textarea { border-color: var(--blue); }
.field textarea { resize: none; padding-top: 1rem; }

.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

/* Recurring toggle */
.recurring-toggle {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.7rem 0.9rem;
  border: 1.5px solid var(--border); border-radius: var(--radius-s);
  cursor: pointer; transition: border-color 0.15s, background 0.15s;
  user-select: none;
}
.recurring-toggle:hover { border-color: var(--blue); background: var(--blue-light); }

.toggle-switch {
  width: 40px; height: 22px; border-radius: 11px; background: var(--border);
  position: relative; flex-shrink: 0; transition: background 0.2s; cursor: pointer;
}
.toggle-switch.on { background: var(--blue); }
.toggle-thumb {
  position: absolute; top: 3px; left: 3px;
  width: 16px; height: 16px; border-radius: 50%; background: #fff;
  transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,.2);
}
.toggle-switch.on .toggle-thumb { transform: translateX(18px); }

.toggle-label { display: flex; flex-direction: column; gap: 1px; }
.toggle-title { font-size: 0.88rem; font-weight: 600; color: var(--text); }
.toggle-sub { font-size: 0.72rem; color: var(--text-2); }

/* Recurring badge */
.recurring-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 0.4rem 0.75rem;
  background: var(--color-recurring-bg); border-radius: 20px;
  font-size: 0.78rem; font-weight: 600; color: var(--color-recurring-fg);
  align-self: flex-start;
}

/* Color picker */
.color-row { display: flex; align-items: center; gap: 0.75rem; }
.color-label { font-size: 0.8rem; font-weight: 600; color: var(--text-2); white-space: nowrap; }
.color-swatches { display: flex; gap: 6px; flex-wrap: wrap; }
.swatch {
  width: 24px; height: 24px; border-radius: 50%; border: 2.5px solid transparent;
  transition: transform 0.13s, border-color 0.13s;
}
.swatch:hover { transform: scale(1.15); }
.swatch.active { border-color: var(--text); transform: scale(1.15); }

.modal-actions { display: flex; align-items: center; gap: 0.6rem; padding-top: 0.25rem; flex-wrap: wrap; }
.spacer { flex: 1; }

button { padding: 0.6rem 1.1rem; border-radius: var(--radius-s); font-size: 0.88rem; font-weight: 600; border: none; transition: all 0.13s; }
.btn-primary { background: var(--blue); color: #fff; box-shadow: 0 2px 6px rgba(26,115,232,.3); }
.btn-primary:hover { background: var(--blue-hover); }
.btn-ghost { background: var(--bg); color: var(--text-2); }
.btn-ghost:hover { background: var(--hover-muted); }
.btn-delete { display: flex; align-items: center; gap: 5px; background: var(--color-error-bg); color: var(--color-error-fg); }
.btn-delete:hover { background: var(--color-error-hover); }
.btn-delete-series { display: flex; align-items: center; gap: 5px; background: var(--color-error-bg); color: var(--color-error-fg); }
.btn-delete-series:hover { background: var(--color-error-hover); }

@media (max-width: 768px) {
  .modal-backdrop { align-items: flex-end; padding: 0; }
  .modal {
    border-radius: 20px 20px 0 0;
    max-width: 100%;
    max-height: 92vh;
    overflow-y: auto;
    animation: slideUp 0.28s cubic-bezier(0.16,1,0.3,1);
    padding-bottom: max(1.75rem, env(safe-area-inset-bottom));
  }
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }
  .two-col { grid-template-columns: 1fr 1fr; }
}
</style>
