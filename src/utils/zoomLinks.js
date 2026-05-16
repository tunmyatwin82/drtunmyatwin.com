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

    const q = new URLSearchParams()
    q.set('action', 'join')
    q.set('confno', confno)
    if (pwd) q.set('pwd', pwd)
    return `zoommtg://zoom.us/join?${q.toString()}`
}

/**
 * Prefer native Zoom app via hidden iframe (avoids navigating the whole tab away from the site).
 * If the app does not open (or is not installed), navigates this tab to the HTTPS meeting URL so the
 * Zoom web client can join (no extra popup; reliable when the app is missing).
 * If the window loses focus or the page is hidden (likely switched to Zoom app), skips web redirect.
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

    /** Likely left for the Zoom app or another surface — avoid also loading the web client. */
    let skipWebFallback = false
    const markLikelyLeft = () => {
        skipWebFallback = true
    }
    window.addEventListener('blur', markLikelyLeft, { passive: true })
    window.addEventListener('pagehide', markLikelyLeft, { passive: true })
    const onVisibility = () => {
        if (document.visibilityState === 'hidden') markLikelyLeft()
    }
    document.addEventListener('visibilitychange', onVisibility, { passive: true })

    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'display:none;width:0;height:0;border:0;position:absolute;left:-9999px'
    iframe.setAttribute('aria-hidden', 'true')
    document.body.appendChild(iframe)
    iframe.src = app

    const fallbackMs = 2500
    window.setTimeout(() => {
        window.removeEventListener('blur', markLikelyLeft)
        window.removeEventListener('pagehide', markLikelyLeft)
        document.removeEventListener('visibilitychange', onVisibility)
        try {
            iframe.remove()
        } catch {
            /* ignore */
        }

        if (!skipWebFallback) {
            window.location.assign(web)
        }
    }, fallbackMs)

    return true
}
