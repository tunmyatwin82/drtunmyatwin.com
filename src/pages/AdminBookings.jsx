import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './AdminBookings.css'

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
    const resolveStatus = (row) => {
        if (row.BookingStatus) return row.BookingStatus
        if (row.PaymentStatus) return row.PaymentStatus
        if (typeof row.ConsultationType === 'string' && row.ConsultationType.startsWith('status:')) {
            return row.ConsultationType.replace('status:', '')
        }
        if (row.PaymentScreenshot) return 'payment_submitted'
        return 'pending_payment'
    }
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
            setRows(data.rows || [])
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
            const response = await fetch(`/api/admin/bookings/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify({ status: nextStatus })
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Update failed')
            fetchRows()
        } catch (err) {
            alert(err.message)
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
                                                    <th>Date</th>
                                                    <th>Time</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rows.map((row) => (
                                                    <tr key={row.Id || row.id}>
                                                        <td>{row.Name || '-'}</td>
                                                        <td>{row.Phone || '-'}</td>
                                                        <td>{row.PreferredDate || '-'}</td>
                                                        <td>{row.PreferredTime || '-'}</td>
                                                        <td><StatusBadge status={resolveStatus(row)} /></td>
                                                        <td className="actions">
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
