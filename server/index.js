import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import { google } from 'googleapis'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'
import { Readable } from 'stream'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8000
const isProduction = process.env.NODE_ENV === 'production'

const NOCODB_API_URL = process.env.NOCODB_API_URL || process.env.VITE_NOCODB_API_URL || 'https://db.drtunmyatwin.com'
const NOCODB_BOOKING_TABLE_ID = process.env.NOCODB_BOOKING_TABLE_ID || 'mkuij3x9lav2v81'
/** NocoDB attachment column for patient medical files (must match the column’s API name in table settings). */
const NOCODB_MEDICAL_RECORDS_FIELD = String(process.env.NOCODB_MEDICAL_RECORDS_FIELD || 'MedicalRecords').trim()
const NOCODB_LEAD_TABLE_ID = process.env.NOCODB_LEAD_TABLE_ID || process.env.VITE_NOCODB_TABLE_ID || 'mz6cj5r8sxt9oif'
const ZOOM_ACCOUNT_ID = String(process.env.ZOOM_ACCOUNT_ID || '').trim()
const ZOOM_CLIENT_ID = String(process.env.ZOOM_CLIENT_ID || '').trim()
const ZOOM_CLIENT_SECRET = String(process.env.ZOOM_CLIENT_SECRET || '').trim()
const ZOOM_ACCESS_TOKEN = String(process.env.ZOOM_ACCESS_TOKEN || '').trim()
const ZOOM_TIMEZONE = String(process.env.ZOOM_TIMEZONE || 'Asia/Yangon').trim()
const GOOGLE_OAUTH_CLIENT_ID = String(process.env.GOOGLE_OAUTH_CLIENT_ID || '').trim()
const GOOGLE_OAUTH_CLIENT_SECRET = String(process.env.GOOGLE_OAUTH_CLIENT_SECRET || '').trim()
const GOOGLE_OAUTH_REDIRECT_URI = String(process.env.GOOGLE_OAUTH_REDIRECT_URI || 'https://drtunmyatwin.com/api/google-drive/oauth/callback').trim()
const GOOGLE_OAUTH_REFRESH_TOKEN = String(process.env.GOOGLE_OAUTH_REFRESH_TOKEN || '').trim()
const GOOGLE_DRIVE_CLIENT_EMAIL = String(process.env.GOOGLE_DRIVE_CLIENT_EMAIL || '').trim()
const rawGoogleDrivePrivateKey = String(process.env.GOOGLE_DRIVE_PRIVATE_KEY || '').trim()
const GOOGLE_DRIVE_FOLDER_ID = String(process.env.GOOGLE_DRIVE_FOLDER_ID || '').trim()
const fallbackDevNocoToken = '0bXBuEIqxEBHjqRWceYkHw74c5FRe3AR7tCpAgy3'
const rawNocoToken = String(process.env.NOCODB_API_TOKEN || process.env.VITE_NOCODB_API_TOKEN || '').trim()
const hasPlaceholderNocoToken = rawNocoToken.toLowerCase().includes('xxxx') || rawNocoToken.toLowerCase().includes('your_') || rawNocoToken.toLowerCase().includes('_here')
const NOCODB_API_TOKEN = !isProduction && hasPlaceholderNocoToken ? fallbackDevNocoToken : rawNocoToken
const ADMIN_DASHBOARD_KEY = String(process.env.ADMIN_DASHBOARD_KEY || (!isProduction ? 'dev-admin-key' : '')).trim()

const invalidSecretValue = (value = '') => {
    const normalized = String(value).trim().toLowerCase()
    return (
        !normalized
        || normalized.includes('your_')
        || normalized.includes('_here')
    )
}

if (invalidSecretValue(NOCODB_API_TOKEN)) {
    console.warn('Warning: Missing valid NOCODB_API_TOKEN. NocoDB-backed endpoints will fail until it is configured.')
}

if (invalidSecretValue(ADMIN_DASHBOARD_KEY)) {
    console.warn('Warning: Missing valid ADMIN_DASHBOARD_KEY. Admin endpoints are disabled until it is configured.')
}

