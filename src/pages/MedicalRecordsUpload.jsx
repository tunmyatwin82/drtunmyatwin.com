import { useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './MedicalRecordsUpload.css'

function MedicalRecordsUpload() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [bookingId, setBookingId] = useState(searchParams.get('id') || '')
    const [files, setFiles] = useState([])
    const [previews, setPreviews] = useState([])
    const [isUploading, setIsUploading] = useState(false)
    const [uploadSuccess, setUploadSuccess] = useState(false)
    const fileInputRef = useRef(null)

    // Search state
    const [searchTerm, setSearchTerm] = useState('')
    const [searchType, setSearchType] = useState('phone')
    const [isSearching, setIsSearching] = useState(false)
    const [searchResults, setSearchResults] = useState([])
    const [hasSearched, setHasSearched] = useState(false)

    const handleSearch = async () => {
        if (!searchTerm.trim()) { alert('ဖုန်းနံပါတ် သို့မဟုတ် အီးမေးလ် ထည့်ပေးပါ'); return }
        setIsSearching(true)
        setHasSearched(true)
        try {
            const params = new URLSearchParams({ type: searchType, value: searchTerm })
            const res = await fetch(`/api/bookings/search?${params.toString()}`)
            if (!res.ok) throw new Error('Search failed')
            const data = await res.json()
            setSearchResults((data || []).filter(apt =>
                apt.ConsultationType === 'status:confirmed' ||
                apt.BookingStatus === 'confirmed' ||
                apt.PaymentStatus === 'confirmed'
            ))
        } catch {
            alert('ရှာဖွေမှု မအောင်မြင်ပါ။')
            setSearchResults([])
        } finally {
            setIsSearching(false)
        }
    }

    const selectBooking = (apt) => {
        const id = String(apt.Id || apt.id)
        setBookingId(id)
        setSearchParams({ id })
    }

    const addFiles = (selectedFiles) => {
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
        const maxSize = 10 * 1024 * 1024

        const valid = selectedFiles.filter(f => {
            if (!validTypes.includes(f.type)) { alert(`${f.name} — JPG, PNG, PDF သာ လက်ခံသည်`); return false }
            if (f.size > maxSize) { alert(`${f.name} — ဖိုင်အရွယ်အစား 10MB ကျော်သည်`); return false }
            return true
        })

        if (!valid.length) return

        setFiles(prev => [...prev, ...valid])
        valid.forEach(f => {
            if (f.type.startsWith('image/')) {
                const reader = new FileReader()
                reader.onloadend = () =>
                    setPreviews(prev => [...prev, { name: f.name, url: reader.result, type: f.type }])
                reader.readAsDataURL(f)
            } else {
                setPreviews(prev => [...prev, { name: f.name, url: null, type: f.type }])
            }
        })
    }

    const handleFileChange = (e) => {
        addFiles(Array.from(e.target.files))
        // Reset input so same file can be re-added after removal
        e.target.value = ''
    }

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
        setPreviews(prev => prev.filter((_, i) => i !== index))
    }

    const handleUpload = async () => {
        if (!files.length) { alert('ကျန်းမာရေးမှတ်တမ်းများ ရွေးချယ်ရန် လိုအပ်ပါသည်'); return }
        if (!bookingId) { alert('Booking ID မတွေ့ပါ။'); return }
        setIsUploading(true)
        try {
            const formData = new FormData()
            files.forEach(f => formData.append('files', f))
            formData.append('bookingId', bookingId)
            const res = await fetch(`/api/bookings/${bookingId}/medical-records`, {
                method: 'PATCH', body: formData
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`)
            setUploadSuccess(true)
        } catch (err) {
            alert(`မအောင်မြင်ပါ: ${err.message}`)
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="mr-page">
            <Navbar />

            <div className="mr-bg-orbs">
                <div className="mr-orb mr-orb--1" />
                <div className="mr-orb mr-orb--2" />
            </div>

            <div className="container mr-container">

                {/* Header */}
                <div className="mr-header">
                    <div className="mr-header__icon">📋</div>
                    <h1 className="mr-header__title">ကျန်းမာရေးမှတ်တမ်းများ တင်ပို့ရန်</h1>
                    <p className="mr-header__sub">
                        တိုင်ပင်ဆွေးနွေးမှုမတိုင်မီ ဆေးစစ်ချက်များ၊ ဓာတ်ခွဲရလဒ်များ၊ ဆေးညွှန်းစာများ တင်ပါ
                    </p>
                </div>

                {/* ── Search booking (no id in URL) ── */}
                {!bookingId && !uploadSuccess && (
                    <div className="mr-card glass-card">
                        <div className="mr-card__title">ချိန်းဆိုမှု ရှာဖွေရန်</div>
                        <p className="mr-card__sub">ဖုန်းနံပါတ် သို့မဟုတ် အီးမေးလ်ဖြင့် ရှာဖွေပါ (အတည်ပြုပြီးသော bookings သာ ပြသမည်)</p>

                        <div className="mr-search-toggle">
                            <button
                                className={`mr-toggle-btn ${searchType === 'phone' ? 'active' : ''}`}
                                onClick={() => setSearchType('phone')}
                            >📱 ဖုန်းနံပါတ်</button>
                            <button
                                className={`mr-toggle-btn ${searchType === 'email' ? 'active' : ''}`}
                                onClick={() => setSearchType('email')}
                            >📧 အီးမေးလ်</button>
                        </div>

                        <div className="mr-search-row">
                            <input
                                type={searchType === 'phone' ? 'tel' : 'email'}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                placeholder={searchType === 'phone' ? '09xxxxxxxxx' : 'example@email.com'}
                                className="form-input"
                            />
                            <button onClick={handleSearch} disabled={isSearching} className="btn btn-primary">
                                {isSearching ? 'ရှာနေ...' : '🔍 ရှာမည်'}
                            </button>
                        </div>

                        {hasSearched && (
                            searchResults.length === 0 ? (
                                <p className="mr-empty">အတည်ပြုပြီးသော ချိန်းဆိုမှုများ မတွေ့ပါ</p>
                            ) : (
                                <div className="mr-results">
                                    {searchResults.map(apt => (
                                        <button
                                            key={apt.Id || apt.id}
                                            className="mr-result-item glass-card"
                                            onClick={() => selectBooking(apt)}
                                        >
                                            <strong>{apt.Name}</strong>
                                            <span>{apt.PreferredDate} {apt.PreferredTime?.split(' ')[1]?.slice(0, 5) || ''}</span>
                                            <small>ID: {apt.Id || apt.id} &nbsp;✅ အတည်ပြုပြီး</small>
                                        </button>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                )}

                {/* ── Upload area (booking id known) ── */}
                {bookingId && !uploadSuccess && (
                    <div className="mr-card glass-card">
                        <div className="mr-card__title">မှတ်တမ်းများ တင်ပို့ရန်</div>
                        <div className="mr-booking-badge">Booking ID: {bookingId}</div>

                        {/* Hidden file input — triggered only by label */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/jpeg,image/png,image/jpg,application/pdf"
                            multiple
                            className="mr-file-input"
                            id="mr-file-input"
                        />

                        {/* Drop zone — label only, no wrapping onClick div */}
                        {files.length === 0 && (
                            <label htmlFor="mr-file-input" className="mr-drop-zone">
                                <span className="mr-drop-zone__icon">📤</span>
                                <span className="mr-drop-zone__text">ဤနေရာကို နှိပ်ပြီး ဖိုင်ရွေးပါ</span>
                                <span className="mr-drop-zone__hint">JPG · PNG · PDF &nbsp;(တစ်ဖိုင် အများဆုံး 10MB)</span>
                            </label>
                        )}

                        {/* File list */}
                        {files.length > 0 && (
                            <div className="mr-file-list">
                                {previews.map((p, i) => (
                                    <div key={i} className="mr-file-item">
                                        <div className="mr-file-item__preview">
                                            {p.url
                                                ? <img src={p.url} alt={p.name} className="mr-file-item__img" />
                                                : <span className="mr-file-item__pdf">📄</span>
                                            }
                                        </div>
                                        <span className="mr-file-item__name">{p.name}</span>
                                        <button
                                            type="button"
                                            className="mr-file-item__remove"
                                            onClick={() => removeFile(i)}
                                            title="ဖယ်ရှားရန်"
                                        >✕</button>
                                    </div>
                                ))}

                                {/* Add more button */}
                                <label htmlFor="mr-file-input" className="mr-add-more">
                                    <span>＋</span>
                                    <span>နောက်ထပ်ဖိုင် ထပ်ထည့်ရန်</span>
                                </label>
                            </div>
                        )}

                        <button
                            onClick={handleUpload}
                            disabled={isUploading || !files.length}
                            className="btn btn-primary btn-lg btn-block mr-submit-btn"
                        >
                            {isUploading
                                ? '⏳ တင်ပို့နေသည်...'
                                : `📤 မှတ်တမ်း ${files.length ? `(${files.length} ဖိုင်) ` : ''}တင်ပို့မည်`}
                        </button>
                    </div>
                )}

                {/* ── Success state ── */}
                {uploadSuccess && (
                    <div className="mr-success glass-card">
                        <div className="mr-success__icon">✅</div>
                        <h2 className="mr-success__title">မှတ်တမ်းများ တင်ပြီးပါပြီ!</h2>
                        <p className="mr-success__desc">
                            အခုနောက်တစ်ဆင့်အနေနဲ့ Admin Dashboard မှာ မှတ်တမ်းများကို review လုပ်ပေးမည်ဖြစ်ပြီး
                            review ပြီးသွားချိန်တွင် သင်၏ ချိန်းဆိုမှုအခြေအနေကို <strong>ကျွန်တော့်ချိန်းဆိုမှုများ</strong> စာမျက်နှာမှ စစ်နိုင်ပါသည်။
                        </p>

                        {/* Next steps */}
                        <div className="mr-next-steps">
                            <div className="mr-next-steps__title">နောက်ဆက်တွဲ လုပ်ဆောင်ရမည့် အဆင့်များ</div>

                            <div className="mr-next-step">
                                <span className="mr-next-step__num">①</span>
                                <div>
                                    <div className="mr-next-step__head">လူနာဘက်: မှတ်တမ်းတင်ပြီးနောက် စောင့်ပါ</div>
                                    <p className="mr-next-step__body">သင်လုပ်ဆောင်ရမယ့်အဆင့်ပြီးပါပြီ။ ဖုန်းကိုဖွင့်ထားပြီး ဆက်သွယ်မှုစာများကို စောင့်ကြည့်ပေးပါ။</p>
                                </div>
                            </div>

                            <div className="mr-next-step">
                                <span className="mr-next-step__num">②</span>
                                <div>
                                    <div className="mr-next-step__head">Admin ဘက်: Dashboard မှ Records Review လုပ်မည်</div>
                                    <p className="mr-next-step__body">Admin သည် Admin Dashboard ထဲတွင် သင့်မှတ်တမ်းများကို စစ်ဆေးပြီးနောက် status ကို <strong style={{ color: '#4ade80' }}>Records Reviewed</strong> (သို့) အဆင်ပြေသည့်အခြေအနေသို့ update လုပ်ပါမည်။</p>
                                </div>
                            </div>

                            <div className="mr-next-step">
                                <span className="mr-next-step__num">③</span>
                                <div>
                                    <div className="mr-next-step__head">လူနာဘက်: ချိန်းဆိုမှုအခြေအနေကို ဒီ link မှစစ်ပါ</div>
                                    <p className="mr-next-step__body">အောက်က link ကိုနှိပ်ပြီး <strong>ဖုန်းနံပါတ်</strong> ဖြင့် စစ်ဆေးပါ။ Admin review ပြီးလျှင် အခြေအနေအသစ်ကိုမြင်ရပါမည်။</p>
                                    <a href="/my-appointments" className="btn btn-secondary mr-next-step__btn">
                                        🔍 ကျွန်တော့်ချိန်းဆိုမှု စစ်ဆေးရန်
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="mr-success__contact">
                            <p>မေးခွန်းများ ရှိပါက</p>
                            <div className="mr-success__contact-links">
                                <a href="https://t.me/drtunhealthconsultant" target="_blank" rel="noopener noreferrer" className="mr-contact-link mr-contact-link--tg">
                                    ✈️ Telegram
                                </a>
                                <a href="viber://chat?number=959421068582" className="mr-contact-link mr-contact-link--vb">
                                    📳 Viber
                                </a>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            <Footer />
        </div>
    )
}

export default MedicalRecordsUpload
