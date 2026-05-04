# drtunmyatwin.com

Doctor booking website with:
- React + Vite frontend
- Express API server
- NocoDB as data and file storage backend

## Tech Stack

- Frontend: React 19, Vite 8, React Router 7
- Backend: Express 5, Multer, dotenv
- Tooling: ESLint

## Prerequisites

- Node.js 20+ (recommended)
- npm
- Running NocoDB instance and API token

## Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in real values (do not use placeholders)

Required variables:

```bash
NOCODB_API_URL=https://db.drtunmyatwin.com
NOCODB_LEAD_TABLE_ID=...
NOCODB_BOOKING_TABLE_ID=...
NOCODB_API_TOKEN=...
ADMIN_DASHBOARD_KEY=...
```

Optional variables:

```bash
PORT=8000
PAYMENT_PHONE=09421068582
DOCTOR_NAME=ဒေါက်တာထွန်းမြတ်ဝင်း
```

## Install

```bash
npm install
```

## Run Locally (Development)

Run API server and frontend in separate terminals:

```bash
npm run server
```

```bash
npm run dev
```

App URL: `http://localhost:5000`  
API URL: `http://localhost:8000`

Vite proxies `/api` calls to the API server.

## Build and Preview Frontend

```bash
npm run build
npm run preview
```

## Lint

```bash
npm run lint
```

## API Overview

Patient endpoints:
- `POST /api/leads`
- `POST /api/bookings`
- `GET /api/bookings/search`
- `GET /api/bookings/:id`
- `PATCH /api/bookings/:id/payment`
- `PATCH /api/bookings/:id/payment-upload`
- `PATCH /api/bookings/:id/channel`
- `PATCH /api/bookings/:id/medical-records`

Admin endpoints (require `x-admin-key` header):
- `GET /api/admin/bookings`
- `PATCH /api/admin/bookings/:id/status`
- `PATCH /api/admin/bookings/:id/meeting-link`
- `PATCH /api/admin/bookings/:id/records-reviewed`

## Production Note

When `dist/` exists, the API server also serves the built frontend.