const hasValidNocoToken = !invalidSecretValue(NOCODB_API_TOKEN)
const hasValidAdminKey = !invalidSecretValue(ADMIN_DASHBOARD_KEY)
const hasZoomOAuthConfig = !invalidSecretValue(ZOOM_ACCOUNT_ID) && !invalidSecretValue(ZOOM_CLIENT_ID) && !invalidSecretValue(ZOOM_CLIENT_SECRET)
const hasZoomStaticToken = !invalidSecretValue(ZOOM_ACCESS_TOKEN)
const hasZoomConfig = hasZoomOAuthConfig || hasZoomStaticToken
/** Shown when admin clicks Auto Link but Zoom env is missing (same vars as startup warning). */
const ZOOM_ENV_SETUP_MESSAGE =
    'Zoom မချိတ်ထားသေးပါ။ hosting/server ရဲ့ environment (ဥပမာ .env) တွင် ZOOM_ACCOUNT_ID၊ ZOOM_CLIENT_ID၊ ZOOM_CLIENT_SECRET ၎င်းသုံးခု (Zoom Marketplace → Server-to-Server OAuth app) သို့မဟုတ် အချိန်ကုန်မှ ပြန်လည်ထုတ်ရသော ZOOM_ACCESS_TOKEN တစ်ခုထည့်ပြီး API server ကို ပြန်စပါ။'
const hasGoogleOAuthConfig = !invalidSecretValue(GOOGLE_OAUTH_CLIENT_ID) && !invalidSecretValue(GOOGLE_OAUTH_CLIENT_SECRET) && !invalidSecretValue(GOOGLE_OAUTH_REDIRECT_URI) && !invalidSecretValue(GOOGLE_DRIVE_FOLDER_ID)
const normalizeGooglePrivateKey = (rawValue = '') => {
    const raw = String(rawValue || '').trim()
    if (!raw) return ''

    if (raw.includes('BEGIN PRIVATE KEY')) {
        return raw.replace(/\\n/g, '\n')
    }

    // Accept plain base64 body from env and reconstruct PEM.
    const body = raw.replace(/\s+/g, '')
    if (!body) return ''
    const wrapped = body.match(/.{1,64}/g)?.join('\n') || body
    return `-----BEGIN PRIVATE KEY-----\n${wrapped}\n-----END PRIVATE KEY-----`
}

const GOOGLE_DRIVE_PRIVATE_KEY = normalizeGooglePrivateKey(rawGoogleDrivePrivateKey)
const hasGoogleDriveServiceAccountConfig = !invalidSecretValue(GOOGLE_DRIVE_CLIENT_EMAIL) && !invalidSecretValue(GOOGLE_DRIVE_PRIVATE_KEY) && !invalidSecretValue(GOOGLE_DRIVE_FOLDER_ID)

if (!hasZoomConfig) {
    console.warn('Warning: Zoom auto meeting creation is disabled because Zoom credentials are missing.')
}

if (!hasGoogleOAuthConfig && !hasGoogleDriveServiceAccountConfig) {
    console.warn('Warning: Google Drive upload is disabled because OAuth/service account credentials are missing.')
}

let zoomTokenCache = { token: '', expiresAt: 0 }
let runtimeGoogleRefreshToken = ''
let googleOauthState = ''

const normalizeMyanmarPhone = (phone = '') => {
    const digits = String(phone).replace(/[^\d+]/g, '')
    if (digits.startsWith('+959')) return digits
    if (digits.startsWith('959')) return `+${digits}`
    if (digits.startsWith('09')) return `+959${digits.slice(2)}`
    if (digits.startsWith('9')) return `+95${digits}`
    return digits
}

/** Values NocoDB might store for the same Myanmar mobile (form uses +959…; manual rows often use 09… or 959…). */
const myanmarPhoneEqVariants = (rawInput) => {
    const normalized = normalizeMyanmarPhone(rawInput)
    const variants = new Set()
    variants.add(normalized)
    const d = normalized.replace(/\D/g, '')
    if (d.startsWith('959') && d.length >= 4) {
        variants.add(`+${d}`)
        variants.add(`0${d.slice(3)}`)
        variants.add(d)
    }
    return [...variants].filter(Boolean)
}

app.use(cors())
app.use(express.json({ limit: '10mb' }))
const upload = multer({ storage: multer.memoryStorage() })

