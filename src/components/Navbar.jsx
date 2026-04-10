import { useState, useEffect } from 'react'
import './Navbar.css'

function Navbar() {
    const [scrolled, setScrolled] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const scrollToForm = (e) => {
        e.preventDefault()
        setMobileOpen(false)
        const el = document.getElementById('lead-form')
        if (el) el.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
            <div className="navbar__container">
                <a href="/" className="navbar__logo">
                    <span className="navbar__logo-icon">💊</span>
                    <span className="navbar__logo-text">Dr. Tun Myat Win</span>
                </a>

                <div className={`navbar__links ${mobileOpen ? 'navbar__links--open' : ''}`}>
                    <a href="#benefits" onClick={() => setMobileOpen(false)}>အကျိုးကျေးဇူးများ</a>
                    <a href="#about" onClick={() => setMobileOpen(false)}>ကျွန်တော့်အကြောင်း</a>
                    <a href="#testimonials" onClick={() => setMobileOpen(false)}>သုံးသပ်ချက်များ</a>
                    <a href="#faq" onClick={() => setMobileOpen(false)}>မေးလေ့ရှိသောမေးခွန်းများ</a>
                    <a href="#consultation" onClick={() => setMobileOpen(false)}>တိုင်ပင်ဆွေးနွေးခြင်း</a>
                </div>

                <button className="btn btn-primary navbar__cta" onClick={scrollToForm}>
                    🎁 အခမဲ့ရယူရန်
                </button>

                <button
                    className={`navbar__hamburger ${mobileOpen ? 'navbar__hamburger--open' : ''}`}
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </nav>
    )
}

export default Navbar
