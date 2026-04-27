import { useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import Footer from '../components/Footer'
import './ThankYouPage.css'

function ThankYouPage() {
    const location = useLocation()
    const { name, _email, _phone, preferred_channel } = location.state || {}

    const getChannelInfo = (channel) => {
        const channels = {
            telegram: { icon: '✈️', name: 'Telegram', url: 'https://t.me/drtunhealthconsultant', text: 'Telegram မှတဆင့် ဆက်သွယ်ပါမည်' },
            viber: { icon: '💜', name: 'Viber', url: 'viber://chat?number=959987654321', text: 'Viber မှတဆင့် ဆက်သွယ်ပါမည်' },
            whatsapp: { icon: '💚', name: 'WhatsApp', url: 'https://wa.me/959987654321', text: 'WhatsApp မှတဆင့် ဆက်သွယ်ပါမည်' },
            zoom: { icon: '📹', name: 'Zoom', url: '#', text: 'Zoom Meeting ချိန်းဆက်ပေးပါမည်' },
            google_meet: { icon: '📹', name: 'Google Meet', url: '#', text: 'Google Meet ချိန်းဆက်ပေးပါမည်' }
        }
        return channels[channel] || channels.telegram
    }

    const selectedChannel = getChannelInfo(preferred_channel)

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    return (
        <div className="thankyou-page">
            {/* Success Section */}
            <section className="thankyou-hero">
                <div className="thankyou-hero__bg-orbs">
                    <div className="thankyou-hero__orb thankyou-hero__orb--1"></div>
                    <div className="thankyou-hero__orb thankyou-hero__orb--2"></div>
                </div>

                <div className="container">
                    <div className="thankyou-content animate-scale">
                        <div className="thankyou-checkmark">
                            <span>✅</span>
                        </div>

                        <h1 className="thankyou-title">
                            {name ? `${name}၊ ` : ''}ကျေးဇူးတင်ပါတယ်!
                        </h1>

                        <p className="thankyou-subtitle">
                            သင့်အချက်အလက်များကို လက်ခံရရှိပါပြီ။
                            အောက်ပါခလုတ်ကို နှိပ်ပြီး စာအုပ် PDF ကို တိုက်ရိုက် ဒေါင်းလုဒ်လုပ်နိုင်ပါတယ်။
                        </p>

                        <div className="thankyou-telegram glass-card">
                            <div className="thankyou-telegram__icon">
                                <span style={{ fontSize: '40px' }}>📥</span>
                            </div>
                            <div className="thankyou-telegram__info">
                                <h3>အခမဲ့ စာအုပ် PDF ဒေါင်းလုဒ်</h3>
                                <p>အောက်ပါခလုတ်ကို နှိပ်ပြီး ချက်ချင်းရယူပါ</p>
                            </div>
                            <a
                                href="/ebook.pdf"
                                download
                                className="btn btn-primary btn-lg"
                            >
                                📥 PDF ဒေါင်းလုဒ်လုပ်မည်
                            </a>
                        </div>

                        <div className="thankyou-steps">
                            <h3 className="thankyou-steps__title">✅ အောင်မြင်ပါသည်</h3>
                            <div className="thankyou-steps__list">
                                <div className="thankyou-step">
                                    <div className="thankyou-step__number">✓</div>
                                    <div className="thankyou-step__text">
                                        သင့်အချက်အလက်များကို လုံခြုံစွာ သိမ်းဆည်းပြီးပါပြီ
                                    </div>
                                </div>
                                <div className="thankyou-step">
                                    <div className="thankyou-step__number">✓</div>
                                    <div className="thankyou-step__text">
                                        စာအုပ်ကို ဒေါင်းလုဒ်လုပ်ပြီး ဖတ်ရှုနိုင်ပါပြီ
                                    </div>
                                </div>
                                <div className="thankyou-step">
                                    <div className="thankyou-step__number">✓</div>
                                    <div className="thankyou-step__text">
                                        {selectedChannel.name} မှတဆင့် ဆရာဝန်က 24 နာရီအတွင်း ဆက်သွယ်ပေးမည်
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Upsell Section */}
                    <div className="thankyou-upsell animate-fade-up delay-300">
                        <h2 className="thankyou-upsell__title">
                            📚 နောက်ထပ်စာအုပ်များလည်း ရယူနိုင်ပါတယ်
                        </h2>
                        <p className="thankyou-upsell__text">
                            ဆေးဝါးပညာဆိုင်ရာ နောက်ထပ်စာအုပ်များကို ဝယ်ယူရန်
                            ကျွန်တော်တို့ရဲ့ ebook store ကိုသွားရောက်ကြည့်ပါ
                        </p>

                        <div className="thankyou-upsell__cards">
                            <div className="thankyou-upsell__card glass-card">
                                <div className="thankyou-upsell__card-icon">📗</div>
                                <h4>ဆေးဝါးစာအုပ်များ</h4>
                                <p>ဆေးဝါးပညာဆိုင်ရာ စာအုပ်များကို ဝယ်ယူနိုင်ပါတယ်</p>
                                <a
                                    href="https://shop.drtunmyatwin.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary"
                                >
                                    🛒 Ebook Store သို့
                                </a>
                            </div>

                            <div className="thankyou-upsell__card glass-card">
                                <div className="thankyou-upsell__card-icon">📺</div>
                                <h4>YouTube Channel</h4>
                                <p>ကျန်းမာရေးဗီဒီယိုများကို Subscribe လုပ်ပြီး လေ့လာပါ</p>
                                <a
                                    href="https://www.youtube.com/@drtunmyatwin"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary"
                                >
                                    ▶️ YouTube သို့
                                </a>
                            </div>

                            <div className="thankyou-upsell__card glass-card">
                                <div className="thankyou-upsell__card-icon">💬</div>
                                <h4>Telegram Channel</h4>
                                <p>အသစ်ထွက်မယ့် စာအုပ်များအကြောင်း အချိန်နဲ့တပြေးညီ သိရမည်</p>
                                <a
                                    href="https://t.me/drtunhealthconsultant"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary"
                                >
                                    📢 Telegram Channel
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Consultation Booking Section */}
                    <section className="consultation section" style={{ marginTop: '3rem', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
                        <div className="glass-card" style={{ padding: '2rem' }}>
                            <span className="badge" style={{ marginBottom: '1rem', display: 'inline-block' }}>👨‍⚕️ အွန်လိုင်း တိုင်ပင်ပေးခြင်း</span>
                            <h2 className="section-title" style={{ fontSize: '1.5rem', marginTop: '1rem', marginBottom: '1rem' }}>
                                ကျန်းမာရေးပြဿနာ ရှိပါသလား?
                            </h2>
                            <p style={{ marginBottom: '1.5rem', opacity: '0.8' }}>
                                သင့်စိတ်ကြိုက် ဆက်သွယ်ရေးလမ်းကြောင်းကို ရွေးပြီး ဆရာဝန်နဲ့ တိုက်ရိုက် တိုင်ပင်ဆွေးနွေးနိုင်ပါပြီ။
                            </p>

                            <div className="channel-options" style={{ marginBottom: '1.5rem' }}>
                                <button
                                    onClick={() => window.open('https://t.me/drtunhealthconsultant', '_blank')}
                                    className="channel-option"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <span className="channel-icon">✈️</span>
                                    <span className="channel-name">Telegram</span>
                                </button>
                                <button
                                    onClick={() => window.open('viber://chat?number=959987654321', '_blank')}
                                    className="channel-option"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <span className="channel-icon">💜</span>
                                    <span className="channel-name">Viber</span>
                                </button>
                                <button
                                    onClick={() => window.open('https://wa.me/959987654321', '_blank')}
                                    className="channel-option"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <span className="channel-icon">💚</span>
                                    <span className="channel-name">WhatsApp</span>
                                </button>
                                <button
                                    onClick={() => window.open('#', '_blank')}
                                    className="channel-option"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <span className="channel-icon">📹</span>
                                    <span className="channel-name">Zoom</span>
                                </button>
                                <button
                                    onClick={() => window.open('#', '_blank')}
                                    className="channel-option"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <span className="channel-icon">📹</span>
                                    <span className="channel-name">Google Meet</span>
                                </button>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <input
                                    type="text"
                                    placeholder="သင့်အမည်"
                                    style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '1rem' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <input
                                    type="tel"
                                    placeholder="ဖုန်းနံပါတ်"
                                    style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '1rem' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <textarea
                                    placeholder="သင့်ကျန်းမာရေး ပြဿနာ အသေးစိတ် ရေးပေးပါ"
                                    rows="4"
                                    style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '1rem', resize: 'vertical' }}
                                ></textarea>
                            </div>

                            <p style={{ marginTop: '1rem', fontSize: '0.875rem', opacity: '0.6' }}>
                                ✅ မိမိ စိတ်ကြိုက် channel ကို နှိပ်ပြီး တိုက်ရိုက် တိုင်ပင်နိုင်ပါတယ်။ ချိန်းယူပြီးသည်နှင့် ၂၄ နာရီအတွင်း ဆရာဝန်က တိုက်ရိုက် ဆက်သွယ်ပေးမှာ ဖြစ်ပါတယ်။
                            </p>
                        </div>
                    </section>

                    <div className="thankyou-back">
                        <Link to="/" className="btn btn-secondary">
                            ← ပင်မစာမျက်နှာသို့ ပြန်သွားရန်
                        </Link>
                    </div>

                    <div className="thankyou-review glass-card" style={{ marginTop: '2rem', padding: '2rem', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
                        <h3 style={{ marginBottom: '1rem' }}>💬 သင့်အကြံဥာဏ်ကို လိုအပ်ပါတယ်</h3>
                        <p style={{ marginBottom: '1.5rem', opacity: '0.8' }}>
                            စာအုပ်ကို ဖတ်ပြီးသောအခါ သင့်အကြံဥာဏ်၊ အကြံပြုချက်များကို ကျွန်တော့်ကို ပေးပါ။ လာမယ့် စာအုပ်အသစ်များကို ပိုကောင်းအောင် လုပ်ဆောင်နိုင်မှာ ဖြစ်ပါတယ်။
                        </p>
                        <a
                            href="https://t.me/drtunhealthconsultant"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                        >
                            💬 အကြံဥာဏ်ပေးရန်
                        </a>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}

export default ThankYouPage
