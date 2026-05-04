import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './BookingConfirmation.css'

const CHANNEL_INFO = {
    telegram:     { label: 'Telegram',      icon: '✈️',  color: '#2aabee', bg: 'rgba(42,171,238,0.1)',  border: 'rgba(42,171,238,0.3)' },
    viber:        { label: 'Viber',         icon: '📳',  color: '#7360f2', bg: 'rgba(115,96,242,0.1)', border: 'rgba(115,96,242,0.3)' },
    whatsapp:     { label: 'WhatsApp',      icon: '💬',  color: '#25d366', bg: 'rgba(37,211,102,0.1)', border: 'rgba(37,211,102,0.3)' },
    zoom:         { label: 'Zoom',          icon: '🎥',  color: '#2d8cff', bg: 'rgba(45,140,255,0.1)', border: 'rgba(45,140,255,0.3)' },
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

function BookingConfirmation() {
    const [searchParams] = useSearchParams()
    const name = searchParams.get('name') || ''
    const date = searchParams.get('date') || ''
    const time = searchParams.get('time') || ''
    const section = searchParams.get('section') || ''
    const id = searchParams.get('id') || ''
    const [status, setStatus] = useState('pending')
    const [channel, setChannel] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    const fetchBookingStatus = useCallback(async () => {
        try {
            const response = await fetch(`/api/bookings/${id}`)

            if (!response.ok) {
                throw new Error('Failed to fetch booking')
            }

            const data = await response.json()
            const consultationStatus =
                typeof data.ConsultationType === 'string' && data.ConsultationType.startsWith('status:')
                    ? data.ConsultationType.replace('status:', '')
                    : ''
            const resolvedStatus =
                consultationStatus ||
                data.BookingStatus ||
                data.PaymentStatus ||
                (data.PaymentScreenshot ? 'payment_submitted' : 'pending_payment')
            setStatus(resolvedStatus)
            if (data.PreferredChannel) setChannel(data.PreferredChannel)
        } catch (error) {
            console.error('Fetch error:', error)
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        if (id) {
            fetchBookingStatus()
        } else {
            setLoading(false)
        }
    }, [id, fetchBookingStatus])

    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        return date.toLocaleDateString('my-MM', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatTime = (timeStr) => {
        if (!timeStr) return ''
        const [hours, minutes] = timeStr.split(':')
        const hour = parseInt(hours)
        const ampm = hour >= 12 ? 'ညနေ' : 'နံနက်'
        const displayHour = hour % 12 || 12
        return `${displayHour}:${minutes} ${ampm}`
    }

    const getSectionDisplay = (section) => {
        const sections = {
            'morning': 'နံနက်ပိုင်း (၉:၀၀ - ၁၂:၀၀)',
            'evening': 'ညနေပိုင်း (၂:၀၀ - ၈:၀၀)'
        };
        return sections[section] || ''
    }

    return (
        <div className="booking-confirmation-page">
            <Navbar />

            <section className="booking-hero">
                <div className="booking-hero__bg-orbs">
                    <div className="booking-hero__orb booking-hero__orb--1"></div>
                    <div className="booking-hero__orb booking-hero__orb--2"></div>
                </div>

                <div className="container">
                    <div className="booking-content animate-scale">
                        {loading ? (
                            <div className="loading">Loading...</div>
                        ) : (
                            <>
                                {(status === 'pending' || status === 'pending_payment') && (
                                    <>
                                        <div className="booking-checkmark">
                                            <span>⏳</span>
                                        </div>

                                        <h1 className="booking-title">
                                            ငွေပေးချေရန် ကျန်ရှိနေပါသည်
                                        </h1>

                                        <p className="booking-subtitle">
                                            သင့်ချိန်းဆိုမှုကို လက်ခံရရှိပါပြီ။ ငွေပေးချေပြီးပါက ပုံရိပ်တင်ပို့ပေးပါ။
                                        </p>
                                    </>
                                )}

                                {status === 'payment_submitted' && (
                                    <>
                                        <div className="booking-checkmark">
                                            <span>🔵</span>
                                        </div>

                                        <h1 className="booking-title">
                                            ငွေပေးချေမှု စောင့်ဆိုင်းနေ
                                        </h1>

                                        <p className="booking-subtitle">
                                            သင့်ငွေပေးချေမှုအထောက်အထားကို လက်ခံရရှိပါပြီ။ ဆရာဝန်က စစ်ဆေးပြီး အတည်ပြုချက်ပေးပါလိမ့်မည်။
                                        </p>
                                    </>
                                )}

                                {status === 'confirmed' && (
                                    <>
                                        <div className="confirmed-success-banner">
                                            <div className="confirmed-success-icon">✅</div>
                                            <h1 className="confirmed-success-title">
                                                ချိန်းဆိုမှုနှင့် ငွေပေးချေမှု အောင်မြင်ပါပြီ!
                                            </h1>
                                            <p className="confirmed-success-subtitle">
                                                သင့်ချိန်းဆိုမှုကို အတည်ပြုပြီး ငွေပေးချေမှုလည်း စစ်ဆေးပြီးပါပြီ။<br />
                                                ဆရာဝန်နှင့် တိုင်ပင်ဆွေးနွေးရန် အသင့်ဖြစ်ပါပြီ။
                                            </p>
                                            <div className="confirmed-badges">
                                                <div className="confirmed-badge confirmed-badge--booking">
                                                    <span className="confirmed-badge__icon">📅</span>
                                                    <div className="confirmed-badge__text">
                                                        <span className="confirmed-badge__label">ချိန်းဆိုမှု</span>
                                                        <span className="confirmed-badge__status">အတည်ပြုပြီး</span>
                                                    </div>
                                                </div>
                                                <div className="confirmed-badge confirmed-badge--payment">
                                                    <span className="confirmed-badge__icon">💳</span>
                                                    <div className="confirmed-badge__text">
                                                        <span className="confirmed-badge__label">ငွေပေးချေမှု</span>
                                                        <span className="confirmed-badge__status">အတည်ပြုပြီး</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {channel && <ChannelBlock channel={channel} />}
                                    </>
                                )}

                                {status === 'rejected' && (
                                    <>
                                        <div className="booking-checkmark">
                                            <span>❌</span>
                                        </div>

                                        <h1 className="booking-title">
                                            ချိန်းဆိုမှု ပယ်ဖျက်ပြီးပါပြီ
                                        </h1>

                                        <p className="booking-subtitle">
                                            သင့်တိုင်ပင်ဆွေးနွေးမှုကို ပယ်ဖျက်လိုက်ပါသည်။ အခြားနေ့ရက်နဲ့ အချိန်ကို ရွေးချယ်ပြီး ထပ်မံ ချိန်းဆိုနိုင်ပါသည်။
                                        </p>
                                    </>
                                )}

                                <div className="booking-card glass-card">
                                    <div className="booking-card__header">
                                        <h2>ချိန်းဆိုမှုအသေးစိတ်</h2>
                                    </div>

                                    <div className="booking-details">
                                        <div className="booking-detail">
                                            <span className="booking-label">အမည်:</span>
                                            <span className="booking-value">{name || 'N/A'}</span>
                                        </div>
                                        <div className="booking-detail">
                                            <span className="booking-label">နေ့ရက်:</span>
                                            <span className="booking-value">{formatDate(date) || 'N/A'}</span>
                                        </div>
                                        <div className="booking-detail">
                                            <span className="booking-label">အချိန်:</span>
                                            <span className="booking-value">{formatTime(time) || 'N/A'}</span>
                                        </div>
                                        {section && (
                                            <div className="booking-detail">
                                                <span className="booking-label">အပိုင်း:</span>
                                                <span className={`booking-value section-badge section--${section}`}>
                                                    {getSectionDisplay(section)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="booking-detail">
                                            <span className="booking-label">တိုင်ပင်ခ နှုန်း:</span>
                                            <span className="booking-value">၁၀,၀၀၀ ကျပ်</span>
                                        </div>
                                        <div className="booking-detail">
                                            <span className="booking-label">တိုင်ပင်ချိန်:</span>
                                            <span className="booking-value">၃၀ မိနစ်</span>
                                        </div>
                                        <div className="booking-detail">
                                            <span className="booking-label">ဆရာဝန်:</span>
                                            <span className="booking-value">ဒေါက်တာထွန်းမြတ်ဝင်း</span>
                                        </div>
                                    </div>

                                    <div className="booking-actions">
                                        {(status === 'pending' || status === 'pending_payment') && (
                                            <>
                                                <p className="status-message">
                                                    ငွေပေးချေမှုကို လုပ်ဆောင်ရန် လိုအပ်ပါသည်။
                                                </p>
                                                <Link to="/payment-instructions" className="btn btn-primary">
                                                    ငွေပေးချေရန်
                                                </Link>
                                            </>
                                        )}

                                        {status === 'payment_submitted' && (
                                            <>
                                                <p className="status-message">
                                                    ငွေပေးချေမှုအထောက်အထားကို လက်ခံရရှိပြီးပါပြီ။
                                                </p>
                                                <div className="contact-options">
                                                    <a
                                                        href="https://t.me/drtunhealthconsultant"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="contact-link"
                                                    >
                                                        <span>✈️</span> Telegram မှ အသိပေးချက်ရယူရန်
                                                    </a>
                                                </div>
                                            </>
                                        )}

                                        {status === 'confirmed' && (
                                            <div className="confirmed-actions">
                                                <Link to="/" className="btn btn-secondary">
                                                    ပင်မစာမျက်နှာသို့ ပြန်သွားရန်
                                                </Link>
                                                <div className="contact-options">
                                                    <a
                                                        href="https://t.me/drtunhealthconsultant"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="contact-link"
                                                    >
                                                        <span>✈️</span> Telegram မှ ဆက်သွယ်ရန်
                                                    </a>
                                                </div>
                                            </div>
                                        )}

                                        {status === 'rejected' && (
                                            <div className="rejected-actions">
                                                <Link to="/#consultation" className="btn btn-primary">
                                                    ထပ်မံ ချိန်းဆိုရန်
                                                </Link>
                                                <div className="contact-options">
                                                    <a
                                                        href="https://t.me/drtunhealthconsultant"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="contact-link"
                                                    >
                                                        <span>✈️</span> ဆက်သွယ်ရန် Telegram
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}

export default BookingConfirmation