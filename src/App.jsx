import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import ThankYouPage from './pages/ThankYouPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/thank-you" element={<ThankYouPage />} />
    </Routes>
  )
}

export default App
