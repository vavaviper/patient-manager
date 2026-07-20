# DentalFlow

A production-quality dental office management platform built with modern full-stack architecture.

![DentalFlow](https://img.shields.io/badge/DentalFlow-Practice%20Management-2563eb)

## Overview

DentalFlow is a commercial-grade SaaS platform for dental clinics featuring:

- **Kanban Patient Board** — Drag-and-drop patient status management
- **Smart Scheduling** — Conflict-free appointment booking with available slot detection
- **Automated Recall** — BullMQ scheduled jobs for reminders and status updates
- **Analytics Dashboard** — Recharts-powered insights
- **Role-Based Access** — Admin, Receptionist, and Dentist roles
- **Email Notifications** — Resend-powered HTML email templates

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js 16, React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, dnd-kit, Recharts |
| Backend | NestJS, Prisma ORM, PostgreSQL, Redis, BullMQ, JWT |
| Email | Resend |
| Deployment | Vercel (frontend), Railway (backend) |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL
- Redis

### Backend Setup

```bash
cd backend
cp .env.example .env
# Configure DATABASE_URL, REDIS_URL, JWT_SECRET, RESEND_API_KEY

npm install
npm run db:push
npm run db:seed
npm run start:dev
```

API runs at `http://localhost:3001/api`

### Frontend Setup

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

App runs at `http://localhost:3000`

## Demo Accounts

| Email | Role | Password |
|-------|------|----------|
| admin@dentalflow.com | Admin | password123 |
| reception@dentalflow.com | Receptionist | password123 |
| dentist@dentalflow.com | Dentist | password123 |

## Seed Data

- 200 patients with varied statuses
- 10 dentists across specialties
- 500 appointments (past and upcoming)
- 5 operatories

## Project Structure

```
patient-manager/
├── backend/
│   ├── prisma/           # Schema, migrations, seed
│   └── src/
│       ├── common/       # Guards, decorators, constants
│       ├── modules/      # Feature modules (auth, patients, etc.)
│       └── prisma/       # Database service
└── frontend/
    └── src/
        ├── app/          # Next.js App Router pages
        ├── components/   # UI components
        ├── contexts/     # React contexts
        ├── hooks/        # Custom hooks
        ├── lib/          # API client, utilities
        └── types/        # TypeScript definitions
```

## Features

### Patient Management
- Kanban board with drag-and-drop status updates
- Searchable patient table with filters and pagination
- Full patient profiles with tabs (Overview, Appointments, Notes, Insurance, Timeline)
- CSV export

### Appointments
- Book with patient, dentist, operatory, date/time selection
- Double-booking prevention
- Available slot detection
- Calendar views (day/week/month)
- Confirmation emails via Resend

### Automation
- Daily appointment reminders (BullMQ)
- Nightly recall due status updates
- Inactive patient detection (3+ years)

### UX
- Dark mode
- Global search (⌘K)
- Notification center
- Keyboard shortcuts
- Optimistic UI updates
- Loading skeletons & empty states
- Error boundaries

## Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel
```

Set `NEXT_PUBLIC_API_URL` to your Railway backend URL.

### Backend (Railway)
1. Create PostgreSQL and Redis services
2. Deploy backend with environment variables
3. Run migrations: `npm run db:push && npm run db:seed`

## License

Private — All rights reserved.