const nocodbRequest = async (path, options = {}) => {
    if (!hasValidNocoToken) {
        throw new Error('Server is missing a valid NOCODB_API_TOKEN.')
    }

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

const uploadFileToNocoStorage = async (file, fallbackName = 'upload.bin') => {
    const form = new FormData()
    const blob = new Blob([file.buffer], { type: file.mimetype || 'application/octet-stream' })
    form.append('file', blob, file.originalname || fallbackName)

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
    return uploaded
}

const toAttachmentList = (value) => {
    if (Array.isArray(value)) return value.filter(Boolean)
    if (value && typeof value === 'object') return [value]
    return []
}

const uploadFileToGoogleDrive = async (file, fileNamePrefix = 'consultation-recording') => {
    if (!hasGoogleOAuthConfig && !hasGoogleDriveServiceAccountConfig) {
        throw new Error('Google Drive is not configured on server.')
    }

    const auth = getGoogleAuthClient()

    const drive = google.drive({ version: 'v3', auth })

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const safeOriginal = String(file.originalname || 'recording.mp4').replace(/[^\w.-]/g, '_')
    const finalFileName = `${fileNamePrefix}-${timestamp}-${safeOriginal}`

    const created = await drive.files.create({
        requestBody: {
            name: finalFileName,
            parents: [GOOGLE_DRIVE_FOLDER_ID]
        },
        supportsAllDrives: true,
        media: {
            mimeType: file.mimetype || 'application/octet-stream',
            body: Readable.from(file.buffer)
        },
        fields: 'id,name,webViewLink,webContentLink'
    })

    const fileId = String(created?.data?.id || '')
    if (!fileId) {
        throw new Error('Google Drive upload failed: missing file id')
    }

    await drive.permissions.create({
        fileId,
        supportsAllDrives: true,
        requestBody: {
            role: 'reader',
            type: 'anyone'
        }
    })

    const metadata = await drive.files.get({
        fileId,
        supportsAllDrives: true,
        fields: 'id,name,webViewLink,webContentLink'
    })

    const webViewLink = String(metadata?.data?.webViewLink || '')
    const webContentLink = String(metadata?.data?.webContentLink || '')
    const downloadLink = webContentLink || `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`

    return {
        fileId,
        fileName: String(metadata?.data?.name || finalFileName),
        webViewLink,
        downloadLink
    }
}

const getGoogleAuthClient = () => {
    const refreshToken = runtimeGoogleRefreshToken || GOOGLE_OAUTH_REFRESH_TOKEN
    if (hasGoogleOAuthConfig && !invalidSecretValue(refreshToken)) {
        const oauth2Client = new google.auth.OAuth2(
            GOOGLE_OAUTH_CLIENT_ID,
            GOOGLE_OAUTH_CLIENT_SECRET,
            GOOGLE_OAUTH_REDIRECT_URI
        )
        oauth2Client.setCredentials({ refresh_token: refreshToken })
        return oauth2Client
    }

    if (hasGoogleDriveServiceAccountConfig) {
        return new google.auth.JWT({
            email: GOOGLE_DRIVE_CLIENT_EMAIL,
            key: GOOGLE_DRIVE_PRIVATE_KEY,
            scopes: ['https://www.googleapis.com/auth/drive']
        })
    }

    throw new Error('Google OAuth refresh token is missing. Please connect Google Drive first.')
}

const getGoogleOAuthClient = () => {
    if (!hasGoogleOAuthConfig) {
        throw new Error('Google OAuth client is not configured.')
    }
    return new google.auth.OAuth2(
        GOOGLE_OAUTH_CLIENT_ID,
        GOOGLE_OAUTH_CLIENT_SECRET,
        GOOGLE_OAUTH_REDIRECT_URI
    )
}

const toIsoDateTime = (preferredDate, preferredTime) => {
    const dateText = String(preferredDate || '').trim()
    const timeText = String(preferredTime || '').trim()
    const fallback = new Date(Date.now() + 5 * 60 * 1000)

    if (!dateText && !timeText) return fallback.toISOString()

    if (timeText.includes('T')) {
        const fromIso = new Date(timeText)
        if (!Number.isNaN(fromIso.getTime())) return fromIso.toISOString()
    }

    let hh = '09'
    let mm = '00'
    const hhmm = timeText.match(/(\d{1,2}):(\d{2})/)
    if (hhmm) {
        hh = hhmm[1].padStart(2, '0')
        mm = hhmm[2]
    }

    const safeDate = dateText || new Date().toISOString().slice(0, 10)
    return `${safeDate}T${hh}:${mm}:00+06:30`
}

const getZoomAccessToken = async () => {
    if (!hasZoomOAuthConfig) {
        if (hasZoomStaticToken) return ZOOM_ACCESS_TOKEN
        throw new Error(ZOOM_ENV_SETUP_MESSAGE)
    }

    const now = Date.now()
    if (zoomTokenCache.token && zoomTokenCache.expiresAt > now + 60_000) {
        return zoomTokenCache.token
    }

    const auth = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')
    const tokenResponse = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(ZOOM_ACCOUNT_ID)}`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${auth}`
        }
    })
    const tokenText = await tokenResponse.text()
    const tokenData = tokenText ? JSON.parse(tokenText) : {}
    if (!tokenResponse.ok || !tokenData.access_token) {
        throw new Error(tokenData.reason || tokenData.message || 'Failed to get Zoom access token')
    }

    const expiresInMs = Math.max(120, Number(tokenData.expires_in || 3600)) * 1000
    zoomTokenCache = {
        token: tokenData.access_token,
        expiresAt: now + expiresInMs
    }
    return zoomTokenCache.token
}

