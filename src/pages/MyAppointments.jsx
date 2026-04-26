import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './MyAppointments.css'

function MyAppointments() {
    const [searchTerm, setSearchTerm] = useState('')
    const [searchType, setSearchType] = useState('phone') // phone or email
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
            const response = await fetch(`/api/bookings/search?${params.toString()}`)

            if (!response.ok) {
                throw new Error('Failed to fetch appointments')
            }

            const data = await response.json()
            setAppointments(data || [])
        } catch (error) {
            console.error('Search error:', error)
            alert('ရှာဖွေမှု မအောင်မြင်ပါ။ နောက်မှ ထပ်ကြိုးစားပါ။')
            setAppointments([])
        } finally {
            setIsSearching(false)
        }
    }

    const getStatusBadge = (status) => {
        const statusMap = {
            'pending_payment': { text: 'ငွေပေးချေရန်', class: 'status-pending' },
            'payment_submitted': { text: 'ငွေပေးချေမှု စောင့်ဆိုင်းနေ', class: 'status-submitted' },
            'confirmed': { text: 'အတည်ပြုပြီး', class: 'status-confirmed' },
            'rejected': { text: 'ပယ်ဖျက်ပြီး', class: 'status-rejected' },
            'completed': { text: 'ပြီးဆုံးပြီး', class: 'status-completed' }
        }
        return statusMap[status] || { text: status || 'N/A', class: 'status-unknown' }
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A'
        const date = new Date(dateStr)
        return date.toLocaleDateString('my-MM', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatTime = (timeStr) => {
        if (!timeStr) return 'N/A'
        const source = timeStr.includes('T') ? timeStr : timeStr.replace(' ', 'T')
        const date = new Date(source)
        const [hours, minutes] = [date.getHours(), String(date.getMinutes()).padStart(2, '0')]
        const hour = Number(hours)
        const ampm = hour >= 12 ? 'ညနေ' : 'နံနက်'
        const displayHour = hour % 12 || 12
        return `${displayHour}:${minutes} ${ampm}`
    }

    const resolveStatus = (apt) => {
        if (apt.BookingStatus) return apt.BookingStatus
        if (apt.PaymentStatus) return apt.PaymentStatus
        if (typeof apt.ConsultationType === 'string' && apt.ConsultationType.startsWith('status:')) {
            return apt.ConsultationType.replace('status:', '')
        }
        if (apt.PaymentScreenshot) return 'payment_submitted'
        return 'pending_payment'
    }

    return (
        <div className="my-appointments-page">
            <Navbar />

            <section className="appointments-hero">
                <div className="appointments-hero__bg-orbs">
                    <div className="appointments-hero__orb appointments-hero__orb--1"></div>
                    <div className="appointments-hero__orb appointments-hero__orb--2"></div>
                </div>

                <div className="container">
                    <div className="appointments-content animate-scale">
                        <div className="appointments-checkmark">
                            <span>📅</span>
                        </div>

                        <h1 className="appointments-title">
                            ကျွန်တော့်ချိန်းဆိုမှုများ
                        </h1>

                        <p className="appointments-subtitle">
                            သင့်ဖုန်းနံပါတ် သို့မဟုတ် အီးမေးလ်ဖြင့် ချိန်းဆိုမှုများကို ရှာဖွေပါ။
                        </p>

                        <div className="search-card glass-card">
                            <div className="search-type-toggle">
                                <button
                                    className={`toggle-btn ${searchType === 'phone' ? 'active' : ''}`}
                                    onClick={() => setSearchType('phone')}
                                >
                                    📱 ဖုန်းနံပါတ်
                                </button>
                                <button
                                    className={`toggle-btn ${searchType === 'email' ? 'active' : ''}`}
                                    onClick={() => setSearchType('email')}
                                >
                                    📧 အီးမေးလ်
                                </button>
                            </div>

                            <div className="search-input-group">
                                <input
                                    type={searchType === 'phone' ? 'tel' : 'email'}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={
                                        searchType === 'phone'
                                            ? 'ဖုန်းနံပါတ် ထည့်ပါ (ဥပမာ: 09421068582)'
                                            : 'အီးမေးလ် ထည့်ပါ (ဥပမာ: example@email.com)'
                                    }
                                    className="search-input"
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <button
                                    onClick={handleSearch}
                                    disabled={isSearching}
                                    className="btn btn-primary search-btn"
                                >
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
                                        <p>ဤဖုန်းနံပါတ်/အီးမေးလ်ဖြင့ ချိန်းဆိုမှုများ မရှိသေးပါ။</p>
                                        <Link to="/#consultation" className="btn btn-primary">
                                            ချိန်းဆိုရန်
                                        </Link>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="results-title">
                                            တွေ့ရှိသော ချိန်းဆိုမှုများ ({appointments.length})
                                        </h2>
                                        <div className="appointments-list">
                                            {appointments.map((apt, index) => {
                                                const statusInfo = getStatusBadge(resolveStatus(apt))
                                                return (
                                                    <div key={apt.Id || index} className="appointment-card glass-card">
                                                        <div className="appointment-header">
                                                            <h3 className="appointment-name">{apt.Name || 'N/A'}</h3>
                                                            <span className={`status-badge ${statusInfo.class}`}>
                                                                {statusInfo.text}
                                                            </span>
                                                        </div>

                                                        <div className="appointment-details">
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

                                                        <div className="appointment-actions">
                                                            <Link
                                                                to={`/booking-confirmation?id=${apt.Id || apt.id}&name=${encodeURIComponent(apt.Name || '')}&date=${encodeURIComponent(apt.PreferredDate || '')}&time=${encodeURIComponent(apt.PreferredTime || '')}`}
                                                                className="btn btn-secondary btn-sm"
                                                            >
                                                                အသေးစိတ်ကြည့်ရန်
                                                            </Link>
                                                            {resolveStatus(apt) === 'confirmed' && (
                                                                <Link
                                                                    to={`/medical-records-upload?id=${apt.Id || apt.id}`}
                                                                    className="btn btn-primary btn-sm"
                                                                >
                                                                    မှတ်တမ်းတင်ရန်
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </div>
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

export default MyAppointments
