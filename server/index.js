import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8787

const NOCODB_API_URL = process.env.NOCODB_API_URL || process.env.VITE_NOCODB_API_URL || 'https://db.drtunmyatwin.com'
const NOCODB_BOOKING_TABLE_ID = process.env.NOCODB_BOOKING_TABLE_ID || 'mkuij3x9lav2v81'
const NOCODB_LEAD_TABLE_ID = process.env.NOCODB_LEAD_TABLE_ID || process.env.VITE_NOCODB_TABLE_ID || 'mz6cj5r8sxt9oif'
const rawToken = process.env.NOCODB_API_TOKEN || process.env.VITE_NOCODB_API_TOKEN || ''
const NOCODB_API_TOKEN =
    rawToken && !rawToken.includes('XXXX')
        ? rawToken
        : '0bXBuEIqxEBHjqRWceYkHw74c5FRe3AR7tCpAgy3'
const ADMIN_DASHBOARD_KEY = process.env.ADMIN_DASHBOARD_KEY || 'dev-admin-key'

const normalizeMyanmarPhone = (phone = '') => {
    const digits = String(phone).replace(/[^\d+]/g, '')
    if (digits.startsWith('+959')) return digits
    if (digits.startsWith('959')) return `+${digits}`
    if (digits.startsWith('09')) return `+959${digits.slice(2)}`
    if (digits.startsWith('9')) return `+95${digits}`
    return digits
}

app.use(cors())
app.use(express.json({ limit: '10mb' }))
const upload = multer({ storage: multer.memoryStorage() })