const createZoomMeetingForBooking = async (booking) => {
    if (!hasZoomConfig) {
        throw new Error(ZOOM_ENV_SETUP_MESSAGE)
    }

    const accessToken = await getZoomAccessToken()
    const startTime = toIsoDateTime(booking.PreferredDate, booking.PreferredTime)
    const topicNameRaw = String(booking.Name || 'Patient').trim() || 'Patient'
    // Keep patient-visible identity in Zoom title (supports Myanmar text).
    const topicNameSafe = topicNameRaw.replace(/\s+/g, ' ').trim() || 'Patient'
    const topicPrefix = Number.isFinite(Number(booking.Id)) ? `Consultation #${Number(booking.Id)}` : 'Consultation'
    const topic = `${topicPrefix} - ${topicNameSafe}`
    const agenda = `Booking ID: ${booking.Id || '-'}\nPatient: ${topicNameRaw}\nPhone: ${booking.Phone || '-'}\nDate: ${booking.PreferredDate || '-'}\nTime: ${booking.PreferredTime || '-'}`
    const meetingResponse = await fetch('https://api.zoom.us/v2/users/me/meetings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            topic,
            agenda,
            type: 2,
            start_time: startTime,
            timezone: ZOOM_TIMEZONE,
            duration: 30,
            settings: {
                waiting_room: true,
                join_before_host: false
            }
        })
    })
    const meetingText = await meetingResponse.text()
    const meetingData = meetingText ? JSON.parse(meetingText) : {}
    if (!meetingResponse.ok || !meetingData.join_url) {
        throw new Error(meetingData.message || 'Failed to create Zoom meeting')
    }
    return {
        joinUrl: String(meetingData.join_url || '').trim(),
        startUrl: String(meetingData.start_url || '').trim(),
        meetingId: String(meetingData.id || '').trim()
    }
}

const fetchBookingById = async (bookingId) => {
    const recordId = Number(bookingId)
    if (!Number.isFinite(recordId)) {
        throw new Error('Invalid booking id')
    }
    return nocodbRequest(`/api/v2/tables/${NOCODB_BOOKING_TABLE_ID}/records/${recordId}`)
}

const updateBookingMeetingLinks = async (bookingId, joinUrl, startUrl = '') => {
    const recordId = Number(bookingId)
    const payload = {
        Id: recordId,
        MeetingLink: String(joinUrl || '').trim()
    }
    await nocodbRequest(`/api/v2/tables/${NOCODB_BOOKING_TABLE_ID}/records`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    })

    if (startUrl) {
        // Best effort only; some tables may not have DoctorMeetingLink column yet.
        try {
            await nocodbRequest(`/api/v2/tables/${NOCODB_BOOKING_TABLE_ID}/records`, {
                method: 'PATCH',
                body: JSON.stringify({
                    Id: recordId,
                    DoctorMeetingLink: startUrl
                })
            })
        } catch {
            // Ignore optional column update failure.
        }
    }
}

/** Same rules as src/utils/bookingStatus.js (ConsultationType status:* wins). */
const normalizeStatusToken = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, '_')

