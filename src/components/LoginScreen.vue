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

      <!-- Loading -->
      <div v-if="loadingUsers" class="loading-state">
        <div class="spinner"></div>
        <span>Lade…</span>
      </div>

      <!-- Step 1: PIN -->
      <template v-else-if="step === 'pin'">
        <h1>Zugang</h1>
        <p class="subtitle">Gib den 4-stelligen PIN ein.</p>
        <div class="pin-row">
          <input
            v-for="(_, i) in 4" :key="i"
            :ref="el => { if (el) pinInputs[i] = el }"
            v-model="pinDigits[i]"
            type="text" inputmode="numeric" maxlength="1"
            class="pin-box" :class="{ error: pinError }"
            @input="onPinInput(i)" @keydown.backspace="onPinBack(i)"
          />
        </div>
        <p v-if="pinError" class="error-msg">Falscher PIN.</p>
      </template>

      <!-- Step 2: User selection -->
      <template v-else-if="step === 'user'">
        <h1>Wer bist du?</h1>
        <p class="subtitle">Wähle deinen Account.</p>
        <div class="user-grid">
          <button
            v-for="user in users" :key="user.name"
            class="user-btn" :class="{ selected: selectedUser?.name === user.name }"
            @click="selectedUser = user"
          >
            <div class="ub-avatar" :style="{ background: avatarColor(user.name) }">{{ user.name[0] }}</div>
            <span class="ub-name">{{ user.name }}</span>
            <span class="ub-role">{{ roleLabel(user.role) }}</span>
          </button>
        </div>
        <button class="btn-login" :disabled="!selectedUser" @click="step = 'password'">
          Weiter
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </button>
      </template>

      <!-- Step 3: Password -->
      <template v-else>
        <div class="back-row">
          <button class="back-link" @click="step = 'user'; pwError = false; password = ''">← Zurück</button>
        </div>
        <div class="pw-user">
          <div class="ub-avatar big" :style="{ background: avatarColor(selectedUser.name) }">{{ selectedUser.name[0] }}</div>
          <span>{{ selectedUser.name }}</span>
        </div>
        <form @submit.prevent="submitPassword">
          <div class="field" :class="{ focused, filled: password.length > 0, error: pwError }">
            <label>PIN / Passwort</label>
            <input
              v-model="password" type="password" required autofocus
              @focus="focused = true" @blur="focused = false" @input="pwError = false"
            />
          </div>
          <p v-if="pwError" class="error-msg">Falsches Passwort.</p>
          <button type="submit" class="btn-login" :disabled="!password || submitting">
            {{ submitting ? 'Prüfe…' : 'Anmelden' }}
            <svg v-if="!submitting" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </button>
        </form>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, onMounted } from 'vue'
import { PIN } from '../config/users.js'
import { loadUsers, verifyLogin, getUsers } from '../composables/useAuth.js'

const emit = defineEmits(['login'])

const step = ref('pin')
const pinDigits = reactive(['', '', '', ''])
const pinInputs = ref([])
const pinError = ref(false)
const selectedUser = ref(null)
const password = ref('')
const pwError = ref(false)
const focused = ref(false)
const submitting = ref(false)
const loadingUsers = ref(true)

const users = getUsers()

onMounted(async () => {
  await loadUsers()
  loadingUsers.value = false
})

const avatarColors = ['#1a73e8','#34a853','#ea4335','#fbbc04','#9c27b0']
function avatarColor(name) {
  const idx = ['Lukas','Jakub','Amel','David','Omar'].indexOf(name)
  return avatarColors[Math.max(0, idx) % avatarColors.length]
}
function roleLabel(role) {
  return role === 'admin' ? 'Admin' : role === 'acceptor' ? 'Akzeptant' : 'Mitglied'
}

function onPinInput(i) {
  if (!/^\d$/.test(pinDigits[i])) { pinDigits[i] = ''; return }
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
  if (pinDigits.join('') === PIN) {
    step.value = 'user'
  } else {
    pinError.value = true
    pinDigits.forEach((_, i) => { pinDigits[i] = '' })
    nextTick(() => pinInputs.value[0]?.focus())
  }
}

