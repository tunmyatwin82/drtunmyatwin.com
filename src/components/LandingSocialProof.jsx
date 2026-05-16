import { useEffect, useRef, useState } from 'react'

function ensureVisitorId() {
    const key = 'drtunmyatwin_visitor'
    try {
        let id = sessionStorage.getItem(key)
        if (!id || id.length < 8) {
            id =
                typeof crypto !== 'undefined' && crypto.randomUUID
                    ? crypto.randomUUID()
                    : `v-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
            sessionStorage.setItem(key, id)
        }
        return id
    } catch {
        return `fallback-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
    }
}

/** Fixed top-right on homepage: server-backed active viewers + consultation milestone. */
export default function LandingSocialProof() {
    const [activeVisitors, setActiveVisitors] = useState(null)
    const visitorIdRef = useRef(null)

    useEffect(() => {
        visitorIdRef.current = ensureVisitorId()
        let cancelled = false

        const ping = async () => {
            const visitorId = visitorIdRef.current
            if (!visitorId) return
            try {
                const res = await fetch('/api/presence/ping', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify({ visitorId }),
                    cache: 'no-store'
                })
                if (!res.ok) return
                const data = await res.json()
                const n = typeof data.activeVisitors === 'number' ? data.activeVisitors : null
                if (!cancelled && n != null) setActiveVisitors(n)
            } catch {
                /* offline / deploy gap — leave previous value */
            }
        }

        ping()
        const pingEvery = window.setInterval(ping, 38_000)
        const pollEvery = window.setInterval(async () => {
            try {
                const res = await fetch('/api/presence/active', {
                    headers: { Accept: 'application/json' },
                    cache: 'no-store'
                })
                if (!res.ok) return
                const data = await res.json()
                const n = typeof data.activeVisitors === 'number' ? data.activeVisitors : null
                if (!cancelled && n != null) setActiveVisitors(n)
            } catch {
                /* ignore */
            }
        }, 22_000)

        return () => {
            cancelled = true
            window.clearInterval(pingEvery)
            window.clearInterval(pollEvery)
        }
    }, [])

    const viewersLabel =
        activeVisitors == null ? '…' : activeVisitors >= 999 ? '999+' : String(activeVisitors)

    return (
        <div className="live-corner-widget glass-card" aria-live="polite">
            <div className="live-corner-widget__row">
                <span className="live-corner-widget__live" aria-hidden="true">
                    <span className="live-corner-widget__dot" />
                    LIVE
                </span>
                <span className="live-corner-widget__live-text">
                    ယခုကြည့်ရှုသူ&nbsp;
                    <strong className="live-corner-widget__count">{viewersLabel}</strong>
                    &nbsp;ယောက်
                </span>
            </div>
            <p className="live-corner-widget__milestone">
                ဒေါက်တာနှင့်ကျန်းမာရေးတိုင်ပင် ဆွေးနွေးပြီးသူ&nbsp;
                <strong>၃၀၀ ကျော်</strong>
                ရှိပါပြီ။
            </p>
        </div>
    )
}