const nocodbRequest = async (path, options = {}) => {
    const response = await fetch(`${NOCODB_API_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'xc-token': NOCODB_API_TOKEN,
            ...(options.headers || {})
        }
    })

    const text = await response.text()
    const data = text ? JSON.parse(text) : {}
    if (!response.ok) {
        throw new Error(data?.msg || `NocoDB request failed: ${response.status}`)
    }
    return data
}

const requireAdmin = (req, res, next) => {
    if (req.headers['x-admin-key'] !== ADMIN_DASHBOARD_KEY) {
        return res.status(401).json({ error: 'Unauthorized' })
    }
    return next()
}

app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
})

app.post('/api/leads', async (req, res) => {
    try {
        const { name, email, phone } = req.body
        const created = await nocodbRequest(`/api/v2/tables/${NOCODB_LEAD_TABLE_ID}/records`, {
            method: 'POST',
            body: JSON.stringify({
                Name: name,
                Email: email,
                Phone: phone
            })
        })
        res.status(201).json(created)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.post('/api/bookings', async (req, res) => {
    try {
        const payload = req.body
        const normalizedPhone = normalizeMyanmarPhone(payload.phone)
        const preferredDateTime = payload.preferred_date && payload.preferred_time
            ? `${payload.preferred_date} ${payload.preferred_time}:00`
            : null
        const created = await nocodbRequest(`/api/v2/tables/${NOCODB_BOOKING_TABLE_ID}/records`, {
            method: 'POST',
            body: JSON.stringify({
                Name: payload.name,
                Age: payload.age ? parseInt(payload.age, 10) : null,
                Gender: payload.gender || null,
                Email: payload.email,
                Phone: normalizedPhone,
                ChiefComplaints: payload.chief_complaints || payload.problem_description || '',
                PreferredChannel: payload.preferred_channel,
                PreferredDate: payload.preferred_date,
                PreferredTime: preferredDateTime,
                ProblemDescription: payload.problem_description,
                MedicalRecordsAgreement: payload.medical_records_agreement,
                PaymentPhone: normalizeMyanmarPhone(process.env.PAYMENT_PHONE || '09421068582'),
                DoctorName: process.env.DOCTOR_NAME || 'ဒေါက်တာထွန်းမြတ်ဝင်း',
                ConsultationType: payload.service_type || 'general'
            })
        })
        res.status(201).json(created)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.get('/api/bookings/search', async (req, res) => {
    try {
        const { type = 'phone', value = '' } = req.query
        const field = type === 'email' ? 'Email' : 'Phone'
        let safeValue = String(value).replace(/,/g, '').trim()

        // Normalize phone number to match stored format (+959...)
        if (type === 'phone') {
            safeValue = normalizeMyanmarPhone(safeValue)
        }

        // URL-encode the value so special chars like + are handled correctly
        const encodedValue = encodeURIComponent(safeValue)
        const data = await nocodbRequest(`/api/v2/tables/${NOCODB_BOOKING_TABLE_ID}/records?where=(${field},eq,${encodedValue})&sort=-CreatedAt`)
        res.json(data.list || [])
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.get('/api/bookings/:id', async (req, res) => {
    try {
        const data = await nocodbRequest(`/api/v2/tables/${NOCODB_BOOKING_TABLE_ID}/records/${req.params.id}`)
        res.json(data)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.patch('/api/bookings/:id/payment', async (req, res) => {
    try {
        const screenshot = req.body.paymentScreenshot || ''
        const updated = await nocodbRequest(`/api/v2/tables/${NOCODB_BOOKING_TABLE_ID}/records`, {
            method: 'PATCH',
            body: JSON.stringify({
                Id: Number(req.params.id),
                PaymentScreenshot: screenshot ? [{ url: screenshot, title: 'payment-proof' }] : [],
                ConsultationType: screenshot ? 'status:payment_submitted' : 'status:pending_payment'
            })
        })
        res.json(updated)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.patch('/api/bookings/:id/payment-upload', upload.single('screenshot'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Screenshot file is required' })
        }

        const form = new FormData()
        const blob = new Blob([req.file.buffer], { type: req.file.mimetype || 'application/octet-stream' })
        form.append('file', blob, req.file.originalname || 'payment-proof.png')

        const uploadResponse = await fetch(`${NOCODB_API_URL}/api/v2/storage/upload`, {
            method: 'POST',
            headers: { 'xc-token': NOCODB_API_TOKEN },
            body: form
        })
        const uploadText = await uploadResponse.text()
        const uploaded = uploadText ? JSON.parse(uploadText) : []
        if (!uploadResponse.ok || !Array.isArray(uploaded) || uploaded.length === 0) {
            throw new Error('Failed to upload file to NocoDB storage')
        }

        const updated = await nocodbRequest(`/api/v2/tables/${NOCODB_BOOKING_TABLE_ID}/records`, {
            method: 'PATCH',
            body: JSON.stringify({
                Id: Number(req.params.id),
                PaymentScreenshot: uploaded,
                ConsultationType: 'status:payment_submitted'
            })
        })
        res.json(updated)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.patch('/api/bookings/:id/medical-records', upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'At least one file is required' })
        }

        // Upload each file to NocoDB storage
        const uploadedFiles = []
        for (const file of req.files) {
            const form = new FormData()
            const blob = new Blob([file.buffer], { type: file.mimetype || 'application/octet-stream' })
            form.append('file', blob, file.originalname || 'medical-record.jpg')

            const uploadResponse = await fetch(`${NOCODB_API_URL}/api/v2/storage/upload`, {
                method: 'POST',
                headers: { 'xc-token': NOCODB_API_TOKEN },
                body: form
            })
            const uploadText = await uploadResponse.text()
            const uploaded = uploadText ? JSON.parse(uploadText) : []
            if (!uploadResponse.ok || !Array.isArray(uploaded) || uploaded.length === 0) {
                throw new Error(`Failed to upload file: ${file.originalname}`)
            }
            uploadedFiles.push(...uploaded)
        }

        const updated = await nocodbRequest(`/api/v2/tables/${NOCODB_BOOKING_TABLE_ID}/records`, {
            method: 'PATCH',
            body: JSON.stringify({
                Id: Number(req.params.id),
                MedicalRecords: uploadedFiles
            })
        })
        res.json(updated)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.get('/api/admin/bookings', requireAdmin, async (req, res) => {
    try {
        const page = Number(req.query.page || 1)
        const pageSize = Number(req.query.pageSize || 10)
        const q = String(req.query.q || '').trim().toLowerCase()
        const status = String(req.query.status || '').trim().toLowerCase()
        const date = String(req.query.date || '').trim()

        const data = await nocodbRequest(`/api/v2/tables/${NOCODB_BOOKING_TABLE_ID}/records?sort=-CreatedAt&limit=500`)
        const list = data.list || []

        const filtered = list.filter((item) => {
            const fallbackStatus = String(item.ConsultationType || '').startsWith('status:')
                ? String(item.ConsultationType || '').replace('status:', '')
                : ''
            const rowStatus = String(item.PaymentStatus || fallbackStatus).toLowerCase()
            const rowDate = item.PreferredDate || ''
            const searchable = `${item.Name || ''} ${item.Phone || ''} ${item.Email || ''}`.toLowerCase()

            const statusOk = !status || rowStatus === status
            const dateOk = !date || rowDate === date
            const queryOk = !q || searchable.includes(q)
            return statusOk && dateOk && queryOk
        })

        const total = filtered.length
        const start = (page - 1) * pageSize
        const rows = filtered.slice(start, start + pageSize)

        res.json({ rows, total, page, pageSize })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.patch('/api/admin/bookings/:id/status', requireAdmin, async (req, res) => {
    try {
        const { status } = req.body
        const allowed = ['pending_payment', 'payment_submitted', 'confirmed', 'rejected', 'completed']
        if (!allowed.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' })
        }

        // PaymentStatus is currently a SingleSelect without options in NocoDB.
        // Persist admin decision in ConsultationType text column as fallback.
        const updated = await nocodbRequest(`/api/v2/tables/${NOCODB_BOOKING_TABLE_ID}/records`, {
            method: 'PATCH',
            body: JSON.stringify({
                Id: Number(req.params.id),
                ConsultationType: `status:${status}`
            })
        })
        res.json(updated)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.listen(PORT, () => {
    console.log(`API server listening on http://localhost:${PORT}`)
})
