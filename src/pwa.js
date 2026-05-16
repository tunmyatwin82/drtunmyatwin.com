const listeners = new Set()

const pwaState = {
  installReady: false,
  updateReady: false,
  installed: false,
}

let deferredInstallPrompt = null
let swRegistration = null
let hasInitialized = false
let hasReloadedOnUpdate = false

function isStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
}

function emitPwaState() {
  const snapshot = { ...pwaState }
  listeners.forEach((listener) => listener(snapshot))
}

export function subscribePwaState(listener) {
  listeners.add(listener)
  listener({ ...pwaState })
  return () => listeners.delete(listener)
}

export async function initPwa() {
  if (hasInitialized || typeof window === 'undefined') return
  hasInitialized = true

  pwaState.installed = isStandaloneMode()

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredInstallPrompt = event
    pwaState.installReady = true
    emitPwaState()
  })

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null
    pwaState.installReady = false
    pwaState.installed = true
    emitPwaState()
  })

  if (!('serviceWorker' in navigator)) {
    emitPwaState()
    return
  }

  try {
    swRegistration = await navigator.serviceWorker.register('/sw.js')
    if (swRegistration.waiting) {
      pwaState.updateReady = true
      emitPwaState()
    }

    swRegistration.addEventListener('updatefound', () => {
      const newWorker = swRegistration?.installing
      if (!newWorker) return

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          pwaState.updateReady = true
          emitPwaState()

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('App update available', {
              body: 'Version အသစ် ready ဖြစ်ပါပြီ။ Update Now နှိပ်ပြီး အသစ်သုံးနိုင်ပါသည်။',
              icon: '/ebook-cover.png',
            })
          }
        }
      })
    })

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hasReloadedOnUpdate) return
      hasReloadedOnUpdate = true
      window.location.reload()
    })
  } catch (error) {
    console.error('PWA init failed:', error)
  } finally {
    emitPwaState()
  }
}

export async function promptInstall() {
  if (!deferredInstallPrompt) return false

  deferredInstallPrompt.prompt()
  const choice = await deferredInstallPrompt.userChoice
  deferredInstallPrompt = null
  pwaState.installReady = false
  if (choice?.outcome === 'accepted') pwaState.installed = true
  emitPwaState()
  return choice?.outcome === 'accepted'
}

export function activateAppUpdate() {
  if (!swRegistration?.waiting) return false
  swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
  pwaState.updateReady = false
  emitPwaState()
  return true
}

export async function requestAppNotifications() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'

  const permission = await Notification.requestPermission()
  if (permission === 'granted') {
    new Notification('Notification enabled', {
      body: 'Website update သတင်းများကို ဒီ App ကနေ အသိပေးပို့နိုင်ပါပြီ။',
      icon: '/ebook-cover.png',
    })
  }
  return permission
}
