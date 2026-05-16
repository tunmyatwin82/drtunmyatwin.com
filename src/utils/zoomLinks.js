/**
 * Open Zoom in the desktop/mobile app (zoommtg://) instead of the web client only.
 */

/**
 * @param {string} httpsUrl
 * @returns {string | null} zoommtg URL or null if not a supported Zoom HTTPS meeting link
 */
export function zoomHttpsToAppDeepLink(httpsUrl) {
    const web = String(httpsUrl || '').trim()
    if (!web) return null
    if (/^zoommtg:/i.test(web)) return web

    let u
    try {
        u = new URL(web)
    } catch {
        return null
    }
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null

    const host = u.hostname.toLowerCase()
    if (host !== 'zoom.us' && !host.endsWith('.zoom.us')) return null

    const m = u.pathname.match(/\/(j|s|w)\/(\d{5,15})(?:\/|\?|#|$)/i)
    if (!m) return null

    const kind = m[1].toLowerCase()
    const confno = m[2]
    const pwd = u.searchParams.get('pwd') || ''
    const zak = u.searchParams.get('zak') || ''

    if (kind === 's') {
        const q = new URLSearchParams()
        q.set('confno', confno)
        if (pwd) q.set('pwd', pwd)
        if (zak) q.set('zak', zak)
        return `zoommtg://zoom.us/start?${q.toString()}`
    }

    /** Prefer minimal join query — matches many desktop clients (incl. Linux) better than action=join. */
    const q = new URLSearchParams()
    q.set('confno', confno)
    if (pwd) q.set('pwd', pwd)
    const joinBase = `zoommtg://zoom.us/join?${q.toString()}`
    return joinBase
}

/**
 * Launch Zoom via zoommtg:// using one programmatic anchor click in the same stack as the
 * real user click. Chromium blocks iframe / window.open / repeated protocol launches:
 * "Not allowed to launch ... because a user gesture is required."
 * @returns {HTMLIFrameElement[]} empty — retained for cleanup loop compatibility
 */
function invokeZoomNativeApp(appUrl) {
    try {
        const a = document.createElement('a')
        a.setAttribute('href', appUrl)
        a.setAttribute('rel', 'noopener noreferrer')
        a.setAttribute('aria-hidden', 'true')
        a.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    } catch {
        /* ignore */
    }
    return []
}

/**
 * Prefer native Zoom app first (zoommtg://), then HTTPS web client only if the app likely did not open.
 * Skips web when the tab is hidden (e.g. mobile app handoff) or the page unloads.
 * Does not listen to `blur` — on Linux/desktop it often fires without the Zoom app opening and blocks web fallback.
 * Ctrl/Cmd-click still uses the default HTTPS href (new tab).
 * @returns {boolean} true if default was prevented
 */
export function openZoomLinkPreferApp(httpsUrl, event) {
    const web = String(httpsUrl || '').trim()
    const app = zoomHttpsToAppDeepLink(httpsUrl)
    if (!app) return false
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
        return false
    }
    event.preventDefault()

    let skipWebFallback = false
    const markLikelyLeft = () => {
        skipWebFallback = true
    }
    window.addEventListener('pagehide', markLikelyLeft, { passive: true })
    const onVisibility = () => {
        if (document.visibilityState === 'hidden') markLikelyLeft()
    }
    document.addEventListener('visibilitychange', onVisibility, { passive: true })

    const iframeEls = invokeZoomNativeApp(app)

    /** Longer wait so the local Zoom app can start before offering the web client. */
    const fallbackMs = 4500
    window.setTimeout(() => {
        window.removeEventListener('pagehide', markLikelyLeft)
        document.removeEventListener('visibilitychange', onVisibility)
        for (const el of iframeEls) {
            try {
                el.remove()
            } catch {
                /* ignore */
            }
        }

        if (!skipWebFallback) {
            window.location.assign(web)
        }
    }, fallbackMs)

    return true
}
