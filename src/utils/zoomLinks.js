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
 * Alternate deep link some Zoom builds accept (with explicit action).
 * @param {string} httpsUrl
 * @returns {string | null}
 */
function zoomHttpsToAppDeepLinkWithAction(httpsUrl) {
    let u
    try {
        u = new URL(String(httpsUrl || '').trim())
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
    if (kind === 's') return null

    const q = new URLSearchParams()
    q.set('action', 'join')
    q.set('confno', confno)
    if (pwd) q.set('pwd', pwd)
    return `zoommtg://zoom.us/join?${q.toString()}`
}

/**
 * Launch Zoom desktop/mobile via protocol handler (best inside the same user gesture).
 * Tries minimal + alternate zoommtg forms: programmatic link, window.open, iframe per URL.
 * @returns {HTMLIFrameElement[]} iframes to remove after delay
 */
function invokeZoomNativeApp(appUrls) {
    const urls = [...new Set((Array.isArray(appUrls) ? appUrls : [appUrls]).filter(Boolean))]
    const iframes = []
    for (const appUrl of urls) {
        try {
            const a = document.createElement('a')
            a.setAttribute('href', appUrl)
            a.setAttribute('aria-hidden', 'true')
            a.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
        } catch {
            /* continue */
        }

        /** Some Chromium/Linux setups hand off zoommtg better via window.open (omit noopener so we can close an empty tab). */
        try {
            const w = window.open(appUrl, '_blank')
            if (w) {
                window.setTimeout(() => {
                    try {
                        if (w && !w.closed) w.close()
                    } catch {
                        /* ignore */
                    }
                }, 600)
            }
        } catch {
            /* ignore */
        }

        const iframe = document.createElement('iframe')
        iframe.style.cssText = 'display:none;width:0;height:0;border:0;position:absolute;left:-9999px'
        iframe.setAttribute('aria-hidden', 'true')
        document.body.appendChild(iframe)
        iframe.src = appUrl
        iframes.push(iframe)
    }
    return iframes
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

    const alt = zoomHttpsToAppDeepLinkWithAction(httpsUrl)
    const variants = alt && alt !== app ? [app, alt] : [app]
    const iframeEls = invokeZoomNativeApp(variants)

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
