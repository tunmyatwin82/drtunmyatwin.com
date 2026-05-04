import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
    const navigate = useNavigate()
    const location = useLocation()
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
        if (location.pathname !== '/') {
            navigate('/#consultation')
            // Wait for navigation, then scroll
            setTimeout(() => {
                const el = document.getElementById('lead-form')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
            }, 100)
        } else {
            const el = document.getElementById('lead-form')
            if (el) el.scrollIntoView({ behavior: 'smooth' })
        }
    }

    const navigateToSection = (sectionId, e) => {
        e.preventDefault()
        setMobileOpen(false)
        if (location.pathname !== '/') {
            navigate(`/#${sectionId}`)
        } else {
            const el = document.getElementById(sectionId)
            if (el) el.scrollIntoView({ behavior: 'smooth' })
        }
    }

    return (
        <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
            <div className="navbar__container">
                <a href="/" className="navbar__logo">
                    <span className="navbar__logo-icon">💊</span>
                    <span className="navbar__logo-text">Dr. Tun Myat Win</span>
                </a>

                <div className={`navbar__links ${mobileOpen ? 'navbar__links--open' : ''}`}>
                    <a className="navbar__link" href="#benefits" onClick={(e) => navigateToSection('benefits', e)}>✨ အကျိုးကျေးဇူးများ</a>
                    <a className="navbar__link" href="#about" onClick={(e) => navigateToSection('about', e)}>👨‍⚕️ ကျွန်တော့်အကြောင်း</a>
                    <a href="#testimonials" onClick={(e) => navigateToSection('testimonials', e)}>သုံးသပ်ချက်များ</a>
                    <a href="#faq" onClick={(e) => navigateToSection('faq', e)}>မေးလေ့ရှိသောမေးခွန်းများ</a>
                    <a href="#consultation" onClick={(e) => navigateToSection('consultation', e)}>တိုင်ပင်ဆွေးနွေးခြင်း</a>
                    <a href="/my-appointments" onClick={() => setMobileOpen(false)}>ချိန်းဆိုမှုများ</a>
                    <a href="/admin/bookings" onClick={() => setMobileOpen(false)}>Admin Dashboard</a>
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
