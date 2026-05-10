import { ref } from 'vue'

const dark = ref(false)

export function useTheme() {
  function apply(isDark) {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('tp_theme', isDark ? 'dark' : 'light')
  }

  function init() {
    const saved = localStorage.getItem('tp_theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    dark.value = saved ? saved === 'dark' : prefersDark
    apply(dark.value)
  }

  function toggle() {
    dark.value = !dark.value
    apply(dark.value)
  }

  return { dark, toggle, init }
}
