import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './MyAppointments.css'

const CHANNEL_INFO = {
    telegram: { label: 'Telegram', icon: '✈️', color: '#2aabee', bg: 'rgba(42,171,238,0.1)', border: 'rgba(42,171,238,0.3)' },
    viber: { label: 'Viber', icon: '📳', color: '#7360f2', bg: 'rgba(115,96,242,0.1)', border: 'rgba(115,96,242,0.3)' },
    whatsapp: { label: 'WhatsApp', icon: '💬', color: '#25d366', bg: 'rgba(37,211,102,0.1)', border: 'rgba(37,211,102,0.3)' },
    zoom: { label: 'Zoom', icon: '🎥', color: '#2d8cff', bg: 'rgba(45,140,255,0.1)', border: 'rgba(45,140,255,0.3)' },
    google_meet: { label: 'Google Meet', icon: '📹', color: '#00897b', bg: 'rgba(0,137,123,0.1)', border: 'rgba(0,137,123,0.3)' },
}

function ChannelBlock({ channel }) {
    const info = CHANNEL_INFO[channel] || { label: channel, icon: '📱', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.3)' }
    return (
        <div className="channel-block" style={{ '--ch-color': info.color, '--ch-bg': info.bg, '--ch-border': info.border }}>
            <div className="channel-block__left">
                <div className="channel-block__icon">{info.icon}</div>
                <div>
                    <div className="channel-block__name">{info.label} မှ တိုင်ပင်ဆွေးနွေးမှု</div>
                    <div className="channel-block__sub">ဆရာဝန်က <strong>{info.label}</strong> မှတဆင့် သတ်မှတ်ချိန်တွင် ဆက်သွယ်ပါမည်</div>
                </div>
            </div>
            <div className="channel-block__right">
                <span className="channel-block__tag">🎬 ဗီဒီယိုခေါ်ဆိုမှု</span>
                <span className="channel-block__tag">⏱ မိနစ် ၃၀</span>
            </div>
        </div>
    )
}

const STEPS = [
    { key: 'booking', label: 'ချိန်းဆိုမှု', icon: '📅' },
    { key: 'payment', label: 'ငွေပေးချေမှု', icon: '💳' },
    { key: 'medical_records', label: 'မှတ်တမ်းများတင်', icon: '📋' },
    { key: 'consultation', label: 'တိုင်ပင်ဆွေးနွေးမှု', icon: '🩺' },
]

function getStepIndex(status) {
    switch (status) {
        case 'pending_payment': return 1
        case 'payment_submitted': return 1
        case 'confirmed': return 2
        case 'records_reviewed': return 3
        case 'completed': return 4
        case 'rejected': return -1
        default: return 0
    }
}

function ProgressBar({ status }) {
    if (status === 'rejected') return null

    const activeIndex = getStepIndex(status)

    return (
        <div className="progress-bar-wrapper">
            {STEPS.map((step, i) => {
                const isDone = i < activeIndex
                const isCurrent = i === activeIndex
                const isPending = i > activeIndex

                return (
                    <div key={step.key} className="progress-step-group">
                        <div className={`progress-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''} ${isPending ? 'pending' : ''}`}>
                            <div className="progress-step__circle">
                                {isDone ? '✓' : <span>{step.icon}</span>}
                            </div>
                            <div className="progress-step__label">{step.label}</div>
                            {isCurrent && <div className="progress-step__pulse" />}
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`progress-connector ${isDone ? 'done' : ''}`} />
                        )}
                    </div>
                )
            })}
        </div>
    )
}

