<template>
  <div class="login-page">
    <div class="login-bg">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
    </div>

    <div class="login-card">
      <div class="brand">
        <div class="brand-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="17" rx="3" stroke="#1a73e8" stroke-width="2"/>
            <path d="M3 9h18" stroke="#1a73e8" stroke-width="2"/>
            <path d="M8 2v4M16 2v4" stroke="#1a73e8" stroke-width="2" stroke-linecap="round"/>
            <rect x="7" y="13" width="3" height="3" rx="0.5" fill="#1a73e8"/>
            <rect x="11" y="13" width="3" height="3" rx="0.5" fill="#34a853"/>
            <rect x="15" y="13" width="3" height="3" rx="0.5" fill="#fbbc04"/>
          </svg>
        </div>
        <span class="brand-name">Terminplaner</span>
      </div>

      <!-- Step 1: PIN -->
      <template v-if="step === 'pin'">
        <h1>Zugang</h1>
        <p class="subtitle">Gib den 4-stelligen PIN ein.</p>
        <div class="pin-row">
          <input
            v-for="(_, i) in 4"
            :key="i"
            :ref="el => { if (el) pinInputs[i] = el }"
            v-model="pinDigits[i]"
            type="text"
            inputmode="numeric"
            maxlength="1"
            class="pin-box"
            :class="{ error: pinError }"
            @input="onPinInput(i)"
            @keydown.backspace="onPinBack(i)"
          />
        </div>
        <p v-if="pinError" class="error-msg">Falscher PIN. Bitte nochmal versuchen.</p>
      </template>

      <!-- Step 2: Name -->
      <template v-else>
        <h1>Willkommen!</h1>
        <p class="subtitle">Wie heißt du? Dein Name wird bei Terminen angezeigt.</p>
        <form @submit.prevent="submitName">
          <div class="field" :class="{ focused, filled: name.length > 0 }">
            <label>Dein Name</label>
            <input
              v-model="name"
              type="text"
              maxlength="40"
              required
              autofocus
              @focus="focused = true"
              @blur="focused = false"
            />
          </div>
          <button type="submit" class="btn-login" :disabled="!name.trim()">
            <span>Zum Kalender</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </form>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue'

const CORRECT_PIN = '6767'
const emit = defineEmits(['login'])

const step = ref('pin')
const pinDigits = reactive(['', '', '', ''])
const pinInputs = ref([])
const pinError = ref(false)
const name = ref('')
const focused = ref(false)

function onPinInput(i) {
  const val = pinDigits[i]
  // only allow digits
  if (!/^\d$/.test(val)) { pinDigits[i] = ''; return }
  pinError.value = false
  if (i < 3) nextTick(() => pinInputs.value[i + 1]?.focus())
  if (i === 3) checkPin()
}
function onPinBack(i) {
  if (!pinDigits[i] && i > 0) {
    pinDigits[i - 1] = ''
    nextTick(() => pinInputs.value[i - 1]?.focus())
  }
}
function checkPin() {
  const entered = pinDigits.join('')
  if (entered === CORRECT_PIN) {
    step.value = 'name'
  } else {
    pinError.value = true
    pinDigits.forEach((_, i) => { pinDigits[i] = '' })
    nextTick(() => pinInputs.value[0]?.focus())
  }
}
function submitName() {
  const n = name.value.trim()
  if (n) emit('login', n)
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f4ff;
  position: relative;
  overflow: hidden;
}
.login-bg { position: absolute; inset: 0; pointer-events: none; }
.blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.35; animation: drift 12s ease-in-out infinite; }
.blob-1 { width: 500px; height: 500px; background: #1a73e8; top: -120px; left: -100px; }
.blob-2 { width: 400px; height: 400px; background: #34a853; bottom: -80px; right: -80px; animation-delay: -4s; }
.blob-3 { width: 300px; height: 300px; background: #fbbc04; top: 50%; left: 55%; animation-delay: -8s; }
@keyframes drift {
  0%,100% { transform: translate(0,0) scale(1); }
  33% { transform: translate(30px,-20px) scale(1.05); }
  66% { transform: translate(-20px,15px) scale(0.97); }
}

.login-card {
  background: #fff;
  border-radius: 24px;
  padding: 2.75rem 2.5rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(26,115,232,.12), 0 4px 16px rgba(0,0,0,.08);
  position: relative;
  z-index: 1;
  animation: slideUp 0.4s cubic-bezier(0.16,1,0.3,1);
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

.brand { display: flex; align-items: center; gap: 10px; margin-bottom: 1.75rem; }
.brand-icon { width: 44px; height: 44px; background: #e8f0fe; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.brand-name { font-family: var(--font-head); font-size: 1.25rem; font-weight: 800; color: var(--text); letter-spacing: -0.3px; }

h1 { font-family: var(--font-head); font-size: 1.6rem; font-weight: 800; color: var(--text); margin-bottom: 0.4rem; letter-spacing: -0.5px; }
.subtitle { font-size: 0.88rem; color: var(--text-2); line-height: 1.5; margin-bottom: 1.75rem; }

.pin-row { display: flex; gap: 12px; justify-content: center; margin-bottom: 1rem; }
.pin-box {
  width: 60px; height: 68px;
  border: 2px solid var(--border);
  border-radius: 12px;
  font-family: var(--font-head);
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--text);
  text-align: center;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  caret-color: transparent;
}
.pin-box:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(26,115,232,.15); }
.pin-box.error { border-color: #ea4335; animation: shake 0.35s ease; }
@keyframes shake {
  0%,100% { transform: translateX(0); }
  20%,60% { transform: translateX(-6px); }
  40%,80% { transform: translateX(6px); }
}
.error-msg { text-align: center; font-size: 0.8rem; color: #ea4335; font-weight: 600; }

.field { position: relative; margin-bottom: 1.25rem; }
.field label {
  position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
  font-size: 0.9rem; color: var(--text-2); pointer-events: none;
  transition: all 0.18s; background: #fff; padding: 0 4px;
}
.field.focused label, .field.filled label { top: 0; font-size: 0.72rem; color: var(--blue); font-weight: 600; }
.field input {
  width: 100%; padding: 0.85rem 1rem;
  border: 1.5px solid var(--border); border-radius: var(--radius-s);
  font-size: 1rem; outline: none; transition: border-color 0.18s; background: transparent;
}
.field.focused input { border-color: var(--blue); }

.btn-login {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 0.85rem; background: var(--blue); color: #fff; border: none;
  border-radius: var(--radius-s); font-size: 0.95rem; font-weight: 600;
  box-shadow: 0 2px 8px rgba(26,115,232,.35);
  transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
}
.btn-login:hover:not(:disabled) { background: var(--blue-hover); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(26,115,232,.4); }
.btn-login:disabled { opacity: 0.45; cursor: default; box-shadow: none; }
</style>
