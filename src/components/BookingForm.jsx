import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './BookingForm.css'

const CHANNELS = [
    { value: 'telegram',    label: 'Telegram',    icon: '✈️',  color: '#2aabee' },
    { value: 'viber',       label: 'Viber',       icon: '📳',  color: '#7360f2' },
    { value: 'whatsapp',    label: 'WhatsApp',    icon: '💬',  color: '#25d366' },
    { value: 'zoom',        label: 'Zoom',        icon: '🎥',  color: '#2d8cff' },
]

function getSectionFromTime(time) {
    if (!time) return ''
    return parseInt(time.split(':')[0]) < 12 ? 'morning' : 'evening'
}

function formatTimeDisplay(time) {
    if (!time) return ''
    const [h, m] = time.split(':').map(Number)
    const ampm = h >= 12 ? 'ညနေ' : 'နံနက်'
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}

function formatDateDisplay(dateStr) {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('my-MM', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
}

function BookingForm({ initialDate = '', initialTime = '' }) {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        service_type: 'general',
        name: '',
        age: '',
        gender: '',
        email: '',
        phone: '',
        chief_complaints: '',
        preferred_date: initialDate,
        preferred_time: initialTime,
        booking_section: getSectionFromTime(initialTime),
        problem_description: '',
        medical_records_agreement: false,
        preferred_channel: 'telegram'
    })
    const [errors, setErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')

    // Sync when parent updates date/time from calendar
    useEffect(() => {
        if (!initialDate && !initialTime) return
        setFormData(prev => ({
            ...prev,
            preferred_date: initialDate || prev.preferred_date,
            preferred_time: initialTime || prev.preferred_time,
            booking_section: getSectionFromTime(initialTime || prev.preferred_time)
        }))
    }, [initialDate, initialTime])

    const isDateLocked = Boolean(initialDate)
    const isTimeLocked = Boolean(initialTime)

    const validate = () => {
        const e = {}
        if (!formData.name.trim())               e.name               = 'အမည်ထည့်ပေးပါ'
        if (!formData.email.trim())              e.email              = 'အီးမေးလ်ထည့်ပေးပါ'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
                                                 e.email              = 'အီးမေးလ် မှားနေပါသည်'
        if (!formData.phone.trim())              e.phone              = 'ဖုန်းနံပါတ်ထည့်ပေးပါ'
        else if (!/^[0-9+\-\s()]{7,15}$/.test(formData.phone))
                                                 e.phone              = 'ဖုန်းနံပါတ် မှားနေပါသည်'
        if (!formData.preferred_date)            e.preferred_date     = 'နေ့ရက်ရွေးချယ်ပေးပါ'
        if (!formData.preferred_time)            e.preferred_time     = 'အချိန်ရွေးချယ်ပေးပါ'
        if (!formData.problem_description.trim())e.problem_description= 'ပြဿနာအကြောင်းအရာ ရေးပေးပါ'
        if (!formData.medical_records_agreement) e.medical_records_agreement = 'သဘောတူပေးရန် လိုအပ်ပါသည်'
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
            ...(name === 'preferred_time' ? { booking_section: getSectionFromTime(value) } : {})
        }))
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitError('')
        if (!validate()) return
        setIsSubmitting(true)
        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            const text = await response.text()
            let responseData
            try { responseData = text ? JSON.parse(text) : {} } catch { throw new Error(`Server error (${response.status})`) }
            if (!response.ok) throw new Error(responseData.error || 'Booking submission failed')
            navigate('/payment-instructions', {
                state: { bookingData: { ...formData, id: responseData.id || responseData.Id } }
            })
        } catch (err) {
            console.error('Booking error:', err)
            setSubmitError(`မအောင်မြင်ပါ: ${err.message}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="booking-form">
            <form onSubmit={handleSubmit} className="booking-form__form">

                {/* ── Locked date/time summary ── */}
                {(isDateLocked || isTimeLocked) && (
                    <div className="booking-form__locked-summary">
                        <div className="locked-summary__item">
                            <span className="locked-summary__icon">📅</span>
                            <div>
                                <div className="locked-summary__label">နေ့ရက်</div>
                                <div className="locked-summary__value">
                                    {formData.preferred_date ? formatDateDisplay(formData.preferred_date) : '—'}
                                </div>
                            </div>
                        </div>
                        <div className="locked-summary__divider" />
                        <div className="locked-summary__item">
                            <span className="locked-summary__icon">⏰</span>
                            <div>
                                <div className="locked-summary__label">အချိန်</div>
                                <div className="locked-summary__value">
                                    {formData.preferred_time ? formatTimeDisplay(formData.preferred_time) : '—'}
                                </div>
                            </div>
                        </div>
                        <div className="locked-summary__divider" />
                        <div className="locked-summary__item">
                            <span className="locked-summary__icon">⏱</span>
                            <div>
                                <div className="locked-summary__label">ကြာချိန်</div>
                                <div className="locked-summary__value">မိနစ် ၃၀</div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="booking-form__grid">
                    {/* Name */}
                    <div className="form-group">
                        <label htmlFor="name" className="form-label">
                            အမည် <span className="required">*</span>
                        </label>
                        <input
                            type="text" id="name" name="name"
                            value={formData.name} onChange={handleChange}
                            className={`form-input ${errors.name ? 'error' : ''}`}
                            placeholder="သင့်အမည်ကို ထည့်ပေးပါ"
                        />
                        {errors.name && <span className="error-message">{errors.name}</span>}
                    </div>

                    {/* Phone */}
                    <div className="form-group">
                        <label htmlFor="phone" className="form-label">
                            ဖုန်းနံပါတ် <span className="required">*</span>
                        </label>
                        <input
                            type="tel" id="phone" name="phone"
                            value={formData.phone} onChange={handleChange}
                            className={`form-input ${errors.phone ? 'error' : ''}`}
                            placeholder="09xxxxxxxxx"
                        />
                        {errors.phone && <span className="error-message">{errors.phone}</span>}
                    </div>

                    {/* Email */}
                    <div className="form-group form-group--full">
                        <label htmlFor="email" className="form-label">
                            အီးမေးလ် <span className="required">*</span>
                        </label>
                        <input
                            type="email" id="email" name="email"
                            value={formData.email} onChange={handleChange}
                            className={`form-input ${errors.email ? 'error' : ''}`}
                            placeholder="your@email.com"
                        />
                        {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>

                    {/* Date – only show if NOT locked from calendar */}
                    {!isDateLocked && (
                        <div className="form-group">
                            <label htmlFor="preferred_date" className="form-label">
                                နှစ်သက်ရာ နေ့ရက် <span className="required">*</span>
                            </label>
                            <input
                                type="date" id="preferred_date" name="preferred_date"
                                value={formData.preferred_date} onChange={handleChange}
                                className={`form-input ${errors.preferred_date ? 'error' : ''}`}
                                min={new Date().toISOString().split('T')[0]}
                            />
                            {errors.preferred_date && <span className="error-message">{errors.preferred_date}</span>}
                        </div>
                    )}

                    {/* Time – only show if NOT locked from calendar */}
                    {!isTimeLocked && (
                        <div className="form-group">
                            <label htmlFor="preferred_time" className="form-label">
                                နှစ်သက်ရာ အချိန် <span className="required">*</span>
                            </label>
                            <select
                                id="preferred_time" name="preferred_time"
                                value={formData.preferred_time} onChange={handleChange}
                                className={`form-input ${errors.preferred_time ? 'error' : ''}`}
                            >
                                <option value="">အချိန်ရွေးချယ်ပါ</option>
                                <option value="09:00">၉:၀၀ နံနက်</option>
                                <option value="10:00">၁၀:၀၀ နံနက်</option>
                                <option value="11:00">၁၁:၀၀ နံနက်</option>
                                <option value="14:00">၂:၀၀ ညနေ</option>
                                <option value="15:00">၃:၀၀ ညနေ</option>
                                <option value="16:00">၄:၀၀ ညနေ</option>
                                <option value="17:00">၅:၀၀ ညနေ</option>
                                <option value="18:00">၆:၀၀ ညနေ</option>
                                <option value="19:00">၇:၀၀ ညနေ</option>
                                <option value="20:00">၈:၀၀ ညနေ</option>
                            </select>
                            {errors.preferred_time && <span className="error-message">{errors.preferred_time}</span>}
                        </div>
                    )}

                    {/* Problem description */}
                    <div className="form-group form-group--full">
                        <label htmlFor="problem_description" className="form-label">
                            ကျန်းမာရေးပြဿနာ <span className="required">*</span>
                        </label>
                        <textarea
                            id="problem_description" name="problem_description"
                            value={formData.problem_description} onChange={handleChange}
                            className={`form-input form-textarea ${errors.problem_description ? 'error' : ''}`}
                            placeholder="သင့်ကျန်းမာရေးပြဿနာကို အကျဉ်းချုပ် ရေးပေးပါ"
                            rows="3"
                        />
                        {errors.problem_description && <span className="error-message">{errors.problem_description}</span>}
                    </div>

                    {/* ── Channel picker ── */}
                    <div className="form-group form-group--full">
                        <label className="form-label">
                            📡 တိုင်ပင်ဆွေးနွေးမည့် Channel ရွေးချယ်ပါ <span className="required">*</span>
                        </label>
                        <p className="form-hint">ဆရာဝန်က သင်ရွေးထားသော channel မှတဆင့် သတ်မှတ်ချိန်တွင် ဆက်သွယ်ပါမည်</p>
                        <div className="channel-picker">
                            {CHANNELS.map(ch => (
                                <button
                                    key={ch.value}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, preferred_channel: ch.value }))}
                                    className={`channel-pill ${formData.preferred_channel === ch.value ? 'channel-pill--active' : ''}`}
                                    style={{ '--ch-color': ch.color }}
                                >
                                    <span className="channel-pill__icon">{ch.icon}</span>
                                    <span className="channel-pill__label">{ch.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Medical records agreement */}
                    <div className="form-group form-group--full">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="medical_records_agreement"
                                checked={formData.medical_records_agreement}
                                onChange={handleChange}
                                className="checkbox-input"
                            />
                            <span className="checkbox-text">
                                တိုင်ပင်ချိန်မတိုင်မီ ယခင် ကျန်းမာရေးမှတ်တမ်းများကို ဆရာဝန်ထံ ပေးပို့ရန် သဘောတူပါသည်
                                <span className="required">*</span>
                            </span>
                        </label>
                        {errors.medical_records_agreement && <span className="error-message">{errors.medical_records_agreement}</span>}
                    </div>
                </div>

                {submitError && <div className="submit-error">{submitError}</div>}

                <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg btn-block">
                    {isSubmitting ? 'တင်ပို့နေသည်...' : '📅 ချိန်းဆိုမှု တင်ပို့မည်'}
                </button>
            </form>
        </div>
    )
}

export default BookingForm
