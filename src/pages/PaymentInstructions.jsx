import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './PaymentInstructions.css'

const CHANNEL_INFO = {
    telegram:    { label: 'Telegram',    icon: '✈️',  color: '#2aabee' },
    viber:       { label: 'Viber',       icon: '📳',  color: '#7360f2' },
    whatsapp:    { label: 'WhatsApp',    icon: '💬',  color: '#25d366' },
    zoom:        { label: 'Zoom',        icon: '🎥',  color: '#2d8cff' },
}

function PaymentInstructions() {
    const navigate = useNavigate()
    const location = useLocation()
    const { bookingData: initialBookingData } = location.state || {}

    const [screenshot, setScreenshot] = useState(null)
    const [screenshotPreview, setScreenshotPreview] = useState('')
    const [isUploading, setIsUploading] = useState(false)
    const [uploaded, setUploaded] = useState(false)

    const bookingData = initialBookingData || (() => {
        const stored = sessionStorage.getItem('bookingData')
        return stored ? JSON.parse(stored) : {}
    })()

    useEffect(() => {
        window.scrollTo(0, 0)
        if (initialBookingData) {
            sessionStorage.setItem('bookingData', JSON.stringify(initialBookingData))
        }
        if (!bookingData?.phone) {
            navigate('/#consultation')
        }
        // Intentionally once on mount: scroll, persist route state, redirect if missing booking context.
    }, []) // eslint-disable-line react-hooks/exhaustive-deps -- mount-only guard

    const channel = CHANNEL_INFO[bookingData?.preferred_channel] || null

    const formatDate = (d) => {
        if (!d) return '—'
        return new Date(d).toLocaleDateString('my-MM', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
    }

    const handleScreenshotChange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        setScreenshot(file)
        const reader = new FileReader()
        reader.onloadend = () => setScreenshotPreview(reader.result)
        reader.readAsDataURL(file)
    }

    const handleSubmitProof = async () => {
        if (!screenshot) { alert('ငွေပေးချေမှုပုံရိပ် တင်ပို့ရန် လိုအပ်ပါသည်'); return }
        if (!bookingData?.id) { alert('Booking ID မတွေ့ပါ။ Support နှင့် ဆက်သွယ်ပါ။'); return }
        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('screenshot', screenshot)
            const res = await fetch(`/api/bookings/${bookingData.id}/payment-upload`, {
                method: 'PATCH', body: formData
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || 'Upload failed')
            }
            setUploaded(true)
        } catch (err) {
            alert(`မအောင်မြင်ပါ: ${err.message}`)
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="pi-page">
            <Navbar />

            <div className="pi-bg-orbs">
                <div className="pi-orb pi-orb--1" />
                <div className="pi-orb pi-orb--2" />
            </div>

            <div className="container pi-container">

                {/* ── Header ── */}
                <div className="pi-header">
                    <div className="pi-header__icon">📅</div>
                    <h1 className="pi-header__title">ချိန်းဆိုမှု လျှောက်ထားပြီးပါပြီ!</h1>
                    <p className="pi-header__sub">အောက်ပါ အဆင့်များကို တဆင့်ချင်း လိုက်နာပြီး ငွေပေးချေပါ။ ဆရာဝန်က စစ်ဆေးပြီး အတည်ပြုပေးပါမည်။</p>
                </div>

                {/* ── Booking summary strip ── */}
                <div className="pi-summary glass-card">
                    <div className="pi-summary__item">
                        <span className="pi-summary__label">အမည်</span>
                        <span className="pi-summary__value">{bookingData?.name || '—'}</span>
                    </div>
                    <div className="pi-summary__sep" />
                    <div className="pi-summary__item">
                        <span className="pi-summary__label">နေ့ရက်</span>
                        <span className="pi-summary__value">{formatDate(bookingData?.preferred_date)}</span>
                    </div>
                    <div className="pi-summary__sep" />
                    <div className="pi-summary__item">
                        <span className="pi-summary__label">အချိန်</span>
                        <span className="pi-summary__value">{bookingData?.preferred_time || '—'}</span>
                    </div>
                    {channel && (
                        <>
                            <div className="pi-summary__sep" />
                            <div className="pi-summary__item">
                                <span className="pi-summary__label">Channel</span>
                                <span className="pi-summary__value pi-summary__channel" style={{ color: channel.color }}>
                                    {channel.icon} {channel.label}
                                </span>
                            </div>
                        </>
                    )}
                </div>

                {/* ── Step-by-step instructions ── */}
                <div className="pi-section-label">📋 ငွေပေးချေမှု လုပ်ငန်းစဉ်</div>

                <div className="pi-steps">

                    {/* Step 1 */}
                    <div className="pi-step glass-card">
                        <div className="pi-step__num">1</div>
                        <div className="pi-step__body">
                            <div className="pi-step__title">ငွေပေးချေမှုအက်ပ် ဖွင့်ပါ</div>
                            <p className="pi-step__desc">သင့်ဖုန်းမှာ အောက်ပါ အက်ပ်တစ်ခုကို ဖွင့်ပါ</p>
                            <div className="pi-pay-methods">
                                <div className="pi-pay-method"><span>💳</span><span>KPay</span></div>
                                <div className="pi-pay-method"><span>🌊</span><span>Wave Pay</span></div>
                                <div className="pi-pay-method"><span>💙</span><span>AYA Pay</span></div>
                                <div className="pi-pay-method"><span>🟡</span><span>CB Pay</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="pi-step glass-card">
                        <div className="pi-step__num">2</div>
                        <div className="pi-step__body">
                            <div className="pi-step__title">ဖုန်းနံပါတ်သို့ ငွေလွှဲပါ</div>
                            <p className="pi-step__desc">အောက်ပါ ဖုန်းနံပါတ်သို့ <strong>တိုင်ပင်ခ ၁၀,၀၀၀ ကျပ်</strong> ကို လွှဲပြောင်းပါ</p>
                            <div className="pi-phone-box">
                                <span className="pi-phone-box__label">📞 လက်ခံသူ ဖုန်းနံပါတ်</span>
                                <span className="pi-phone-box__number">09421068582</span>
                                <span className="pi-phone-box__amount">၁၀,၀၀၀ ကျပ်</span>
                            </div>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="pi-step glass-card">
                        <div className="pi-step__num">3</div>
                        <div className="pi-step__body">
                            <div className="pi-step__title">Screenshot ရိုက်ပါ</div>
                            <p className="pi-step__desc">ငွေလွှဲပြောင်းပြီးသောအခါ ငွေလွှဲမှတ်တမ်း screenshot ကို ဖုန်းတွင် သိမ်းဆည်းပါ</p>
                            <div className="pi-tip">💡 &quot;ငွေပေးချေမှု အောင်မြင်ပါသည်&quot; ဟူသော စာသားပါသော screen ကို screenshot ရိုက်ပါ</div>
                        </div>
                    </div>

                    {/* Step 4 — Upload */}
                    <div className="pi-step pi-step--highlight glass-card">
                        <div className="pi-step__num pi-step__num--gold">4</div>
                        <div className="pi-step__body">
                            <div className="pi-step__title">Screenshot တင်ပို့ပါ</div>
                            <p className="pi-step__desc">ရိုက်ထားသော screenshot ကို ဤနေရာတွင် တင်ပို့ပါ</p>

                            {uploaded ? (
                                <div className="pi-upload-success">
                                    <span>✅</span>
                                    <span>Screenshot တင်ပို့ပြီးပါပြီ! ဆရာဝန်က စစ်ဆေးပြီး အတည်ပြုပေးပါမည်။</span>
                                </div>
                            ) : (
                                <>
                                    <div className="pi-upload-area">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleScreenshotChange}
                                            className="pi-file-input"
                                            id="pi-screenshot"
                                        />
                                        <label htmlFor="pi-screenshot" className="pi-upload-label">
                                            {screenshotPreview ? (
                                                <img src={screenshotPreview} alt="Payment proof" className="pi-preview-img" />
                                            ) : (
                                                <>
                                                    <span className="pi-upload-label__icon">📷</span>
                                                    <span className="pi-upload-label__text">ဤနေရာကို နှိပ်ပြီး ပုံရိပ် ရွေးပါ</span>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                    <button
                                        onClick={handleSubmitProof}
                                        disabled={isUploading || !screenshot}
                                        className="btn btn-primary btn-lg btn-block pi-upload-btn"
                                    >
                                        {isUploading ? '⏳ တင်ပို့နေသည်...' : '📤 ငွေပေးချေမှုအထောက်အထား တင်ပို့မည်'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                </div>

                {/* ── How to check status ── */}
                <div className="pi-check-status glass-card">
                    <div className="pi-check-status__icon">🔍</div>
                    <div className="pi-check-status__body">
                        <div className="pi-check-status__title">Booking အတည်ပြုချက် စစ်ဆေးနည်း</div>
                        <p className="pi-check-status__desc">
                            ဆရာဝန်က ငွေပေးချေမှုကို စစ်ဆေးပြီး <strong>Confirmed</strong> ပြောင်းပေးပါမည်။
                            သင့် booking အခြေအနေကို ဤနေရာတွင် စစ်ဆေးနိုင်ပါသည်:
                        </p>
                        <div className="pi-check-status__steps">
                            <div className="pi-check-status__step">
                                <span className="pi-check-status__step-num">①</span>
                                <span>မျက်နှာစာ menu မှ <strong>&quot;ကျွန်တော့်ချိန်းဆိုမှုများ&quot;</strong> ကို နှိပ်ပါ</span>
                            </div>
                            <div className="pi-check-status__step">
                                <span className="pi-check-status__step-num">②</span>
                                <span>သင့် <strong>ဖုန်းနံပါတ် ({bookingData?.phone || '09xxx'})</strong> ကို ထည့်ပြီး ရှာပါ</span>
                            </div>
                            <div className="pi-check-status__step">
                                <span className="pi-check-status__step-num">③</span>
                                <span>Booking status <strong style={{ color: '#4ade80' }}>✅ Confirmed</strong> ဖြစ်ကြောင်း မြင်ရပါမည်</span>
                            </div>
                        </div>
                        <a href="/my-appointments" className="btn btn-secondary pi-check-btn">
                            🔍 ကျွန်တော့်ချိန်းဆိုမှုများ စစ်ဆေးရန်
                        </a>
                    </div>
                </div>

                {/* ── Medical records note ── */}
                <div className="pi-records-note glass-card">
                    <span className="pi-records-note__icon">⚕️</span>
                    <div>
                        <div className="pi-records-note__title">ကျန်းမာရေးမှတ်တမ်းများ ပေးပို့ပါ</div>
                        <p className="pi-records-note__desc">
                            တိုင်ပင်ချိန်မတိုင်မီ ဆေးစစ်ချက်များ၊ ဓာတ်ခွဲရလဒ်များ၊ ဆေးညွှန်းစာများကို
                            Telegram သို့မဟုတ် Viber မှတစ်ဆင့် ဆရာဝန်ထံ ပေးပို့ပါ
                        </p>
                    </div>
                </div>

                {/* ── Contact ── */}
                <div className="pi-contact">
                    <p className="pi-contact__label">မေးခွန်းများ ရှိပါက ဆက်သွယ်ပါ</p>
                    <div className="pi-contact__links">
                        <a href="https://t.me/drtunhealthconsultant" target="_blank" rel="noopener noreferrer" className="pi-contact__link pi-contact__link--telegram">
                            ✈️ Telegram
                        </a>
                        <a href="viber://chat?number=959421068582" className="pi-contact__link pi-contact__link--viber">
                            📳 Viber
                        </a>
                    </div>
                </div>

            </div>

            <Footer />
        </div>
    )
}

export default PaymentInstructions