function MyAppointments() {
    const [searchTerm, setSearchTerm] = useState('')
    const [searchType, setSearchType] = useState('phone')
    const [appointments, setAppointments] = useState([])
    const [isSearching, setIsSearching] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            alert('ဖုန်းနံပါတ် သို့မဟုတ် အီးမေးလ် ထည့်ပေးပါ')
            return
        }
        setIsSearching(true)
        setHasSearched(true)
        try {
            const params = new URLSearchParams({ type: searchType, value: searchTerm })
            const res = await fetch(`/api/bookings/search?${params}`)
            if (!res.ok) throw new Error('Failed')
            const data = await res.json()
            setAppointments(data || [])
        } catch {
            alert('ရှာဖွေမှု မအောင်မြင်ပါ။ နောက်မှ ထပ်ကြိုးစားပါ။')
            setAppointments([])
        } finally {
            setIsSearching(false)
        }
    }

    const resolveStatus = (apt) => {
        if (apt.BookingStatus) return apt.BookingStatus
        if (apt.PaymentStatus) return apt.PaymentStatus
        if (typeof apt.ConsultationType === 'string' && apt.ConsultationType.startsWith('status:'))
            return apt.ConsultationType.replace('status:', '')
        if (apt.PaymentScreenshot) return 'payment_submitted'
        return 'pending_payment'
    }

    const formatDate = (d) => {
        if (!d) return 'N/A'
        return new Date(d).toLocaleDateString('my-MM', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    }

    const formatTime = (t) => {
        if (!t) return 'N/A'
        const src = t.includes('T') ? t : t.replace(' ', 'T')
        const date = new Date(src)
        const h = date.getHours()
        const m = String(date.getMinutes()).padStart(2, '0')
        return `${h % 12 || 12}:${m} ${h >= 12 ? 'ညနေ' : 'နံနက်'}`
    }

    return (
        <div className="my-appointments-page">
            <Navbar />

            <section className="appointments-hero">
                <div className="appointments-hero__bg-orbs">
                    <div className="appointments-hero__orb appointments-hero__orb--1" />
                    <div className="appointments-hero__orb appointments-hero__orb--2" />
                </div>

                <div className="container">
                    <div className="appointments-content animate-scale">
                        <div className="appointments-checkmark"><span>📅</span></div>

                        <h1 className="appointments-title">ကျွန်တော့်ချိန်းဆိုမှုများ</h1>
                        <p className="appointments-subtitle">
                            သင့်ဖုန်းနံပါတ် သို့မဟုတ် အီးမေးလ်ဖြင့် ချိန်းဆိုမှုများကို ရှာဖွေပါ။
                        </p>

                        <div className="search-card glass-card">
                            <div className="search-type-toggle">
                                <button className={`toggle-btn ${searchType === 'phone' ? 'active' : ''}`} onClick={() => setSearchType('phone')}>
                                    📱 ဖုန်းနံပါတ်
                                </button>
                                <button className={`toggle-btn ${searchType === 'email' ? 'active' : ''}`} onClick={() => setSearchType('email')}>
                                    📧 အီးမေးလ်
                                </button>
                            </div>
                            <div className="search-input-group">
                                <input
                                    type={searchType === 'phone' ? 'tel' : 'email'}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={searchType === 'phone' ? 'ဖုန်းနံပါတ် ထည့်ပါ (ဥပမာ: 09421068582)' : 'အီးမေးလ် ထည့်ပါ'}
                                    className="search-input"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <button onClick={handleSearch} disabled={isSearching} className="btn btn-primary search-btn">
                                    {isSearching ? 'ရှာဖွေနေ...' : '🔍 ရှာဖွေရန်'}
                                </button>
                            </div>
                        </div>

                        {hasSearched && (
                            <div className="appointments-results">
                                {appointments.length === 0 ? (
                                    <div className="no-appointments glass-card">
                                        <div className="no-appointments-icon">📭</div>
                                        <h3>ချိန်းဆိုမှုများ မတွေ့ပါ</h3>
                                        <p>ဤဖုန်းနံပါတ်/အီးမေးလ်ဖြင့် ချိန်းဆိုမှုများ မရှိသေးပါ။</p>
                                        <Link to="/#consultation" className="btn btn-primary">ချိန်းဆိုရန်</Link>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="results-title">တွေ့ရှိသော ချိန်းဆိုမှုများ ({appointments.length})</h2>
                                        <div className="appointments-list">
                                            {appointments.map((apt, idx) => {
                                                const status = resolveStatus(apt)
                                                return (
                                                    <AppointmentCard
                                                        key={apt.Id || idx}
                                                        apt={apt}
                                                        status={status}
                                                        formatDate={formatDate}
                                                        formatTime={formatTime}
                                                    />
                                                )
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}

function AppointmentCard({ apt, status, formatDate, formatTime }) {
    const isConfirmed = status === 'confirmed'
    const isRejected = status === 'rejected'

    return (
        <div className={`appointment-card glass-card ${isConfirmed ? 'appointment-card--confirmed' : ''} ${isRejected ? 'appointment-card--rejected' : ''}`}>

            {/* ── CONFIRMED BANNER ── */}
            {isConfirmed && (
                <div className="confirmed-banner">
                    <div className="confirmed-banner__glow" />
                    <div className="confirmed-banner__content">
                        <div className="confirmed-banner__icon">✅</div>
                        <div>
                            <div className="confirmed-banner__title">ချိန်းဆိုမှုနှင့် ငွေပေးချေမှု အောင်မြင်ပါပြီ!</div>
                            <div className="confirmed-banner__sub">ဆရာဝန်က စစ်ဆေးပြီး အတည်ပြုပြီးပါပြီ</div>
                        </div>
                    </div>
                    <div className="confirmed-badges-row">
                        <div className="confirmed-badge-pill confirmed-badge-pill--green">
                            <span>📅</span> ချိန်းဆိုမှု အတည်ပြုပြီး
                        </div>
                        <div className="confirmed-badge-pill confirmed-badge-pill--green">
                            <span>💳</span> ငွေပေးချေမှု အတည်ပြုပြီး
                        </div>
                    </div>
                </div>
            )}

            {/* ── HEADER (non-confirmed) ── */}
            {!isConfirmed && (
                <div className="appointment-header">
                    <h3 className="appointment-name">{apt.Name || 'N/A'}</h3>
                    <StatusBadge status={status} />
                </div>
            )}

            {/* ── PROGRESS BAR ── */}
            <ProgressBar status={status} />

            {/* ── DETAILS ── */}
            <div className="appointment-details">
                {isConfirmed && (
                    <div className="detail-item detail-item--full">
                        <span className="detail-label">လူနာအမည်:</span>
                        <span className="detail-value">{apt.Name || 'N/A'}</span>
                    </div>
                )}
                <div className="detail-item">
                    <span className="detail-label">နေ့ရက်:</span>
                    <span className="detail-value">{formatDate(apt.PreferredDate)}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">အချိန်:</span>
                    <span className="detail-value">{formatTime(apt.PreferredTime)}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">ဆရာဝန်:</span>
                    <span className="detail-value">ဒေါက်တာထွန်းမြတ်ဝင်း</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">တိုင်ပင်ခ:</span>
                    <span className="detail-value">၁၀,၀၀၀ ကျပ်</span>
                </div>
            </div>

            {/* ── CHANNEL BLOCK (confirmed only) ── */}
            {isConfirmed && apt.PreferredChannel && (
                <div style={{ padding: '0 1.75rem' }}>
                    <ChannelBlock channel={apt.PreferredChannel} />
                </div>
            )}

            {/* ── NEXT STEP BLOCK (confirmed only) ── */}
            {isConfirmed && (
                <div className="next-step-block">
                    <div className="next-step-block__header">
                        <span className="next-step-block__badge">နောက်တဆင့်</span>
                        <h4 className="next-step-block__title">📋 ကျန်းမာရေးမှတ်တမ်းများ တင်ပေးပါ</h4>
                    </div>
                    <p className="next-step-block__desc">
                        တိုင်ပင်ဆွေးနွေးမှုမတိုင်မီ သင့်ကျန်းမာရေးမှတ်တမ်းများ (ဆေးစစ်ချက်များ၊ ဓာတ်ခွဲစစ်ဆေးချက်များ၊
                        ဆေးညွှန်းစာများ) ကို ဆရာဝန်ထံ ကြိုတင်တင်ပို့ပေးပါ။ ဆရာဝန် ကြိုတင်ပြင်ဆင်နိုင်ရန် အထောက်အကူဖြစ်ပါသည်။
                    </p>
                    <Link
                        to={`/medical-records-upload?id=${apt.Id || apt.id}`}
                        className="btn btn-primary btn-next-step"
                    >
                        📤 ကျန်းမာရေးမှတ်တမ်းများ တင်ပေးရန်
                    </Link>
                </div>
            )}

            {/* ── ACTIONS (non-confirmed) ── */}
            {!isConfirmed && (
                <div className="appointment-actions">
                    {(status === 'pending_payment') && (
                        <Link
                            to={`/payment-instructions?id=${apt.Id || apt.id}&name=${encodeURIComponent(apt.Name || '')}`}
                            className="btn btn-primary btn-sm"
                        >
                            💳 ငွေပေးချေရန်
                        </Link>
                    )}
                    {status === 'payment_submitted' && (
                        <span className="waiting-note">⏳ ဆရာဝန်က ငွေပေးချေမှုကို စစ်ဆေးနေပါသည်…</span>
                    )}
                    {isRejected && (
                        <Link to="/#consultation" className="btn btn-primary btn-sm">
                            ထပ်မံ ချိန်းဆိုရန်
                        </Link>
                    )}
                    {status === 'completed' && (
                        <span className="waiting-note">✅ တိုင်ပင်ဆွေးနွေးမှု ပြီးဆုံးပါပြီ</span>
                    )}
                    <Link
                        to={`/booking-confirmation?id=${apt.Id || apt.id}&name=${encodeURIComponent(apt.Name || '')}&date=${encodeURIComponent(apt.PreferredDate || '')}&time=${encodeURIComponent(apt.PreferredTime || '')}`}
                        className="btn btn-secondary btn-sm"
                    >
                        အသေးစိတ်ကြည့်ရန်
                    </Link>
                </div>
            )}
        </div>
    )
}

function StatusBadge({ status }) {
    const map = {
        pending_payment: { text: 'ငွေပေးချေရန် ကျန်ရှိ', cls: 'status-pending' },
        payment_submitted: { text: 'ငွေပေးချေမှု စစ်ဆေးနေ', cls: 'status-submitted' },
        confirmed: { text: 'အတည်ပြုပြီး', cls: 'status-confirmed' },
        records_reviewed: { text: 'မှတ်တမ်း စစ်ဆေးပြီး', cls: 'status-reviewed' },
        rejected: { text: 'ပယ်ဖျက်ပြီး', cls: 'status-rejected' },
        completed: { text: 'ပြီးဆုံးပြီး', cls: 'status-completed' },
    }
    const info = map[status] || { text: status || 'N/A', cls: 'status-unknown' }
    return <span className={`status-badge ${info.cls}`}>{info.text}</span>
}

export default MyAppointments
