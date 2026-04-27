import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './BookingForm.css'

function BookingForm({ initialDate = '', initialTime = '' }) {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        service_type: 'general', // general, follow_up
        name: '',
        age: '',
        gender: '',
        email: '',
        phone: '',
        chief_complaints: '',
        preferred_date: '',
        preferred_time: '',
        booking_section: '', // Will be auto-calculated
        problem_description: '',
        medical_records_agreement: false,
        preferred_channel: 'telegram'
    })
    const [errors, setErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')

    useEffect(() => {
        if (!initialDate && !initialTime) return
        setFormData((prev) => {
            const nextDate = initialDate || prev.preferred_date
            const nextTime = initialTime || prev.preferred_time
            return {
                ...prev,
                preferred_date: nextDate,
                preferred_time: nextTime,
                booking_section: getSectionFromTime(nextTime)
            }
        })
    }, [initialDate, initialTime])

    // Auto-calculate booking section based on time
    const getSectionFromTime = (time) => {
        if (!time) return '';
        const hour = parseInt(time.split(':')[0]);
        return (hour < 12) ? 'morning' : 'evening';
    };

    // Get display text for section
    const getSectionDisplay = (section) => {
        const sections = {
            'morning': 'နံနက်ပိုင်း (၉:၀၀ - ၁၂:၀၀)',
            'evening': 'ညနေပိုင်း (၂:၀၀ - ၈:၀၀)'
        };
        return sections[section] || '';
    };

    const validate = () => {
        const newErrors = {}
        if (!formData.service_type) {
            newErrors.service_type = 'ဝန်ဆောင်မှုအမျိုးအစားကို ရွေးချယ်ပေးပါ'
        }
        if (!formData.name.trim()) {
            newErrors.name = 'အမည်ထည့်ပေးပါ'
        }
        if (!formData.email.trim()) {
            newErrors.email = 'အီးမေးလ်ထည့်ပေးပါ'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'အီးမေးလ် မှားနေပါသည်'
        }
        if (!formData.phone.trim()) {
            newErrors.phone = 'ဖုန်းနံပါတ်ထည့်ပေးပါ'
        } else if (!/^[0-9+\-\s()]{7,15}$/.test(formData.phone)) {
            newErrors.phone = 'ဖုန်းနံပါတ် မှားနေပါသည်'
        }
        if (!formData.preferred_date) {
            newErrors.preferred_date = 'နေ့ရက်ရွေးချယ်ပေးပါ'
        }
        if (!formData.preferred_time) {
            newErrors.preferred_time = 'အချိန်ရွေးချယ်ပေးပါ'
        }
        if (!formData.problem_description.trim()) {
            newErrors.problem_description = 'ပြဿနာအကြောင်းအရာ ရေးပေးပါ'
        }
        if (!formData.medical_records_agreement) {
            newErrors.medical_records_agreement = 'ယခင်က ကျန်းမာရေးမှတ်တမ်းများကို ပေးပို့ရန် သဘောတူပေးပါ'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData((prev) => {
            const updated = {
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            };
            // Auto-calculate section when time changes
            if (name === 'preferred_time') {
                updated.booking_section = getSectionFromTime(value);
            }
            return updated;
        })
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }))
        }
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

            // Handle non-JSON responses (e.g. 502 Bad Gateway when server is down)
            const text = await response.text()
            let responseData
            try {
                responseData = text ? JSON.parse(text) : {}
            } catch {
                throw new Error(`Server error (${response.status}): API server may not be running`)
            }

            if (!response.ok) {
                throw new Error(responseData.error || 'Booking submission failed')
            }

            // Navigate to payment instructions with booking data including Id
            navigate('/payment-instructions', {
                state: {
                    bookingData: {
                        ...formData,
                        booking_section: formData.booking_section,
                        id: responseData.id || responseData.Id // Add the record Id for updates
                    }
                },
            })
        } catch (err) {
            console.error('❌ Booking submission error:', err)
            setSubmitError(`Failed to submit booking: ${err.message}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="booking-form">
            <form onSubmit={handleSubmit} className="booking-form__form">
                <div className="booking-form__grid">
                    <div className="form-group">
                        <label htmlFor="name" className="form-label">
                            အမည် <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`form-input ${errors.name ? 'error' : ''}`}
                            placeholder="သင့်အမည်ကို ထည့်ပေးပါ"
                        />
                        {errors.name && <span className="error-message">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="email" className="form-label">
                            အီးမေးလ် <span className="required">*</span>
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`form-input ${errors.email ? 'error' : ''}`}
                            placeholder="your@email.com"
                        />
                        {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone" className="form-label">
                            ဖုန်းနံပါတ် <span className="required">*</span>
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className={`form-input ${errors.phone ? 'error' : ''}`}
                            placeholder="09xxxxxxxxx"
                        />
                        {errors.phone && <span className="error-message">{errors.phone}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="preferred_date" className="form-label">
                            နှစ်သက်ရာ နေ့ရက် <span className="required">*</span>
                        </label>
                        <input
                            type="date"
                            id="preferred_date"
                            name="preferred_date"
                            value={formData.preferred_date}
                            onChange={handleChange}
                            className={`form-input ${errors.preferred_date ? 'error' : ''}`}
                            min={new Date().toISOString().split('T')[0]}
                        />
                        {errors.preferred_date && <span className="error-message">{errors.preferred_date}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="preferred_time" className="form-label">
                            နှစ်သက်ရာ အချိန် <span className="required">*</span>
                        </label>
                        <select
                            id="preferred_time"
                            name="preferred_time"
                            value={formData.preferred_time}
                            onChange={handleChange}
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

                    {formData.booking_section && (
                        <div className="form-group form-group--full">
                            <div className="booking-section-display">
                                <span className="section-label">အပိုင်း:</span>
                                <span className={`section-value section--${formData.booking_section}`}>
                                    {getSectionDisplay(formData.booking_section)}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="form-group form-group--full">
                        <label htmlFor="problem_description" className="form-label">
                            ပြဿနာအကြောင်းအရာ <span className="required">*</span>
                        </label>
                        <textarea
                            id="problem_description"
                            name="problem_description"
                            value={formData.problem_description}
                            onChange={handleChange}
                            className={`form-input form-textarea ${errors.problem_description ? 'error' : ''}`}
                            placeholder="သင့်ကျန်းမာရေးပြဿနာကို အကျဉ်းချုပ် ရေးပေးပါ"
                            rows="4"
                        />
                        {errors.problem_description && <span className="error-message">{errors.problem_description}</span>}
                    </div>

                    <div className="form-group form-group--full">
                        <label htmlFor="preferred_channel" className="form-label">
                            ဆက်သွယ်ရန် နည်းလမ်း
                        </label>
                        <select
                            id="preferred_channel"
                            name="preferred_channel"
                            value={formData.preferred_channel}
                            onChange={handleChange}
                            className="form-input"
                        >
                            <option value="telegram">Telegram</option>
                            <option value="viber">Viber</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="zoom">Zoom</option>
                            <option value="google_meet">Google Meet</option>
                        </select>
                    </div>

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
                                တိုင်ပင်ချိန်မတိုင်မီ ယခင်က ကျန်းမာရေးမှတ်တမ်းများကို ဆရာဝန်ထံ ပေးပို့ရန် သဘောတူပါသည်
                                <span className="required">*</span>
                            </span>
                        </label>
                        {errors.medical_records_agreement && <span className="error-message">{errors.medical_records_agreement}</span>}
                    </div>
                </div>

                {submitError && (
                    <div className="submit-error">
                        {submitError}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary btn-lg btn-block"
                >
                    {isSubmitting ? 'တင်ပို့နေသည်...' : 'ချိန်းဆိုမှု တင်ပို့ခြင်း'}
                </button>
            </form>
        </div>
    )
}

export default BookingForm