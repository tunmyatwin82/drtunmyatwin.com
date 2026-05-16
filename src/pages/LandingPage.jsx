import { useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import LandingSocialProof from '../components/LandingSocialProof'
import LeadForm from '../components/LeadForm'
import Footer from '../components/Footer'
import BookingForm from '../components/BookingForm'
import './LandingPage.css'

function LandingPage() {
    const [calendarMonth, setCalendarMonth] = useState(() => {
        const now = new Date()
        return new Date(now.getFullYear(), now.getMonth(), 1)
    })
    const [selectedDate, setSelectedDate] = useState('')
    const [selectedTime, setSelectedTime] = useState('')

    const scrollToForm = () => {
        const el = document.getElementById('lead-form')
        if (el) el.scrollIntoView({ behavior: 'smooth' })
    }

    const scrollToConsultation = () => {
        const el = document.getElementById('consultation')
        if (el) el.scrollIntoView({ behavior: 'smooth' })
    }

    const monthLabel = calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const todayStr = new Date().toISOString().split('T')[0]
    const availableTimes = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']

    const calendarDays = useMemo(() => {
        const year = calendarMonth.getFullYear()
        const month = calendarMonth.getMonth()
        const firstDay = new Date(year, month, 1)
        const startWeekday = firstDay.getDay()
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const days = []

        for (let i = 0; i < startWeekday; i += 1) {
            days.push({ key: `empty-${i}`, dateStr: '', day: '', disabled: true, empty: true })
        }

        for (let day = 1; day <= daysInMonth; day += 1) {
            const date = new Date(year, month, day)
            const dateStr = date.toISOString().split('T')[0]
            const disabled = dateStr < todayStr
            days.push({
                key: dateStr,
                day,
                dateStr,
                disabled,
                empty: false
            })
        }

        return days
    }, [calendarMonth, todayStr])

    return (
        <div className="landing-page">
            <Navbar />
            <LandingSocialProof />
            <div className="mobile-quick-nav">
                <button type="button" className="mobile-quick-nav__btn mobile-quick-nav__btn--primary" onClick={scrollToConsultation}>
                    🩺 ချိန်းဆိုရန်
                </button>
                <a href="/my-appointments" className="mobile-quick-nav__btn">
                    📋 ချိန်းဆိုမှုများ
                </a>
                <button type="button" className="mobile-quick-nav__btn" onClick={scrollToForm}>
                    🎁 အခမဲ့စာအုပ်
                </button>
            </div>

            {/* ===== HERO SECTION ===== */}
            <section className="hero">
                <div className="hero__bg-orbs">
                    <div className="hero__orb hero__orb--1"></div>
                    <div className="hero__orb hero__orb--2"></div>
                    <div className="hero__orb hero__orb--3"></div>
                </div>

                <div className="container hero__container">
                    <div className="hero__content animate-fade-left">
                        <span className="badge badge-gold">
                            ✨ ၆၀,၀၀၀+ YouTube ကျန်းမာရေးလေ့လာသူ
                        </span>

                        <h1 className="hero__title">
                            ဆေးဆိုင်တိုင်းမှာ
                            <br />
                            <span className="hero__title-highlight">မရှိမဖြစ် ဆောင်ထားရမည့်</span>
                            <br />
                            ဆေးဝါး <span className="hero__title-number">၅၀</span> စာရင်း
                        </h1>

                        <p className="hero__subtitle">
                            ဆေးဝါးပညာရှင် ဒေါက်တာထွန်းမြတ်ဝင်း ရေးသားထားသော
                            ဆေးဆိုင်ပိုင်ရှင်များနှင့် ဆေးဝါးကျွမ်းကျင်သူများအတွက်
                            <strong> မဖြစ်မနေ လိုအပ်သည့်</strong> လက်စွဲစာအုပ်ကို
                            <span className="highlight"> အခမဲ့ </span>ရယူလိုက်ပါ။
                        </p>

                        <div className="hero__cta-group">
                            <button className="btn btn-primary btn-lg btn-pulse" onClick={scrollToForm}>
                                📥 အခမဲ့စာအုပ် ရယူမည်
                            </button>
                            <div className="hero__cta-note">
                                <span className="hero__cta-check">✅</span>
                                <span>အခမဲ့ • Spam မပို့ပါ • PDF ချက်ချင်းရမည်</span>
                            </div>
                        </div>

                        <div className="hero__stats">
                            <div className="hero__stat">
                                <span className="hero__stat-number">60K+</span>
                                <span className="hero__stat-label">YouTube Subscribers</span>
                            </div>
                            <div className="hero__stat-divider"></div>
                            <div className="hero__stat">
                                <span className="hero__stat-number">50+</span>
                                <span className="hero__stat-label">Essential Medicines</span>
                            </div>
                            <div className="hero__stat-divider"></div>
                            <div className="hero__stat">
                                <span className="hero__stat-number">100%</span>
                                <span className="hero__stat-label">အခမဲ့</span>
                            </div>
                        </div>
                    </div>

                    <div className="hero__image animate-fade-right delay-200">
                        <div className="hero__book-wrapper">
                            <div className="hero__book-glow"></div>
                            <img
                                src="/ebook-cover.png"
                                alt="ဆေးဝါး ၅၀ စာရင်း ebook cover"
                                className="hero__book animate-float"
                            />
                            <div className="hero__book-badge">
                                <span>🎁</span>
                                <span>FREE</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hero__scroll-hint" onClick={scrollToForm}>
                    <span>↓</span>
                </div>
            </section>

            <hr className="section-divider" />

            {/* ===== BENEFITS SECTION ===== */}
            <section className="benefits section" id="benefits">
                <div className="container">
                    <span className="badge">📚 ဒီစာအုပ်ထဲမှာ ဘာတွေပါလဲ</span>
                    <h2 className="section-title" style={{ marginTop: '1rem' }}>
                        ဒီစာအုပ်ဖတ်ပြီးရင် သင်ရရှိမည့်
                        <span className="highlight"> အကျိုးကျေးဇူးများ</span>
                    </h2>
                    <p className="section-subtitle">
                        ဆေးဆိုင်လုပ်ငန်းအတွက် တကယ်လိုအပ်တဲ့ practical knowledge တွေကို
                        ဒီစာအုပ်တစ်အုပ်ထဲမှာ စုစည်းထားပါတယ်
                    </p>

                    <div className="benefits__grid">
                        <div className="benefit-card glass-card">
                            <div className="benefit-card__icon">💊</div>
                            <h3 className="benefit-card__title">ဆေးဝါး ၅၀ အသေးစိတ်</h3>
                            <p className="benefit-card__desc">
                                ဆေးဆိုင်တိုင်းမှာ ဆောင်ထားသင့်တဲ့ အရေးကြီးဆေးဝါး ၅၀ ကို
                                အသေးစိတ်ရှင်းပြထားပါတယ်
                            </p>
                        </div>

                        <div className="benefit-card glass-card">
                            <div className="benefit-card__icon">📋</div>
                            <h3 className="benefit-card__title">Dosage & Usage Guide</h3>
                            <p className="benefit-card__desc">
                                ဆေးတစ်မျိုးချင်းစီ၏ ပမာဏ၊ သောက်သုံးပုံနှင့်
                                သတိထားရမည့်အချက်များ
                            </p>
                        </div>

                        <div className="benefit-card glass-card">
                            <div className="benefit-card__icon">⚠️</div>
                            <h3 className="benefit-card__title">Side Effects & Warnings</h3>
                            <p className="benefit-card__desc">
                                ဆေးတစ်ခုချင်းစီ၏ ဘေးထွက်ဆိုးကျိုးများနှင့်
                                ဆေးဓာတ်မတည့်မှုသတိပေးချက်များ
                            </p>
                        </div>

                        <div className="benefit-card glass-card">
                            <div className="benefit-card__icon">🏪</div>
                            <h3 className="benefit-card__title">ဆေးဆိုင် Stock Management</h3>
                            <p className="benefit-card__desc">
                                ဆေးဆိုင်မှာ ဘယ်ဆေးတွေကို ဦးစားပေးထားသင့်လဲဆိုတာ
                                စီမံခန့်ခွဲနိုင်ဖို့ လမ်းညွှန်
                            </p>
                        </div>

                        <div className="benefit-card glass-card">
                            <div className="benefit-card__icon">🔬</div>
                            <h3 className="benefit-card__title">Pharmacology Basics</h3>
                            <p className="benefit-card__desc">
                                ဆေးဝါးသိပ္ပံ အခြေခံသဘောတရားများကို
                                လွယ်ကူရှင်းလင်းစွာ ရှင်းပြထားပါတယ်
                            </p>
                        </div>

                        <div className="benefit-card glass-card">
                            <div className="benefit-card__icon">💡</div>
                            <h3 className="benefit-card__title">Practical Tips</h3>
                            <p className="benefit-card__desc">
                                လက်တွေ့ဆေးဆိုင်လုပ်ငန်းခွင်မှာ အသုံးဝင်မယ့်
                                အကြံဉာဏ်များနှင့် လှို့ဝှက်ချက်များ
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <hr className="section-divider" />

            {/* ===== ABOUT SECTION ===== */}
            <section className="about section" id="about">
                <div className="container">
                    <div className="about__content">
                        <div className="about__image-wrapper">
                            <div className="about__image-frame">
                                <img
                                    src="/about-doctor-photo-v2.png?v=20260505-3"
                                    alt="Dr. Tun Myat Win"
                                    className="about__avatar-photo"
                                />
                                <div className="about__image-badge badge-success">
                                    <span>✅ General Practitioner</span>
                                </div>
                            </div>
                        </div>

                        <div className="about__text">
                            <span className="badge">👋 ကျွန်တော့်အကြောင်း</span>
                            <h2 className="about__title">
                                ဒေါက်တာ<span className="highlight-blue"> ထွန်းမြတ်ဝင်း</span>
                            </h2>
                            <p className="about__bio">
                                ဆေးဝါးပညာရှင်တစ်ဦးဖြစ်ပြီး YouTube Channel မှတစ်ဆင့်
                                ကျန်းမာရေးအသိပညာများကို မြန်မာပြည်သူများအတွက်
                                ဝေမျှပေးနေပါတယ်။
                            </p>

                            <div className="about__achievements">
                                <div className="about__achievement">
                                    <div className="about__achievement-icon">🎓</div>
                                    <div>
                                        <strong>အထွေထွေရောဂါကု ဆရာဝန်</strong>
                                        <p>ဆေးဝါးပညာ အသိပညာပေးသူ</p>
                                    </div>
                                </div>
                                <div className="about__achievement">
                                    <div className="about__achievement-icon">📺</div>
                                    <div>
                                        <strong>YouTube Creator</strong>
                                        <p>60,000+ Subscribers</p>
                                    </div>
                                </div>
                                <div className="about__achievement">
                                    <div className="about__achievement-icon">📖</div>
                                    <div>
                                        <strong>စာရေးဆရာ</strong>
                                        <p>ဆေးဝါးစာအုပ်များ ရေးသားထုတ်ဝေ</p>
                                    </div>
                                </div>
                                <div className="about__achievement">
                                    <div className="about__achievement-icon">🏥</div>
                                    <div>
                                        <strong>ကျန်းမာရေးအကြံပေး</strong>
                                        <p>ဆေးဝါးအသုံးပြုမှု အတိုင်ပင်ခံ</p>
                                    </div>
                                </div>
                            </div>

                            <button className="btn btn-secondary" onClick={scrollToForm}>
                                📥 အခမဲ့စာအုပ် ရယူရန်
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <hr className="section-divider" />

            {/* ===== TESTIMONIALS SECTION ===== */}
            <section className="testimonials section" id="testimonials">
                <div className="container">
                    <span className="badge badge-gold">⭐ သုံးသပ်ချက်များ</span>
                    <h2 className="section-title" style={{ marginTop: '1rem' }}>
                        စာအုပ်ဖတ်ပြီးသူများ၏
                        <span className="highlight"> ပြောကြားချက်များ</span>
                    </h2>

                    <div className="testimonials__grid">
                        <div className="testimonial-card glass-card">
                            <div className="testimonial-card__stars">⭐⭐⭐⭐⭐</div>
                            <p className="testimonial-card__text">
                                "ဆေးဆိုင်အတွက် တကယ်အသုံးဝင်တဲ့စာအုပ်ပါ။
                                ဆေးတွေကို အမျိုးအစားခွဲပြီး ရှင်းရှင်းလင်းလင်း
                                ရေးထားတာမို့ နားလည်ရလွယ်ပါတယ်။"
                            </p>
                            <div className="testimonial-card__author">
                                <div className="testimonial-card__avatar">👩</div>
                                <div>
                                    <strong>မခင်ဇာနီ</strong>
                                    <p>ဆေးဆိုင်ပိုင်ရှင်၊ မန္တလေး</p>
                                </div>
                            </div>
                        </div>

                        <div className="testimonial-card glass-card">
                            <div className="testimonial-card__stars">⭐⭐⭐⭐⭐</div>
                            <p className="testimonial-card__text">
                                "ကျွန်တော် ဆေးဆိုင်အသစ်ဖွင့်တော့မှာမို့
                                ဒီစာအုပ်က အင်မတန်အသုံးဝင်ပါတယ်။
                                ဘယ်ဆေးတွေ stock ထားရမလဲဆိုတာ
                                ရှင်းရှင်းလင်းလင်း သိရပါပြီ။"
                            </p>
                            <div className="testimonial-card__author">
                                <div className="testimonial-card__avatar">👨</div>
                                <div>
                                    <strong>ကိုမင်းသူ</strong>
                                    <p>ဆေးဆိုင်လုပ်ငန်းရှင်၊ ရန်ကုန်</p>
                                </div>
                            </div>
                        </div>

                        <div className="testimonial-card glass-card">
                            <div className="testimonial-card__stars">⭐⭐⭐⭐⭐</div>
                            <p className="testimonial-card__text">
                                "ဆေးဝါးပညာကျောင်းသားတစ်ယောက်အနေနဲ့
                                ဒီစာအုပ်က practical knowledge အများကြီးရပါတယ်။
                                ဆရာရေးတဲ့ YouTube videos တွေလည်း
                                အင်မတန်ကောင်းပါတယ်။"
                            </p>
                            <div className="testimonial-card__author">
                                <div className="testimonial-card__avatar">👩‍🎓</div>
                                <div>
                                    <strong>မအေးမြတ်နိုး</strong>
                                    <p>B.Pharm ကျောင်းသူ</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <hr className="section-divider" />

            {/* ===== FAQ SECTION ===== */}
            <section className="faq section" id="faq">
                <div className="container">
                    <span className="badge">❓ မေးလေ့ရှိသော မေးခွန်းများ</span>
                    <h2 className="section-title" style={{ marginTop: '1rem' }}>
                        မကြာခဏ မေးလေ့ရှိသော
                        <span className="highlight"> မေးခွန်းများ</span>
                    </h2>
                    <p className="section-subtitle">
                        သင်သိလိုသော အကြောင်းအရာများကို အောက်တွင် ဖော်ပြထားပါတယ်
                    </p>

                    <div className="faq__list" style={{ marginTop: '2rem', maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto' }}>
                        <div className="faq__item glass-card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
                            <h4 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>📕 ဒီစာအုပ်က တကယ် အခမဲ့လား?</h4>
                            <p style={{ opacity: '0.8' }}>ဟုတ်ကဲ့ အပြည့်အဝ အခမဲ့ပါ။ ဘာမှ ဝယ်ယူဖို့မလိုပါဘူး။ သင့်နာမည်နဲ့ အီးမေးလ်ထည့်ပြီး ချက်ချင်း ဒေါင်းလုဒ်လုပ်နိုင်ပါတယ်။</p>
                        </div>

                        <div className="faq__item glass-card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
                            <h4 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>👨‍⚕️ ဒီစာအုပ်ထဲက အကြောင်းအရာတွေ မှန်ကန်ပါသလား?</h4>
                            <p style={{ opacity: '0.8' }}>ဟုတ်ကဲ့ အားလုံးကို အထွေထွေရောဂါကု ဆရာဝန်ဟာ ဆေးဝါးပညာ အရ အတိအကျ စစ်ဆေးပြီး ရေးသားထားတာ ဖြစ်ပါတယ်။</p>
                        </div>

                        <div className="faq__item glass-card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
                            <h4 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>💊 ဆေးဆိုင် မဖွင့်သေးသူတွေအတွက်လည်း အသုံးဝင်ပါသလား?</h4>
                            <p style={{ opacity: '0.8' }}>ဟုတ်ကဲ့ အလွန်အသုံးဝင်ပါတယ်။ အိမ်မှာ ထားရမည့် ဆေးဝါးများ၊ မိသားစု ကျန်းမာရေး အတွက်လည်း လုံးဝအသုံးဝင်ပါတယ်။</p>
                        </div>

                        <div className="faq__item glass-card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
                            <h4 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>🤝 နောက်ထပ် အကူအညီလိုရင် ဘယ်လိုဆက်သွယ်ရမလဲ?</h4>
                            <p style={{ opacity: '0.8' }}>Telegram Channel ထဲဝင်လိုက်ပါ။ မေးခွန်းတွေကို တိုက်ရိုက် မေးလို့ရပါတယ်။</p>
                        </div>
                    </div>
                </div>
            </section>

            <hr className="section-divider" />

            {/* ===== LEAD FORM SECTION ===== */}
            <LeadForm />

            <hr className="section-divider" />

            {/* ===== CONSULTATION SECTION ===== */}
            <section className="consultation section" id="consultation">
                <div className="container">
                    <span className="badge">👨‍⚕️ အွန်လိုင်း တိုင်ပင်ပေးခြင်း</span>
                    <h2 className="section-title" style={{ marginTop: '1rem' }}>
                        ဆရာဝန်နှင့် တိုင်ပင်ဆွေးနွေးရန် ချိန်းဆိုပါ
                    </h2>
                    <p className="section-subtitle">
                        🎬 ဗီဒီယိုခေါ်ဆိုမှု မိနစ် ၃၀ &nbsp;•&nbsp; ၁၀,၀၀၀ ကျပ် &nbsp;•&nbsp; ကြိုက်ရာ channel ရွေးနိုင်သည်
                    </p>

                    <div className="booking-wizard">

                        {/* ── STEP 1 : Date ── */}
                        <div className={`booking-step glass-card ${selectedDate ? 'booking-step--done' : 'booking-step--active'}`}>
                            <div className="booking-step__head">
                                <div className={`booking-step__num ${selectedDate ? 'done' : ''}`}>
                                    {selectedDate ? '✓' : '1'}
                                </div>
                                <div>
                                    <div className="booking-step__title">နေ့ရက် ရွေးချယ်ပါ</div>
                                    {selectedDate && (
                                        <div className="booking-step__selected">
                                            📅 {new Date(selectedDate).toLocaleDateString('my-MM', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                    )}
                                </div>
                                {selectedDate && (
                                    <button
                                        type="button"
                                        className="booking-step__change"
                                        onClick={() => { setSelectedDate(''); setSelectedTime('') }}
                                    >
                                        ပြောင်းရန်
                                    </button>
                                )}
                            </div>

                            {!selectedDate && (
                                <div className="booking-calendar">
                                    <div className="booking-calendar__header">
                                        <button type="button" className="booking-calendar__nav"
                                            onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>
                                            ◀
                                        </button>
                                        <h3 className="booking-calendar__month">{monthLabel}</h3>
                                        <button type="button" className="booking-calendar__nav"
                                            onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>
                                            ▶
                                        </button>
                                    </div>
                                    <div className="booking-calendar__weekdays">
                                        {['တနင်္ဂနွေ','တနင်္လာ','အင်္ဂါ','ဗုဒ္ဓဟူး','ကြာသပတေး','သောကြာ','စနေ'].map(d => (
                                            <span key={d}>{d.slice(0, 2)}</span>
                                        ))}
                                    </div>
                                    <div className="booking-calendar__grid">
                                        {calendarDays.map(item => (
                                            <button
                                                key={item.key}
                                                type="button"
                                                disabled={item.disabled}
                                                className={`booking-calendar__day ${item.empty ? 'booking-calendar__day--empty' : ''} ${selectedDate === item.dateStr ? 'booking-calendar__day--selected' : ''}`}
                                                onClick={() => { if (!item.empty && !item.disabled) setSelectedDate(item.dateStr) }}
                                            >
                                                {item.day}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── STEP 2 : Time ── */}
                        <div className={`booking-step glass-card ${!selectedDate ? 'booking-step--locked' : selectedTime ? 'booking-step--done' : 'booking-step--active'}`}>
                            <div className="booking-step__head">
                                <div className={`booking-step__num ${selectedTime ? 'done' : ''}`}>
                                    {selectedTime ? '✓' : '2'}
                                </div>
                                <div>
                                    <div className="booking-step__title">အချိန် ရွေးချယ်ပါ</div>
                                    {selectedTime && (
                                        <div className="booking-step__selected">
                                            ⏰ {(() => {
                                                const h = parseInt(selectedTime.split(':')[0])
                                                const m = selectedTime.split(':')[1]
                                                return `${h % 12 || 12}:${m} ${h >= 12 ? 'ညနေ' : 'နံနက်'}`
                                            })()}
                                        </div>
                                    )}
                                </div>
                                {selectedTime && selectedDate && (
                                    <button type="button" className="booking-step__change" onClick={() => setSelectedTime('')}>
                                        ပြောင်းရန်
                                    </button>
                                )}
                            </div>

                            {selectedDate && !selectedTime && (
                                <div className="booking-calendar__times">
                                    <p className="time-grid-hint">ဆရာဝန်နှင့် ဆေးဝါးပညာဆွေးနွေးနိုင်သော အချိန်ကို ရွေးပါ</p>
                                    <div className="booking-calendar__time-grid">
                                        {availableTimes.map(time => (
                                            <button
                                                key={time}
                                                type="button"
                                                className={`booking-calendar__time ${selectedTime === time ? 'booking-calendar__time--selected' : ''}`}
                                                onClick={() => setSelectedTime(time)}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!selectedDate && (
                                <p className="booking-step__lock-msg">ဦးစွာ နေ့ရက်ကို ရွေးပေးပါ</p>
                            )}
                        </div>

                        {/* ── STEP 3 : Details & Book ── */}
                        <div className={`booking-step glass-card ${!selectedTime ? 'booking-step--locked' : 'booking-step--active'}`}>
                            <div className="booking-step__head">
                                <div className="booking-step__num">3</div>
                                <div>
                                    <div className="booking-step__title">အချက်အလက်ဖြည့်ပြီး တင်ပို့ပါ</div>
                                    <div className="booking-step__sub">နာမည်၊ ဖုန်း၊ channel ရွေးချယ်ပြီး booking တင်ပါ</div>
                                </div>
                            </div>

                            {selectedTime ? (
                                <div className="booking-step__form">
                                    <BookingForm initialDate={selectedDate} initialTime={selectedTime} />
                                </div>
                            ) : (
                                <p className="booking-step__lock-msg">နေ့ရက်နှင့် အချိန် ရွေးပြီးမှ ဖြည့်နိုင်ပါမည်</p>
                            )}
                        </div>

                    </div>
                </div>
            </section>

            <hr className="section-divider" />

            {/* ===== FINAL CTA ===== */}
            <section className="final-cta section">
                <div className="container">
                    <div className="final-cta__content glass-card">
                        <h2 className="final-cta__title">
                            🕐 ဒီစာအုပ်ကို <span className="highlight">ယခုပဲ</span> ရယူလိုက်ပါ
                        </h2>
                        <p className="final-cta__text">
                            ဆေးဝါးပညာရှင်တစ်ဦး အချိန်ယူ ရေးသားထားသော
                            ဒီစာအုပ်ကို အခမဲ့ရယူပြီး သင့်ဆေးဆိုင်ကို
                            အဆင့်မြှင့်တင်လိုက်ပါ
                        </p>
                        <button className="btn btn-primary btn-lg btn-pulse" onClick={scrollToForm}>
                            📥 အခမဲ့ ရယူမည်
                        </button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}

export default LandingPage
