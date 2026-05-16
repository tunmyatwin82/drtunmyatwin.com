import { useEffect, useRef, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './AdminBookings.css'
import { resolveBookingDisplayStatus } from '../utils/bookingStatus'
import { openZoomLinkPreferApp } from '../utils/zoomLinks'

const PAGE_SIZE = 10

// Validate key contains only ASCII characters (safe for HTTP headers)
const isValidHeaderValue = (str) => /^[\x20-\x7E]*$/.test(str)

const STATUS_LABELS = {
    pending_payment: { text: 'ငွေပေးချေရန်ကျန်', cls: 'status-pending' },
    payment_submitted: { text: 'ငွေပေးချေမှု စစ်ဆေးဆဲ', cls: 'status-submitted' },
    confirmed: { text: 'အတည်ပြုပြီး', cls: 'status-confirmed' },
    records_reviewed: { text: 'မှတ်တမ်း စစ်ဆေးပြီး', cls: 'status-reviewed' },
    rejected: { text: 'ပယ်ဖျက်ပြီး', cls: 'status-rejected' },
    completed: { text: 'ပြီးဆုံးပြီး', cls: 'status-completed' },
}

function StatusBadge({ status }) {
    const info = STATUS_LABELS[status] || { text: status || 'N/A', cls: 'status-unknown' }
    return <span className={`admin-status-badge ${info.cls}`}>{info.text}</span>
}

function AdminBookings() {
    const formatFileSize = (bytes = 0) => {
        const value = Number(bytes)
        if (!Number.isFinite(value) || value <= 0) return '0 B'
        if (value < 1024) return `${value} B`
        if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
        if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`
        return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`
    }

    const parseApiResponse = async (response) => {
        const text = await response.text()
        try {
            return text ? JSON.parse(text) : {}
        } catch {
            return { error: `Server returned non-JSON response (${response.status}). Please restart backend server.` }
        }
    }

    const resolveStatus = resolveBookingDisplayStatus
    const [adminKey, setAdminKey] = useState(() => {
        const stored = sessionStorage.getItem('adminKey') || ''
        // Clear corrupt (non-ASCII) keys from previous sessions
        if (stored && !isValidHeaderValue(stored)) {
            sessionStorage.removeItem('adminKey')
            return ''
        }
        return stored
    })
    const [keyInput, setKeyInput] = useState('')
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [q, setQ] = useState('')
    const [status, setStatus] = useState('')
    const [date, setDate] = useState('')
    const [meetingLinks, setMeetingLinks] = useState({})
    const [doctorMeetingLinks, setDoctorMeetingLinks] = useState({})
    const [meetingProviders, setMeetingProviders] = useState({})
    const [generatingLinkFor, setGeneratingLinkFor] = useState('')
    const [recordingFiles, setRecordingFiles] = useState({})
    const [uploadingRecordingFor, setUploadingRecordingFor] = useState('')
    const [publishingRecordingFor, setPublishingRecordingFor] = useState('')
    const recordingInputRefs = useRef({})

    const isRecordingPublished = (row) => {
        const raw = row?.RecordingPublished
        if (typeof raw === 'boolean') return raw
        const value = String(raw || '').trim().toLowerCase()
        return value === 'true' || value === '1' || value === 'yes'
    }

    const fetchRows = async () => {
        if (!adminKey) return
        setLoading(true)
        setError('')
        try {
            const params = new URLSearchParams({
                page: String(page),
                pageSize: String(PAGE_SIZE),
                q,
                status,
                date
            })
            const url = `/api/admin/bookings?${params.toString()}`
            console.log('[Admin] Fetching:', url)
            const response = await fetch(url, {
                headers: { 'x-admin-key': adminKey }
            })
            console.log('[Admin] Response status:', response.status)

            // Handle non-JSON responses gracefully
            const text = await response.text()
            let data
            try {
                data = text ? JSON.parse(text) : {}
            } catch {
                throw new Error(`Server error (${response.status}): API server may not be running`)
            }

            if (!response.ok) {
                // Auto-clear key and show login again on 401
                if (response.status === 401) {
                    setAdminKey('')
                    sessionStorage.removeItem('adminKey')
                }
                throw new Error(data.error || 'Failed to load bookings')
            }
            console.log('[Admin] Loaded', data.rows?.length, 'rows out of', data.total, 'total')
            const nextRows = data.rows || []
            setRows(nextRows)
            setMeetingLinks((prev) => {
                const next = { ...prev }
                nextRows.forEach((row) => {
                    const id = String(row.Id || row.id)
                    next[id] = row.MeetingLink || ''
                })
                return next
            })
            setDoctorMeetingLinks((prev) => {
                const next = { ...prev }
                nextRows.forEach((row) => {
                    const id = String(row.Id || row.id)
                    next[id] = row.DoctorMeetingLink || ''
                })
                return next
            })
            setMeetingProviders((prev) => {
                const next = { ...prev }
                nextRows.forEach((row) => {
                    const id = String(row.Id || row.id)
                    if (!(id in next)) {
                        next[id] = 'zoom'
                    }
                })
                return next
            })
            setTotal(data.total || 0)
        } catch (err) {
            console.error('[Admin] Error:', err)
            setError(err.message)
            setRows([])
            setTotal(0)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRows()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adminKey, page, status, date])

    const saveKey = () => {
        const trimmed = keyInput.trim()
        if (!trimmed) return
        if (!isValidHeaderValue(trimmed)) {
            setError('Admin key must contain only ASCII characters')
            return
        }
        setError('')
        setAdminKey(trimmed)
        sessionStorage.setItem('adminKey', trimmed)
        setPage(1)
    }

    const clearKey = () => {
        setAdminKey('')
        setKeyInput('')
        sessionStorage.removeItem('adminKey')
        setRows([])
    }

    const updateStatus = async (id, nextStatus) => {
        try {
            const meetingLink = (meetingLinks[String(id)] || '').trim()
            const channel = String(meetingProviders[String(id)] || 'zoom').trim()
            const response = await fetch(`/api/admin/bookings/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify({ status: nextStatus, meetingLink, channel })
            })
            const data = await parseApiResponse(response)
            if (!response.ok) throw new Error(data.error || 'Update failed')
            fetchRows()
        } catch (err) {
            alert(err.message)
        }
    }

    const generateMeetingLink = async (id) => {
        try {
            setGeneratingLinkFor(String(id))
            const channel = String(meetingProviders[String(id)] || 'zoom').trim()
            const response = await fetch(`/api/admin/bookings/${id}/meeting-link/auto`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify({ channel })
            })
            const data = await parseApiResponse(response)
            if (!response.ok) throw new Error(data.error || 'Failed to generate meeting link')
            if (data.meetingLink) {
                setMeetingLinks((prev) => ({
                    ...prev,
                    [String(id)]: data.meetingLink
                }))
            }
            if (data.doctorStartLink) {
                setDoctorMeetingLinks((prev) => ({
                    ...prev,
                    [String(id)]: data.doctorStartLink
                }))
            }
            fetchRows()
        } catch (err) {
            alert(err.message)
        } finally {
            setGeneratingLinkFor('')
        }
    }

    const uploadRecording = async (id) => {
        const key = String(id)
        const file = recordingFiles[key]
        if (!file) {
            alert('Recording file ကို ဦးစွာ ရွေးပါ')
            return
        }
        try {
            setUploadingRecordingFor(key)
            const formData = new FormData()
            formData.append('recording', file)
            const response = await fetch(`/api/admin/bookings/${id}/recording-upload`, {
                method: 'PATCH',
                headers: {
                    'x-admin-key': adminKey
                },
                body: formData
            })
            const data = await parseApiResponse(response)
            if (!response.ok) throw new Error(data.error || 'Failed to upload recording')
            setRecordingFiles((prev) => ({ ...prev, [key]: null }))
            if (recordingInputRefs.current[key]) {
                recordingInputRefs.current[key].value = ''
            }
            fetchRows()
        } catch (err) {
            alert(err.message)
        } finally {
            setUploadingRecordingFor('')
        }
    }

    const toggleRecordingVisibility = async (id, publish) => {
        try {
            setPublishingRecordingFor(String(id))
            const response = await fetch(`/api/admin/bookings/${id}/recording-visibility`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify({ publish })
            })
            const data = await parseApiResponse(response)
            if (!response.ok) throw new Error(data.error || 'Failed to update recording visibility')
            fetchRows()
        } catch (err) {
            alert(err.message)
        } finally {
            setPublishingRecordingFor('')
        }
    }

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

    return (
        <div className="admin-bookings-page">
            <Navbar />
            <section className="section">
                <div className="container">
                    <div className="admin-card glass-card">
                        <h1>Admin Bookings Dashboard</h1>
                        <p className="admin-subtitle">Filter, search, confirm/reject and manage patient bookings.</p>

                        {!adminKey ? (
                            <div className="admin-auth">
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="Enter admin dashboard key"
                                    value={keyInput}
                                    onChange={(e) => setKeyInput(e.target.value)}
                                />
                                <button className="btn btn-primary" onClick={saveKey}>Unlock Dashboard</button>
                            </div>
                        ) : (
                            <>
                                <div className="admin-toolbar">
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Search by name, phone, email"
                                        value={q}
                                        onChange={(e) => setQ(e.target.value)}
                                    />
                                    <select className="form-input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
                                        <option value="">All status</option>
                                        <option value="pending_payment">pending_payment</option>
                                        <option value="payment_submitted">payment_submitted</option>
                                        <option value="confirmed">confirmed</option>
                                        <option value="records_reviewed">records_reviewed</option>
                                        <option value="rejected">rejected</option>
                                        <option value="completed">completed</option>
                                    </select>
                                    <input type="date" className="form-input" value={date} onChange={(e) => { setDate(e.target.value); setPage(1) }} />
                                    <button className="btn btn-secondary" onClick={() => { setPage(1); fetchRows() }}>Search</button>
                                    <button className="btn btn-secondary" onClick={clearKey}>Lock</button>
                                </div>
                                <div className="admin-help-note">
                                    <strong>အသုံးပြုပုံ:</strong>{' '}
                                    <span>
                                        `Auto Link` နှိပ်လျှင် Zoom link ကို အလိုအလျောက် generate + save လုပ်ပြီးသားဖြစ်သည်။ Host အဖြစ်ဝင်ရန် `Start Meeting (Host)` ကိုသုံးပါ။ Recording သည် `Complete` status ဖြစ်ပြီး `Publish Recording`
                                        နှိပ်ပြီးမှ လူနာဘက်တွင် ပေါ်မည်။ `Auto Link` အလုပ်မလုပ်ပါက API server ဘက်တွင် Zoom credentials (`ZOOM_ACCOUNT_ID` / `ZOOM_CLIENT_ID` / `ZOOM_CLIENT_SECRET`) ထည့်ပြီး ဆာဗာကို ပြန်ဖွင့်ပါ။
                                    </span>
                                </div>

                                {error && <div className="admin-error">{error}</div>}
                                {loading ? (
                                    <p>Loading bookings...</p>
                                ) : (
                                    <div className="admin-table-wrap">
                                        <table className="admin-table">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Phone</th>
                                                    <th>Channel</th>
                                                    <th>Date</th>
                                                    <th>Time</th>
                                                    <th>Meeting Link</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rows.map((row) => (
                                                    <tr key={row.Id || row.id}>
                                                        <td>{row.Name || row.name || '-'}</td>
                                                        <td>{row.Phone || row.phone || '-'}</td>
                                                        <td>{row.PreferredChannel || '-'}</td>
                                                        <td>{row.PreferredDate || '-'}</td>
                                                        <td>{row.PreferredTime || '-'}</td>
                                                        <td>
                                                            {(() => {
                                                                const rowId = String(row.Id || row.id)
                                                                const doctorStartLink = (doctorMeetingLinks[rowId] || '').trim()
                                                                return (
                                                            <div className="meeting-link-cell">
                                                                <input
                                                                    type="url"
                                                                    className="form-input"
                                                                    placeholder="https://meet.google.com/... or https://zoom.us/j/..."
                                                                    value={meetingLinks[rowId] || ''}
                                                                    onChange={(e) => setMeetingLinks((prev) => ({
                                                                        ...prev,
                                                                        [rowId]: e.target.value
                                                                    }))}
                                                                />
                                                                <div className="meeting-link-actions">
                                                                    <select
                                                                        className="form-input meeting-provider-select"
                                                                        value={meetingProviders[rowId] || 'zoom'}
                                                                        onChange={(e) => setMeetingProviders((prev) => ({
                                                                            ...prev,
                                                                            [rowId]: e.target.value
                                                                        }))}
                                                                    >
                                                                        <option value="zoom">Zoom Auto</option>
                                                                    </select>
                                                                    <button
                                                                        className="btn btn-secondary btn-sm"
                                                                        onClick={() => generateMeetingLink(row.Id || row.id)}
                                                                        disabled={generatingLinkFor === rowId}
                                                                    >
                                                                        {generatingLinkFor === rowId ? 'Generating...' : 'Auto Link'}
                                                                    </button>
                                                                </div>
                                                                {doctorStartLink && (
                                                                    <div className="meeting-link-open-actions">
                                                                        <a
                                                                            href={doctorStartLink}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="btn btn-primary btn-sm"
                                                                            onClick={(e) => openZoomLinkPreferApp(doctorStartLink, e)}
                                                                        >
                                                                            Start Meeting (Host)
                                                                        </a>
                                                                    </div>
                                                                )}
                                                            </div>
                                                                )
                                                            })()}
                                                        </td>
                                                        <td><StatusBadge status={resolveStatus(row)} /></td>
                                                        <td className="actions">
                                                            {(() => {
                                                                const rowId = String(row.Id || row.id)
                                                                const hasRecording = Boolean(String(row.RecordingLink || '').trim())
                                                                const published = isRecordingPublished(row)
                                                                const status = resolveStatus(row)
                                                                const canPublish = hasRecording && (status === 'completed' || status === 'records_reviewed')
                                                                const selectedFile = recordingFiles[rowId]
                                                                const recordingUploadState = uploadingRecordingFor === rowId
                                                                    ? { text: 'Uploading...', cls: 'uploading' }
                                                                    : selectedFile
                                                                        ? { text: 'Chosen', cls: 'chosen' }
                                                                        : hasRecording
                                                                            ? { text: 'Uploaded', cls: 'uploaded' }
                                                                            : { text: 'No file', cls: 'idle' }
                                                                return (
                                                                    <>
                                                                        <input
                                                                            ref={(el) => { recordingInputRefs.current[rowId] = el }}
                                                                            type="file"
                                                                            accept="video/mp4,video/x-m4v,video/*,.mp4,.mov,.m4v"
                                                                            className="admin-hidden-file-input"
                                                                            onChange={(e) => setRecordingFiles((prev) => ({
                                                                                ...prev,
                                                                                [rowId]: e.target.files?.[0] || null
                                                                            }))}
                                                                        />
                                                                        {recordingFiles[rowId] && (
                                                                            <span className="recording-file-meta">
                                                                                {recordingFiles[rowId].name} ({formatFileSize(recordingFiles[rowId].size)})
                                                                            </span>
                                                                        )}
                                                                        <span className={`recording-status-chip recording-status-chip--${recordingUploadState.cls}`}>
                                                                            {recordingUploadState.text}
                                                                        </span>
                                                                        <button
                                                                            className="btn btn-secondary btn-sm"
                                                                            onClick={() => recordingInputRefs.current[rowId]?.click()}
                                                                        >
                                                                            Choose Recording
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-secondary btn-sm"
                                                                            onClick={() => uploadRecording(row.Id || row.id)}
                                                                            disabled={uploadingRecordingFor === rowId}
                                                                        >
                                                                            {uploadingRecordingFor === rowId ? 'Uploading...' : 'Upload Recording'}
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-secondary btn-sm"
                                                                            onClick={() => toggleRecordingVisibility(row.Id || row.id, true)}
                                                                            disabled={!canPublish || publishingRecordingFor === rowId}
                                                                        >
                                                                            {published ? 'Published' : 'Publish Recording'}
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-secondary btn-sm"
                                                                            onClick={() => toggleRecordingVisibility(row.Id || row.id, false)}
                                                                            disabled={!hasRecording || publishingRecordingFor === rowId}
                                                                        >
                                                                            Hide Recording
                                                                        </button>
                                                                    </>
                                                                )
                                                            })()}
                                                            <button className="btn btn-primary btn-sm" onClick={() => updateStatus(row.Id || row.id, 'confirmed')}>Confirm</button>
                                                            <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(row.Id || row.id, 'records_reviewed')}>Records Reviewed</button>
                                                            <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(row.Id || row.id, 'rejected')}>Reject</button>
                                                            <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(row.Id || row.id, 'completed')}>Complete</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {rows.length === 0 && <p>No bookings found.</p>}
                                    </div>
                                )}

                                <div className="admin-pagination">
                                    <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
                                    <span>Page {page} / {totalPages}</span>
                                    <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    )
}

export default AdminBookings
