# Dr. Tun Myat Win - Medical Practice Website

## Project Overview
A professional medical practice web application for Dr. Tun Myat Win. Features appointment booking, payment proof submission, medical record uploads, lead generation, and an admin dashboard.

## Architecture
- **Frontend**: React 19 + Vite, served on port 5000 in development
- **Backend**: Node.js + Express API server, running on port 8000
- **Database**: NocoDB (external, hosted at db.drtunmyatwin.com) via REST API
- **File uploads**: Multer (memory storage) → NocoDB storage API

## Key Configuration
- Vite proxies `/api` requests to `http://localhost:8000` in dev
- `allowedHosts: true` set in Vite config for Replit proxy compatibility
- In production, Express serves the built `dist/` folder and handles all API routes on port 5000

## Workflows
- **Start application**: `npm run dev` — Vite dev server on port 5000 (webview)
- **Backend API**: `npm run server` — Express API server on port 8000 (console)

## Environment Variables
See `.env.example` for required variables:
- `NOCODB_API_URL` — NocoDB instance URL
- `NOCODB_LEAD_TABLE_ID` — Table ID for leads
- `NOCODB_BOOKING_TABLE_ID` — Table ID for bookings
- `NOCODB_API_TOKEN` — API authentication token
- `ADMIN_DASHBOARD_KEY` — Key for admin dashboard access
- `PORT` — Server port (defaults to 8000 in dev, 5000 in production)

## Project Structure
- `/src` — React frontend source (pages, components, assets)
- `/server/index.js` — Express backend (API routes, file uploads)
- `/public` — Static public assets (PDFs, icons)
- `/plans` — Documentation and planning docs

## Deployment
Configured for autoscale deployment:
- Build: `npm run build`
- Run: `PORT=5000 node server/index.js` (serves both API and built static files)