async function submitPassword() {
  submitting.value = true
  const user = await verifyLogin(selectedUser.value.name, password.value)
  submitting.value = false
  if (user) {
    emit('login', { name: user.name, role: user.role, password: password.value })
  } else {
    pwError.value = true
    password.value = ''
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: var(--bg); position: relative; overflow: hidden;
}
.login-bg { position: absolute; inset: 0; pointer-events: none; }
.blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.35; animation: drift 12s ease-in-out infinite; }
.blob-1 { width: 500px; height: 500px; background: #1a73e8; top: -120px; left: -100px; }
.blob-2 { width: 400px; height: 400px; background: #34a853; bottom: -80px; right: -80px; animation-delay: -4s; }
.blob-3 { width: 300px; height: 300px; background: #fbbc04; top: 50%; left: 55%; animation-delay: -8s; }
@keyframes drift { 0%,100% { transform:translate(0,0) scale(1); } 33% { transform:translate(30px,-20px) scale(1.05); } 66% { transform:translate(-20px,15px) scale(.97); } }

.login-card {
  background: var(--surface); border-radius: 24px; padding: 2.5rem 2rem;
  width: 100%; max-width: 420px;
  box-shadow: 0 20px 60px rgba(26,115,232,.12), 0 4px 16px rgba(0,0,0,.08);
  position: relative; z-index: 1;
  animation: slideUp 0.4s cubic-bezier(0.16,1,0.3,1);
}
@keyframes slideUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }

.brand { display:flex; align-items:center; gap:10px; margin-bottom:1.5rem; }
.brand-icon { width:44px; height:44px; background:#e8f0fe; border-radius:12px; display:flex; align-items:center; justify-content:center; }
.brand-name { font-family:var(--font-head); font-size:1.25rem; font-weight:800; color:var(--text); }

.loading-state { display:flex; flex-direction:column; align-items:center; gap:12px; padding:2rem 0; color:var(--text-2); }
.spinner { width:28px; height:28px; border:3px solid var(--blue-light); border-top-color:var(--blue); border-radius:50%; animation:spin .7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

h1 { font-family:var(--font-head); font-size:1.5rem; font-weight:800; color:var(--text); margin-bottom:.4rem; }
.subtitle { font-size:.88rem; color:var(--text-2); margin-bottom:1.5rem; }

.pin-row { display:flex; gap:10px; justify-content:center; margin-bottom:1rem; }
.pin-box {
  width:58px; height:66px; border:2px solid var(--border); border-radius:12px;
  font-family:var(--font-head); font-size:1.8rem; font-weight:800; color:var(--text);
  text-align:center; outline:none; transition:border-color .15s,box-shadow .15s; caret-color:transparent;
}
.pin-box:focus { border-color:var(--blue); box-shadow:0 0 0 3px rgba(26,115,232,.15); }
.pin-box.error { border-color:#ea4335; animation:shake .35s ease; }
@keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }

.user-grid { display:flex; flex-direction:column; gap:8px; margin-bottom:1.25rem; }
.user-btn {
  display:flex; align-items:center; gap:12px;
  padding:.75rem 1rem; border:1.5px solid var(--border); border-radius:12px;
  background:var(--surface); cursor:pointer; transition:all .13s; text-align:left;
}
.user-btn:hover, .user-btn.selected { border-color:var(--blue); background:var(--blue-light); }
.ub-avatar {
  width:36px; height:36px; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  color:#fff; font-family:var(--font-head); font-size:1rem; font-weight:800; flex-shrink:0;
}
.ub-avatar.big { width:48px; height:48px; font-size:1.3rem; }
.ub-name { flex:1; font-size:.95rem; font-weight:600; color:var(--text); }
.ub-role { font-size:.72rem; color:var(--text-2); background:var(--bg); padding:2px 8px; border-radius:20px; }

.back-row { margin-bottom:1rem; }
.back-link { background:none; border:none; font-size:.85rem; color:var(--blue); cursor:pointer; font-weight:600; padding:0; }
.pw-user { display:flex; align-items:center; gap:12px; margin-bottom:1.25rem; font-family:var(--font-head); font-size:1.1rem; font-weight:700; color:var(--text); }

.field { position:relative; margin-bottom:.75rem; }
.field label {
  position:absolute; left:13px; top:50%; transform:translateY(-50%);
  font-size:.88rem; color:var(--text-2); pointer-events:none;
  transition:all .16s; background:var(--surface); padding:0 4px;
}
.field.focused label,.field.filled label { top:0; font-size:.7rem; color:var(--blue); font-weight:600; }
.field.error label { color:#ea4335; }
.field input {
  width:100%; padding:.85rem 1rem; border:1.5px solid var(--border);
  border-radius:var(--radius-s); font-size:1rem; outline:none; transition:border-color .16s; background:transparent;
}
.field.focused input { border-color:var(--blue); }
.field.error input { border-color:#ea4335; }

.error-msg { font-size:.8rem; color:#ea4335; font-weight:600; margin-bottom:.5rem; }

.btn-login {
  width:100%; display:flex; align-items:center; justify-content:center; gap:8px;
  padding:.85rem; background:var(--blue); color:#fff; border:none;
  border-radius:var(--radius-s); font-size:.95rem; font-weight:600;
  box-shadow:0 2px 8px rgba(26,115,232,.35); transition:background .15s,transform .1s; margin-top:.25rem;
}
.btn-login:hover:not(:disabled) { background:var(--blue-hover); transform:translateY(-1px); }
.btn-login:disabled { opacity:.4; cursor:default; box-shadow:none; }
</style>
