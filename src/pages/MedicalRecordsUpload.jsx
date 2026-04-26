import { useState, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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

    // Search state (used when no ?id= is provided)
    const [searchTerm, setSearchTerm] = useState('')
    const [searchType, setSearchType] = useState('phone')
    const [isSearching, setIsSearching] = useState(false)
    const [searchResults, setSearchResults] = useState([])
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
            if (!response.ok) throw new Error('Search failed')
            const data = await response.json()
            // Only show confirmed bookings for medical record upload
            setSearchResults((data || []).filter(apt => {
                const ct = apt.ConsultationType || ''
                return ct === 'status:confirmed' || apt.BookingStatus === 'confirmed' || apt.PaymentStatus === 'confirmed'
            }))
        } catch (error) {
            console.error('Search error:', error)
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

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files)

        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
        const maxSize = 10 * 1024 * 1024

        const validFiles = selectedFiles.filter(file => {
            if (!validTypes.includes(file.type)) {
                alert(`File ${file.name} is not a supported format. Please upload JPG, PNG, or PDF files.`)
                return false
            }
            if (file.size > maxSize) {
                alert(`File ${file.name} is too large. Maximum size is 10MB.`)
                return false
            }
            return true
        })

        if (validFiles.length > 0) {
            setFiles(prev => [...prev, ...validFiles])

            validFiles.forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader()
                    reader.onloadend = () => {
                        setPreviews(prev => [...prev, { name: file.name, url: reader.result, type: file.type }])
                    }
                    reader.readAsDataURL(file)
                } else {
                    setPreviews(prev => [...prev, { name: file.name, url: null, type: file.type }])
                }
            })
        }
    }

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
        setPreviews(prev => prev.filter((_, i) => i !== index))
    }

