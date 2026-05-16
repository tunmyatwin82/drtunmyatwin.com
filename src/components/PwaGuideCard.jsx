import { useEffect, useMemo, useState } from 'react'
import { activateAppUpdate, promptInstall, requestAppNotifications, subscribePwaState } from '../pwa'

function getPlatformHint() {
  const ua = navigator.userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  if (/android/.test(ua)) return 'android'
  return 'other'
}

function PwaGuideCard() {
  const [pwa, setPwa] = useState({
    installReady: false,
    updateReady: false,
    installed: false,
  })
  const [notice, setNotice] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [notificationState, setNotificationState] = useState(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
    return Notification.permission
  })

  const platform = useMemo(() => getPlatformHint(), [])

  useEffect(() => subscribePwaState(setPwa), [])

  const handleInstall = async () => {
    setIsBusy(true)
    const installed = await promptInstall()
    setNotice(installed ? 'Home screen မှာ ထည့်ပြီးပါပြီ။' : 'Browser menu → Add to Home / Install မှ ထည့်နိုင်ပါသည်။')
    setIsBusy(false)
  }

  const handleEnableNotifications = async () => {
    setIsBusy(true)
    const permission = await requestAppNotifications()
    setNotificationState(permission)
    if (permission === 'granted') {
      setNotice('အပ်ဒိတ်သတင်းများ ရရှိပါမည်။')
    } else if (permission === 'unsupported') {
      setNotice('ဤ browser တွင် notification မပံ့ပိုးပါ။')
    } else {
      setNotice('Browser settings မှ Allow ပြန်ဖွင့်နိုင်ပါသည်။')
    }
    setIsBusy(false)
  }

  return (
    <section className="pwa-guide section" id="mobile-app-guide">
      <div className="container">
        <div className="pwa-guide__card glass-card">
          <div className="pwa-guide__top">
            <div className="pwa-guide__intro">
              <span className="pwa-guide__icon" aria-hidden="true">
                📱
              </span>
              <div>
                <h2 className="pwa-guide__title">
                  App လိုသုံး · <span className="highlight">အပ်ဒိတ်</span> သတင်းများ လက်ခံမယ်
                </h2>
                <p className="pwa-guide__lede">URL ထပ်မရေးရ — အကြောင်းကြားချင်ပါက Notification ဖွင့်ပါ</p>
              </div>
            </div>

            <div className="pwa-guide__actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleInstall}
                disabled={isBusy || pwa.installed}
              >
                {pwa.installed ? '✓ ထည့်ပြီး' : '⬇️ Install'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleEnableNotifications} disabled={isBusy}>
                {notificationState === 'granted' ? '🔔 ဖွင့်ပြီး' : '🔔 Notification'}
              </button>
              {pwa.updateReady && (
                <button type="button" className="btn btn-secondary" onClick={activateAppUpdate}>
                  ♻️ Update
                </button>
              )}
            </div>
          </div>

          <ol className="pwa-guide__mini" aria-label="အဆင့်များ">
            <li>
              <span className="pwa-guide__mini-num">1</span>
              <span>
                Menu → <strong>Add to Home</strong> / Install
              </span>
            </li>
            <li>
              <span className="pwa-guide__mini-num">2</span>
              <span>
                <strong>Allow</strong> နှိပ်
              </span>
            </li>
            <li>
              <span className="pwa-guide__mini-num">3</span>
              <span>
                နောက်တန်း <strong>app icon</strong> မှ ဝင်ပါ
              </span>
            </li>
          </ol>

          {platform === 'ios' && (
            <p className="pwa-guide__hint">
              Safari · Share → <strong>Add to Home Screen</strong>
            </p>
          )}
          {platform === 'android' && (
            <p className="pwa-guide__hint">
              Chrome · Menu → <strong>Install app</strong> / <strong>Add to Home screen</strong>
            </p>
          )}

          {notice && <p className="pwa-guide__notice">{notice}</p>}
        </div>
      </div>
    </section>
  )
}

export default PwaGuideCard
