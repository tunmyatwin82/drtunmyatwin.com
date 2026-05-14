/**
 * Single place for "what status do we show?" Admin writes workflow to
 * ConsultationType as `status:*` (see server); that must win over stale selects.
 */
export function resolveBookingDisplayStatus(row) {
    const r = row || {}
    if (typeof r.ConsultationType === 'string' && r.ConsultationType.startsWith('status:')) {
        return r.ConsultationType.replace('status:', '')
    }
    if (r.BookingStatus) return r.BookingStatus
    if (r.PaymentStatus) return r.PaymentStatus
    if (r.PaymentScreenshot) return 'payment_submitted'
    return 'pending_payment'
}
