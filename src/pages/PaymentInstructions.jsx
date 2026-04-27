import { useEffect, useState } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './PaymentInstructions.css'

function PaymentInstructions() {
    const navigate = useNavigate()
    const location = useLocation()
    const { bookingData: initialBookingData } = location.state || {}
    const [screenshot, setScreenshot] = useState(null)
    const [screenshotPreview, setScreenshotPreview] = useState('')
    const [isUploading, setIsUploading] = useState(false)
    const bookingData = initialBookingData || (() => {
        const stored = sessionStorage.getItem('bookingData');
        return stored ? JSON.parse(stored) : {};
    })()

    useEffect(() => {
        window.scrollTo(0, 0)
        // Save to sessionStorage in case of refresh
        if (initialBookingData) {
            sessionStorage.setItem('bookingData', JSON.stringify(initialBookingData))
        }

        // If no booking data, redirect to booking section
        if (!bookingData || !bookingData.phone) {
            alert('Please complete your booking first.')
            navigate('/#consultation')
        }
    }, [initialBookingData, bookingData, navigate])

    const getSectionDisplay = (section) => {
        const sections = {
            'morning': 'နံနက်ပိုင်း (၉:၀၀ - ၁၂:၀၀)',
            'evening': 'ညနေပိုင်း (၂:၀၀ - ၈:၀၀)'
        };
        return sections[section] || '';
    };

    const handleScreenshotChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setScreenshot(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setScreenshotPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmitProof = async () => {
        if (!screenshot) {
            alert('ငွေပေးချေမှုပုံရိပ် တင်ပို့ရန် လိုအပ်ပါသည်');
            return;
        }
        if (!bookingData?.phone) {
            alert('Booking data not found. Please try booking again.');
            return;
        }

        const bookingId = bookingData.id
        if (!bookingId) {
            alert('Could not find booking record. Please contact support.');
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData()
            formData.append('screenshot', screenshot)

            const response = await fetch(`/api/bookings/${bookingId}/payment-upload`, {
                method: 'PATCH',
                body: formData
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}))
                throw new Error(data.error || 'Failed to update payment status');
            }

            alert('ငွေပေးချေမှုအထောက်အထား တင်ပို့ပြီးပါပြီ။ ဆရာဝန်၏ အတည်ပြုချက်ကို စောင့်ဆိုင်းပါ။');
        } catch (error) {
            console.error('Upload error:', error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="payment-instructions-page">
            <Navbar />

            <section className="payment-hero">
                <div className="payment-hero__bg-orbs">
                    <div className="payment-hero__orb payment-hero__orb--1"></div>
                    <div className="payment-hero__orb payment-hero__orb--2"></div>
                </div>

                <div className="container">
                    <div className="payment-content animate-scale">
                        <div className="payment-checkmark">
                            <span>📅</span>
                        </div>

                        <h1 className="payment-title">
                            ချိန်းဆိုမှု လျှောက်ထားပြီးပါပြီ!
                        </h1>

                        <p className="payment-subtitle">
                            သင့်ချိန်းဆိုမှုကို လက်ခံရရှိပါပြီ။ အောက်ပါ ငွေပေးချေမှုညွှန်ကြားချက်များကို လိုက်နာပြီး ငွေပေးချေပြီးပါက ဆရာဝန်က အတည်ပြုချက်ပေးပါလိမ့်မည်။
                        </p>

                        <div className="payment-card glass-card">
                            <div className="payment-card__header">
                                <h2>ငွေပေးချေမှုအသေးစိတ်</h2>
                            </div>

                            <div className="payment-details">
                                <div className="payment-detail">
                                    <span className="payment-label">အမည်:</span>
                                    <span className="payment-value">{bookingData?.name || 'N/A'}</span>
                                </div>
                                <div className="payment-detail">
                                    <span className="payment-label">နေ့ရက်:</span>
                                    <span className="payment-value">{bookingData?.preferred_date || 'N/A'}</span>
                                </div>
                                <div className="payment-detail">
                                    <span className="payment-label">အချိန်:</span>
                                    <span className="payment-value">{bookingData?.preferred_time || 'N/A'}</span>
                                </div>
                                {bookingData?.booking_section && (
                                    <div className="payment-detail">
                                        <span className="payment-label">အပိုင်း:</span>
                                        <span className={`payment-value section-badge section--${bookingData.booking_section}`}>
                                            {getSectionDisplay(bookingData.booking_section)}
                                        </span>
                                    </div>
                                )}
                                <div className="payment-detail">
                                    <span className="payment-label">တိုင်ပင်ခ နှုန်း:</span>
                                    <span className="payment-value">၁၀,၀၀၀ ကျပ်</span>
                                </div>
                                <div className="payment-detail">
                                    <span className="payment-label">တိုင်ပင်ချိန်:</span>
                                    <span className="payment-value">၃၀ မိနစ်</span>
                                </div>
                                <div className="payment-detail">
                                    <span className="payment-label">ဖုန်းနံပါတ်:</span>
                                    <span className="payment-value">09421068582</span>
                                </div>
                            </div>

                            <div className="payment-methods">
                                <h3>လက်ခံသော ငွေပေးချေမှုနည်းလမ်းများ</h3>
                                <div className="payment-methods__grid">
                                    <div className="payment-method">
                                        <div className="payment-method__icon">💳</div>
                                        <div className="payment-method__name">KPay</div>
                                    </div>
                                    <div className="payment-method">
                                        <div className="payment-method__icon">🌊</div>
                                        <div className="payment-method__name">Wave Pay</div>
                                    </div>
                                    <div className="payment-method">
                                        <div className="payment-method__icon">💙</div>
                                        <div className="payment-method__name">AYA Pay</div>
                                    </div>
                                    <div className="payment-method">
                                        <div className="payment-method__icon">🟡</div>
                                        <div className="payment-method__name">CB Pay</div>
                                    </div>
                                </div>
                            </div>

                            <div className="payment-upload-section">
                                <h3>ငွေပေးချေမှုပုံရိပ် တင်ပို့ရန်</h3>
                                <p className="upload-description">
                                    ငွေလွှဲပြောင်းပြီးပါက ငွေလွှဲပြောင်းမှုအရ ပုံရိပ် (Screenshot) ကို အောက်တွင် တင်ပို့ပါ။
                                </p>
                                <div className="upload-area">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleScreenshotChange}
                                        className="file-input"
                                        id="screenshot-upload"
                                    />
                                    <label htmlFor="screenshot-upload" className="upload-label">
                                        {screenshotPreview ? (
                                            <img src={screenshotPreview} alt="Payment Proof" className="screenshot-preview" />
                                        ) : (
                                            <>
                                                <span className="upload-icon">📷</span>
                                                <span>ပုံရိပ် ရွေးချယ်ရန် နှိပ်ပါ</span>
                                            </>
                                        )}
                                    </label>
                                </div>
                                <button
                                    onClick={handleSubmitProof}
                                    disabled={isUploading || !screenshot}
                                    className="btn btn-primary btn-lg btn-block"
                                >
                                    {isUploading ? 'တင်ပို့နေသည်...' : 'ငွေပေးချေမှုအထောက်အထား တင်ပို့ရန်'}
                                </button>
                            </div>

                            <div className="payment-instructions">
                                <h3>ငွေပေးချေမှုညွှန်ကြားချက်များ</h3>
                                <ol className="payment-steps">
                                    <li>
                                        အထက်ဖော်ပြပါ ဖုန်းနံပါတ် (09421068582) သို့ လိုအပ်သော ငွေပမာဏ (၁၀,၀၀၀ ကျပ်) ကို သင့်နှစ်သက်ရာ ငွေပေးချေမှုအက်ပ်ဖြင့် လွှဲပြောင်းပါ။
                                    </li>
                                    <li>
                                        ငွေလွှဲပြောင်းပြီးပါက ငွေလွှဲပြောင်းမှုအရ ပုံရိပ် (Screenshot) ကို သိမ်းဆည်းထားပါ။
                                    </li>
                                    <li>
                                        ပုံရိပ်ကို အပေါ်တွင် တင်ပို့ပြီး "ငွေပေးချေမှုအထောက်အထား တင်ပို့ရန်" ခလုတ်ကို နှိပ်ပါ။
                                    </li>
                                </ol>
                            </div>

                            <div className="medical-records-notice">
                                <h3>⚕️ ကျန်းမာရေးမှတ်တမ်းများ</h3>
                                <p>
                                    တိုင်ပင်ချိန်မတိုင်မီ သင့်ယခင်က ကျန်းမာရေးမှတ်တမ်းများ (ဆေးစစ်ချက်များ၊ ဓာတ်ခွဲစစ်ဆေးချက်များ၊ ဆေးညွှန်းစာများ စသည်တို့) ကို ဆရာဝန်ထံ ပေးပို့ရန် လိုအပ်ပါသည်။
                                </p>
                                <p>
                                    မှတ်တမ်းများကို Telegram သို့မဟုတ် Viber မှတစ်ဆင့် ပေးပို့နိုင်ပါသည်။
                                </p>
                            </div>

                            <div className="payment-actions">
                                <Link
                                    to={`/booking-confirmation?name=${encodeURIComponent(bookingData?.name || '')}&date=${encodeURIComponent(bookingData?.preferred_date || '')}&time=${encodeURIComponent(bookingData?.preferred_time || '')}&section=${encodeURIComponent(bookingData?.booking_section || '')}&id=${encodeURIComponent(bookingData?.id || '')}`}
                                    className="btn btn-secondary btn-lg"
                                >
                                    အတည်ပြုချက်ကြည့်ရန်
                                </Link>

                                <div className="payment-contact">
                                    <p>ငွေပေးချေမှုနှင့် ပတ်သက်သော မေးခွန်းများရှိပါက:</p>
                                    <div className="contact-options">
                                        <a
                                            href="https://t.me/drtunhealthconsultant"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="contact-link"
                                        >
                                            <span>✈️</span> Telegram
                                        </a>
                                        <a
                                            href="viber://chat?number=959987654321"
                                            className="contact-link"
                                        >
                                            <span>💜</span> Viber
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}

export default PaymentInstructions