const resolveBookingRowStatusKey = (item) => {
    if (typeof item.ConsultationType === 'string' && item.ConsultationType.startsWith('status:')) {
        return normalizeStatusToken(item.ConsultationType.replace('status:', ''))
    }
    if (item.BookingStatus) return normalizeStatusToken(item.BookingStatus)
    if (item.PaymentStatus) return normalizeStatusToken(item.PaymentStatus)
    if (item.PaymentScreenshot) return 'payment_submitted'
    return 'pending_payment'
}

/** Noco/API sometimes returns different key casing; keep admin table and search consistent */
const normalizeBookingRow = (item) => {
    if (!item || typeof item !== 'object') return item
    return {
        ...item,
        Name: item.Name || item.name || '',
        Phone: item.Phone || item.phone || '',
        Email: item.Email || item.email || ''
    }
}

const requireAdmin = (req, res, next) => {
    if (!hasValidAdminKey) {
        return res.status(503).json({ error: 'Admin is not configured on this server.' })
    }

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

        if (type === 'phone') {
            const variants = myanmarPhoneEqVariants(safeValue)
            const seen = new Set()
            const merged = []
            for (const v of variants) {
                const encoded = encodeURIComponent(v)
                const data = await nocodbRequest(
                    `/api/v2/tables/${NOCODB_BOOKING_TABLE_ID}/records?where=(${field},eq,${encoded})&sort=-CreatedAt`
                )
                for (const row of data.list || []) {
                    const id = row?.Id ?? row?.id
                    if (id != null && !seen.has(id)) {
                        seen.add(id)
                        merged.push(row)
                    }
                }
            }
            merged.sort((a, b) => {
                const ta = new Date(a.CreatedAt || a.created_at || 0).getTime()
                const tb = new Date(b.CreatedAt || b.created_at || 0).getTime()
                return tb - ta
            })
            return res.json(merged)
        }

        safeValue = safeValue.toLowerCase()
        const encodedLower = encodeURIComponent(safeValue)
        let data = await nocodbRequest(
            `/api/v2/tables/${NOCODB_BOOKING_TABLE_ID}/records?where=(${field},eq,${encodedLower})&sort=-CreatedAt`
        )
        let list = data.list || []
        if (list.length === 0 && String(value).trim() !== safeValue) {
            const encodedOriginal = encodeURIComponent(String(value).replace(/,/g, '').trim())
            data = await nocodbRequest(
                `/api/v2/tables/${NOCODB_BOOKING_TABLE_ID}/records?where=(${field},eq,${encodedOriginal})&sort=-CreatedAt`
            )
            list = data.list || []
        }
        res.json(list)
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

app.patch('/api/bookings/:id/channel', async (req, res) => {
    try {
        const channel = String(req.body?.channel || '').trim()
        const allowedChannels = ['telegram', 'viber', 'whatsapp', 'zoom']
        if (!allowedChannels.includes(channel)) {
            return res.status(400).json({ error: 'Invalid channel value' })
        }

        const recordId = Number(req.params.id)
        if (!Number.isFinite(recordId)) {
            return res.status(400).json({ error: 'Invalid booking id' })
        }

        const updated = await nocodbRequest(`/api/v2/tables/${NOCODB_BOOKING_TABLE_ID}/records`, {
            method: 'PATCH',
            body: JSON.stringify({
                Id: recordId,
                PreferredChannel: channel
            })
        })

        // Optional best-effort reset for existing per-booking meeting link.
        // Some NocoDB tables may not yet have MeetingLink column, so do not fail the channel update.
        try {
            await nocodbRequest(`/api/v2/tables/${NOCODB_BOOKING_TABLE_ID}/records`, {
                method: 'PATCH',
                body: JSON.stringify({
                    Id: recordId,
                    MeetingLink: ''
                })
            })
        } catch {
            // Ignore secondary reset error to keep patient-facing channel updates reliable.
        }

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

        const recordId = Number(req.params.id)
        if (!Number.isFinite(recordId)) {
            return res.status(400).json({ error: 'Invalid booking id' })
        }

        const field = NOCODB_MEDICAL_RECORDS_FIELD
        const record = await nocodbRequest(`/api/v2/tables/${NOCODB_BOOKING_TABLE_ID}/records/${recordId}`)
        const rawExisting = record[field]
        const existing = toAttachmentList(rawExisting)

        const uploadedFiles = []
        for (const file of req.files) {
            const uploaded = await uploadFileToNocoStorage(file, file.originalname || 'medical-record.jpg')
            uploadedFiles.push(...uploaded)
        }

        const normalized = uploadedFiles.map((a) => {
            const o = typeof a === 'object' && a ? a : {}
            return {
                ...o,
                title: o.title || o.filename || o.FileName || 'medical-record'
            }
        })

        const merged = [...existing, ...normalized]

        const payload = { [field]: merged }
        try {
            await nocodbRequest(`/api/v2/tables/${NOCODB_BOOKING_TABLE_ID}/records/${recordId}`, {
                method: 'PATCH',
                body: JSON.stringify(payload)
            })
        } catch {
            await nocodbRequest(`/api/v2/tables/${NOCODB_BOOKING_TABLE_ID}/records`, {
                method: 'PATCH',
                body: JSON.stringify({ Id: recordId, ...payload })
            })
        }

        const after = await nocodbRequest(`/api/v2/tables/${NOCODB_BOOKING_TABLE_ID}/records/${recordId}`)
        const afterList = toAttachmentList(after[field])

        if (merged.length > 0 && afterList.length === 0) {
            console.error('[medical-records] NocoDB field empty after PATCH', { recordId, field })
            return res.status(502).json({
                error:
                    'မှတ်တမ်း ဖိုင်များ ဒေတာဘေ့စ်မှာ မသိမ်းရသေးပါ။ NocoDB မှာ booking စာပိုင်းတွင်း Attachment column နာမည် (API column name) သည် server env `NOCODB_MEDICAL_RECORDS_FIELD` နှင့် တူညီရမည်။ စာမျက်နှာ: Table → ပြင်ဆင်ချက် → Medical records ကော်လံ၏ "Column name" ကို ကြည့်ပြီး .env တွင် ထည့်ပါ။'
            })
        }

        res.json(after)
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

        // Prefer Id so manually inserted rows without CreatedAt are not dropped from the first page/window.
        const data = await nocodbRequest(`/api/v2/tables/${NOCODB_BOOKING_TABLE_ID}/records?sort=-Id&limit=2000`)
        const list = (data.list || []).map(normalizeBookingRow)

        const filtered = list.filter((item) => {
            const rowDate = item.PreferredDate || ''
            const searchable = `${item.Name || ''} ${item.Phone || ''} ${item.Email || ''}`.toLowerCase()

            const statusOk = !status || resolveBookingRowStatusKey(item) === normalizeStatusToken(status)
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
        const { status, meetingLink } = req.body
        const allowed = ['pending_payment', 'payment_submitted', 'confirmed', 'rejected', 'completed', 'records_reviewed']
        if (!allowed.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' })
        }

        // PaymentStatus is currently a SingleSelect without options in NocoDB.
        // Persist admin decision in ConsultationType text column as fallback.
        const payload = {
            Id: Number(req.params.id),
            ConsultationType: `status:${status}`
        }
        const resolvedMeetingLink = typeof meetingLink === 'string' ? meetingLink.trim() : ''

        if (resolvedMeetingLink) {
            payload.MeetingLink = resolvedMeetingLink
        }

        const updated = await nocodbRequest(`/api/v2/tables/${NOCODB_BOOKING_TABLE_ID}/records`, {
            method: 'PATCH',
            body: JSON.stringify(payload)
        })
        res.json(updated)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.post('/api/admin/bookings/:id/meeting-link/auto', requireAdmin, async (req, res) => {
    try {
        const booking = await fetchBookingById(req.params.id)
        const channel = String(req.body?.channel || booking.PreferredChannel || '').trim().toLowerCase()
        if (channel && channel !== 'zoom') {
            return res.status(400).json({ error: 'Auto generation is only available for Zoom channel.' })
        }
        const meeting = await createZoomMeetingForBooking(booking)
        await updateBookingMeetingLinks(req.params.id, meeting.joinUrl, meeting.startUrl)
        res.json({
            meetingLink: meeting.joinUrl,
            doctorStartLink: meeting.startUrl,
            meetingId: meeting.meetingId
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.patch('/api/admin/bookings/:id/meeting-link', requireAdmin, async (req, res) => {
    try {
        const meetingLink = String(req.body?.meetingLink || '').trim()
        const updated = await nocodbRequest(`/api/v2/tables/${NOCODB_BOOKING_TABLE_ID}/records`, {
            method: 'PATCH',
            body: JSON.stringify({
                Id: Number(req.params.id),
                MeetingLink: meetingLink
            })
        })
        res.json(updated)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.patch('/api/admin/bookings/:id/records-reviewed', requireAdmin, async (req, res) => {
    try {
        const updated = await nocodbRequest(`/api/v2/tables/${NOCODB_BOOKING_TABLE_ID}/records`, {
            method: 'PATCH',
            body: JSON.stringify({
                Id: Number(req.params.id),
                ConsultationType: 'status:records_reviewed'
            })
        })
        res.json(updated)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.patch('/api/admin/bookings/:id/recording-upload', requireAdmin, upload.single('recording'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Recording file is required' })
        }

        const recordId = Number(req.params.id)
        if (!Number.isFinite(recordId)) {
            return res.status(400).json({ error: 'Invalid booking id' })
        }

        const driveUpload = await uploadFileToGoogleDrive(req.file, `booking-${recordId}`)

        const payload = {
            Id: recordId,
            RecordingLink: driveUpload.downloadLink,
            RecordingPublished: false
        }
        await nocodbRequest(`/api/v2/tables/${NOCODB_BOOKING_TABLE_ID}/records`, {
            method: 'PATCH',
            body: JSON.stringify(payload)
        })

        // Best-effort optional metadata columns (if present in table schema).
        try {
            await nocodbRequest(`/api/v2/tables/${NOCODB_BOOKING_TABLE_ID}/records`, {
                method: 'PATCH',
                body: JSON.stringify({
                    Id: recordId,
                    RecordingShareLink: driveUpload.webViewLink,
                    RecordingStorage: 'google_drive',
                    RecordingFileId: driveUpload.fileId
                })
            })
        } catch {
            // Ignore optional metadata update errors.
        }

        res.json({
            ok: true,
            recordingLink: driveUpload.downloadLink,
            inviteLink: driveUpload.webViewLink,
            published: false
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.get('/api/admin/google-drive/oauth-url', requireAdmin, async (_req, res) => {
    try {
        const oauth2Client = getGoogleOAuthClient()
        googleOauthState = `${Date.now()}-${Math.random().toString(36).slice(2)}`
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: ['https://www.googleapis.com/auth/drive.file'],
            include_granted_scopes: true,
            state: googleOauthState
        })
        res.json({ authUrl })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.get('/api/google-drive/oauth/callback', async (req, res) => {
    try {
        const { code = '', state = '' } = req.query
        if (!code) {
            return res.status(400).send('Missing authorization code.')
        }
        if (googleOauthState && state !== googleOauthState) {
            return res.status(400).send('Invalid OAuth state. Please retry from admin oauth-url endpoint.')
        }
        const oauth2Client = getGoogleOAuthClient()
        const { tokens } = await oauth2Client.getToken(String(code))
        const refreshToken = String(tokens?.refresh_token || '').trim()
        if (!refreshToken) {
            return res.status(400).send('No refresh token returned. Revoke old app access and retry with consent prompt.')
        }
        runtimeGoogleRefreshToken = refreshToken
        return res.send(
            `Google Drive connected successfully.\n\nSet this on server env:\nGOOGLE_OAUTH_REFRESH_TOKEN=${refreshToken}\n\nThen restart service/container.`
        )
    } catch (error) {
        return res.status(500).send(`OAuth callback failed: ${error.message}`)
    }
})

app.patch('/api/admin/bookings/:id/recording-visibility', requireAdmin, async (req, res) => {
    try {
        const recordId = Number(req.params.id)
        if (!Number.isFinite(recordId)) {
            return res.status(400).json({ error: 'Invalid booking id' })
        }

        const publish = Boolean(req.body?.publish)
        await nocodbRequest(`/api/v2/tables/${NOCODB_BOOKING_TABLE_ID}/records`, {
            method: 'PATCH',
            body: JSON.stringify({
                Id: recordId,
                RecordingPublished: publish
            })
        })
        res.json({ ok: true, published: publish })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

const distPath = join(__dirname, '..', 'dist')
if (existsSync(distPath)) {
    app.use(express.static(distPath))
    // Express 5 no longer accepts string "*" path patterns.
    app.get(/.*/, (_req, res) => {
        res.sendFile(join(distPath, 'index.html'))
    })
}

app.listen(PORT, () => {
    console.log(`API server listening on http://localhost:${PORT}`)
})
