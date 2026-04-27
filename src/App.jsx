import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import ThankYouPage from './pages/ThankYouPage'
import PaymentInstructions from './pages/PaymentInstructions'
import BookingConfirmation from './pages/BookingConfirmation'
import MedicalRecordsUpload from './pages/MedicalRecordsUpload'
import MyAppointments from './pages/MyAppointments'
import AdminBookings from './pages/AdminBookings'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/thank-you" element={<ThankYouPage />} />
      <Route path="/payment-instructions" element={<PaymentInstructions />} />
      <Route path="/booking-confirmation" element={<BookingConfirmation />} />
      <Route path="/medical-records-upload" element={<MedicalRecordsUpload />} />
      <Route path="/my-appointments" element={<MyAppointments />} />
      <Route path="/admin/bookings" element={<AdminBookings />} />
    </Routes>
  )
}

export default App