const handleUpload = async () => {
        if (files.length === 0) {
            alert('ကျန်းမာရေးမှတ်တမ်းများ ရွေးချယ်ရန် လိုအပ်ပါသည်')
            return
        }
        if (!bookingId) {
            alert('Booking ID not found. Please select a booking first.')
            return
        }

        setIsUploading(true)

        try {
            // Create a FormData object to properly send files
            const formData = new FormData();
            
            // Append files to FormData
            files.forEach((file) => {
                formData.append('files', file);
            });
            
            // Also append bookingId for reference
            formData.append('bookingId', bookingId);

            const response = await fetch(`/api/bookings/${bookingId}/medical-records`, {
                method: 'PATCH',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to upload medical records')
            }

            setUploadSuccess(true)
            alert('ကျန်းမာရေးမှတ်တမ်းများ တင်ပြီးပါပြီ။ ဆရာဝန်က စစ်ဆေးပြီး အကြောင်းပြန်ပါလိမ့်မည်။')
        } catch (error) {
            console.error('Upload error:', error)
            alert('Upload failed. Please try again.')
        } finally {
            setIsUploading(false)
        }
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className="medical-records-page">
            <Navbar />

            <section className="medical-records-hero">
                <div className="medical-records-hero__bg-orbs">
                    <div className="medical-records-hero__orb medical-records-hero__orb--1"></div>
                    <div className="medical-records-hero__orb medical-records-hero__orb--2"></div>
                </div>

                <div className="container">
                    <div className="medical-records-content animate-scale">
                        <div className="medical-records-checkmark">
                            <span>📋</span>
                        </div>

                        <h1 className="medical-records-title">
                            ကျန်းမာရေးမှတ်တမ်းများ တင်ပို့ရန်
                        </h1>

                        <p className="medical-records-subtitle">
                            တိုင်ပင်ဆွေးနွေးမှုမတိုင်မီ သင့်ကျန်းမာရေးမှတ်တမ်းများ (ဆေးစစ်ချက်များ၊ ဓာတ်ခွဲစစ်ဆေးချက်များ၊ ဆေးညွှန်းစာများ) ကို တင်ပို့ပါ။
                        </p>

                        {/* Step 1: Find booking if no ID provided */}
                        {!bookingId && !uploadSuccess && (
                            <div className="medical-records-card glass-card">
                                <div className="medical-records-card__header">
                                    <h2>ချိန်းဆိုမှု ရှာဖွေရန်</h2>
                                    <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>
                                        သင့်ဖုန်းနံပါတ် သို့မဟုတ် အီးမေးလ်ဖြင့် ချိန်းဆိုမှုကို ရှာဖွေပါ
                                    </p>
                                </div>

                                <div className="search-type-toggle" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <button
                                        className={`btn ${searchType === 'phone' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                                        onClick={() => setSearchType('phone')}
                                    >
                                        📱 ဖုန်းနံပါတ်
                                    </button>
                                    <button
                                        className={`btn ${searchType === 'email' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                                        onClick={() => setSearchType('email')}
                                    >
                                        📧 အီးမေးလ်
                                    </button>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <input
                                        type={searchType === 'phone' ? 'tel' : 'email'}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder={searchType === 'phone' ? '09xxxxxxxxx' : 'example@email.com'}
                                        className="form-input"
                                        style={{ flex: 1 }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                    <button
                                        onClick={handleSearch}
                                        disabled={isSearching}
                                        className="btn btn-primary"
                                    >
                                        {isSearching ? 'ရှာနေ...' : '🔍 ရှာရန်'}
                                    </button>
                                </div>

                                {hasSearched && (
                                    <div>
                                        {searchResults.length === 0 ? (
                                            <p style={{ textAlign: 'center', opacity: 0.7 }}>
                                                အတည်ပြုပြီးသော ချိန်းဆိုမှုများ မတွေ့ပါ။
                                            </p>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {searchResults.map((apt) => (
                                                    <button
                                                        key={apt.Id || apt.id}
                                                        className="glass-card"
                                                        onClick={() => selectBooking(apt)}
                                                        style={{
                                                            padding: '1rem',
                                                            textAlign: 'left',
                                                            cursor: 'pointer',
                                                            border: '1px solid rgba(255,255,255,0.15)',
                                                            background: 'rgba(255,255,255,0.05)',
                                                            borderRadius: '0.5rem',
                                                            color: 'inherit'
                                                        }}
                                                    >
                                                        <strong>{apt.Name}</strong> — {apt.PreferredDate} {apt.PreferredTime ? apt.PreferredTime.split(' ')[1]?.slice(0, 5) : ''}
                                                        <br />
                                                        <small style={{ opacity: 0.7 }}>ID: {apt.Id || apt.id} | ✅ အတည်ပြုပြီး</small>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Upload files (shown when booking ID is available) */}
                        {bookingId && !uploadSuccess && (
                            <div className="medical-records-card glass-card">
                                <div className="medical-records-card__header">
                                    <h2>မှတ်တမ်းများ တင်ပို့ရန်</h2>
                                    <p style={{ opacity: 0.7, fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                        Booking ID: {bookingId}
                                    </p>
                                </div>

                                <div className="upload-area" onClick={triggerFileInput}>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/jpeg,image/png,image/jpg,application/pdf"
                                        multiple
                                        className="file-input"
                                        id="medical-records-upload"
                                    />
                                    <label htmlFor="medical-records-upload" className="upload-label">
                                        <span className="upload-icon">📤</span>
                                        <span className="upload-text">ဖိုင်များ ရွေးချယ်ရန် နှိပ်ပါ</span>
                                        <span className="upload-hint">JPG, PNG, PDF (Max 10MB each)</span>
                                    </label>
                                </div>

                                {files.length > 0 && (
                                    <div className="selected-files">
                                        <h3>ရွေးချယ်ထားသော ဖိုင်များ ({files.length})</h3>
                                        <div className="files-list">
                                            {previews.map((preview, index) => (
                                                <div key={index} className="file-item">
                                                    <div className="file-info">
                                                        {preview.url ? (
                                                            <img src={preview.url} alt={preview.name} className="file-preview" />
                                                        ) : (
                                                            <div className="file-icon">📄</div>
                                                        )}
                                                        <span className="file-name">{preview.name}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFile(index)}
                                                        className="remove-file-btn"
                                                        type="button"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleUpload}
                                    disabled={isUploading || files.length === 0}
                                    className="btn btn-primary btn-lg btn-block"
                                >
                                    {isUploading ? 'တင်ပို့နေသည်...' : 'မှတ်တမ်းများ တင်ပို့ရန်'}
                                </button>

                                <div className="upload-notice">
                                    <p>
                                        <strong>မှတ်ချက်:</strong> တင်ပို့ပြီးသော မှတ်တမ်းများကို ဆရာဝန်က စစ်ဆေးပြီး တိုင်ပင်ဆွေးနွေးမှုမတိုင်မီ အကြောင်းပြန်ပါလိမ့်မည်။
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Success */}
                        {uploadSuccess && (
                            <div className="upload-success glass-card">
                                <div className="success-icon">✅</div>
                                <h2>မှတ်တမ်းများ တင်ပြီးပါပြီ!</h2>
                                <p>ဆရာဝန်က သင့်မှတ်တမ်းများကို စစ်ဆေးပြီး တိုင်ပင်ဆွေးနွေးမှုအတွက် အကြောင်းပြန်ပါလိမ့်မည်။</p>
                                <div className="success-actions">
                                    <Link to="/" className="btn btn-secondary">
                                        ပင်မစာမျက်နှာသို့ ပြန်သွားရန်
                                    </Link>
                                    <a
                                        href="https://t.me/drtunhealthconsultant"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-primary"
                                    >
                                        <span>✈️</span> Telegram မှ ဆက်သွယ်ရန်
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}

export default MedicalRecordsUpload
