import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './LeadForm.css'

// NocoDB API configuration
const NOCODB_API_URL = 'https://db.drtunmyatwin.com'
const NOCODB_TABLE_ID = 'mz6cj5r8sxt9oif'
const NOCODB_API_TOKEN = '0bXBuEIqxEBHjqRWceYkHw74c5FRe3AR7tCpAgy3'

function LeadForm() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
    })
    const [errors, setErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')

    const validate = () => {
        const newErrors = {}
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
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
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
            // Submit to NocoDB directly (works locally without proxy)
            console.log('Submitting form data to NocoDB:', formData)

            const response = await fetch(
                `${NOCODB_API_URL}/api/v2/tables/${NOCODB_TABLE_ID}/records`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'xc-token': NOCODB_API_TOKEN
                    },
                    body: JSON.stringify({
                        Name: formData.name,
                        Email: formData.email,
                        Phone: formData.phone,
                        PreferredChannel: formData.preferred_channel
                    }),
                }
            )

            console.log('NocoDB Response Status:', response.status)
            console.log('NocoDB Response OK:', response.ok)

            const responseData = await response.text()
            console.log('NocoDB Response Body:', responseData)

            if (!response.ok) {
                throw new Error(`NocoDB submission failed: ${response.status} - ${responseData}`)
            }

            console.log('✅ Form successfully saved to NocoDB')

            // Navigate to thank you page
            navigate('/thank-you', {
                state: {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    preferred_channel: formData.preferred_channel
                },
            })
        } catch (err) {
            console.error('❌ Submission error:', err)
            setSubmitError(`Failed to submit form: ${err.message}`)
            setIsSubmitting(false)
            // DO NOT navigate away - show error to user
        }
    }

    return (
        <section className="lead-form-section section" id="lead-form">
            <div className="container">
                <div className="lead-form-wrapper">
                    <div className="lead-form-header">
                        <span className="badge badge-gold">🎁 အခမဲ့</span>
                        <h2 className="lead-form-title">
                            အခမဲ့စာအုပ်<span className="highlight"> ယခုပဲ</span> ရယူလိုက်ပါ
                        </h2>
                        <p className="lead-form-subtitle">
                            အောက်ပါ Form ကိုဖြည့်ပြီး စာအုပ်ကို Telegram Bot မှတစ်ဆင့်
                            အလိုအလျောက်ရယူပါ
                        </p>
                    </div>

                    <form className="lead-form" onSubmit={handleSubmit} noValidate>
                        <div className={`form-group ${errors.name ? 'form-group--error' : ''}`}>
                            <label htmlFor="name">
                                <span className="form-icon">👤</span> အမည်
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                placeholder="သင့်အမည်ကို ထည့်ပါ"
                                value={formData.name}
                                onChange={handleChange}
                                disabled={isSubmitting}
                            />
                            {errors.name && <span className="form-error">{errors.name}</span>}
                        </div>

                        <div className={`form-group ${errors.email ? 'form-group--error' : ''}`}>
                            <label htmlFor="email">
                                <span className="form-icon">📧</span> အီးမေးလ်
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="example@email.com"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={isSubmitting}
                            />
                            {errors.email && <span className="form-error">{errors.email}</span>}
                        </div>

                        <div className={`form-group ${errors.phone ? 'form-group--error' : ''}`}>
                            <label htmlFor="phone">
                                <span className="form-icon">📱</span> ဖုန်းနံပါတ်
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                placeholder="09xxxxxxxxx"
                                value={formData.phone}
                                onChange={handleChange}
                                disabled={isSubmitting}
                            />
                            {errors.phone && <span className="form-error">{errors.phone}</span>}
                        </div>

                        {submitError && (
                            <div className="form-submit-error">{submitError}</div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg btn-pulse lead-form-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="spinner"></span>
                                    ပေးပို့နေပါသည်...
                                </>
                            ) : (
                                <>
                                    📥 အခမဲ့စာအုပ် ရယူမည်
                                </>
                            )}
                        </button>

                        <p className="form-privacy">
                            🔒 သင့်အချက်အလက်များကို လုံခြုံစွာ ထိန်းသိမ်းထားပါသည်။
                            Spam ပို့မည်မဟုတ်ပါ။
                        </p>
                    </form>
                </div>
            </div>
        </section>
    )
}

export default LeadForm
