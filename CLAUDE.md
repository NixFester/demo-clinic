# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SIMKlinik is a Clinic Management System (Sistem Informasi Manajemen Klinik) built with Next.js 16. It provides a unified application for patient registration, queue management, electronic medical records (RME), cashier operations, and reporting for healthcare clinics.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Authentication**: NextAuth v4 (CredentialsProvider)
- **Database**: SQLite (Prisma ORM) + Remote PHP Bridge for main data
- **Runtime**: Bun (primary), Node.js compatible
- **Deployment**: Standalone output mode for Vercel/self-hosting

## Common Commands

```bash
# Development
bun dev              # Start dev server on port 8000
bun run lint         # Run ESLint

# Database (Prisma - for local SQLite, not the main data store)
bun run db:generate  # Generate Prisma client
bun run db:push      # Push schema changes
bun run db:migrate   # Run migrations
bun run db:reset     # Reset database

# Build
bun run build        # Production build with standalone output
bun run start        # Start production server
```

## Architecture

### Data Flow
```
Browser → Next.js (this app) → PHP Bridge API (healthcenterindonesia.com) → MySQL
```

All database operations go through the `callBridge()` helper in `src/lib/bridge.ts`, which communicates with a remote PHP API. The local Prisma/SQLite setup is minimal (User, Post models).

### Key Libraries
- **Bridge**: `src/lib/bridge.ts` - HTTP bridge to PHP API with retry logic
- **Auth**: `src/lib/auth.ts` - NextAuth v4 configuration
- **Utils**: `src/lib/utils.ts` - Indonesian-formatted utilities (Rupiah, dates, WA links)

### API Design Pattern
API routes follow a consistent pattern in `src/app/api/`:
- Route handlers call `callBridge(action, data)` where `action` is a PHP method name
- Response is typed with `BridgeResponse<T>` interface
- Logging at `[Bridge]` prefix for all calls

## Role-Based Access

Four roles with route prefixes:
- `/admin/*` - superadmin, admin (full access to all features)
- `/dokter/*` - doctor (queue, RME, schedule)
- `/kasir/*` - cashier (payments, reports)
- `/karyawan/*` - staff (registration, patients, basic operations)

Navigation is role-aware via `src/components/layout/Sidebar.tsx` - users only see routes they have access to.

## Key Components

### Dashboard Layout (`src/components/layout/DashboardLayout.tsx`)
Wraps all dashboard pages with Sidebar + Header. The wrapper in `src/app/(dashboard)/layout.tsx` is a client component that applies this layout.

### Shared Components (`src/components/shared/`)
- `AntrianTable.tsx` - Queue table with 30-second auto-refresh polling
- `SoapForm.tsx` - SOAP medical record form
- `InvoiceDetail.tsx` - Invoice display with payment processing
- `PasienSearch.tsx` - Patient autocomplete search
- `ResepForm.tsx` - Prescription with stock warnings

### UI Components (`src/components/ui/`)
shadcn/ui components - most are Radix UI wrappers with Tailwind styling.

## Environment Variables

Required in `.env`:
- `NEXTAUTH_SECRET` - JWT signing secret
- `NEXTAUTH_URL` - App URL (http://localhost:8000 for dev)
- `BRIDGE_URL` - PHP API endpoint
- `BRIDGE_SECRET` - API authentication key

## Type Definitions

Key session types in `src/lib/auth.ts`:
```typescript
interface Session {
  user: { id: string; name: string; role: string }
}
```

Roles: `superadmin`, `admin`, `dokter`, `karyawan`, `kasir`

## File Organization

```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/       # Role-grouped dashboard pages
│   │   ├── admin/
│   │   ├── dokter/
│   │   ├── kasir/
│   │   └── karyawan/
│   ├── api/               # API routes (bridge proxies)
│   │   ├── auth/          # NextAuth handlers
│   │   ├── master/        # Master data CRUD
│   │   ├── rme/           # Medical records
│   │   ├── invoice/       # Billing
│   │   └── laporan/       # Reports
│   └── login/
├── components/
│   ├── layout/            # DashboardLayout, Sidebar, Header
│   ├── shared/            # Domain-specific components
│   ├── providers/         # AuthProvider
│   └── ui/                # shadcn/ui primitives
├── hooks/                 # Custom React hooks
├── lib/                   # Core utilities
│   ├── auth.ts           # NextAuth config
│   ├── bridge.ts         # PHP API client
│   └── utils.ts          # Formatting helpers
└── types/                # TypeScript declarations
```

## Indonesian Language

The UI is entirely in Bahasa Indonesia. Key labels:
- Antrian = Queue/Queue Number
- Pendaftaran = Registration
- RME = Rekam Medis Elektronik (Electronic Medical Record)
- Pasien = Patient
- Tindakan = Medical Action/Procedure
- Resep = Prescription
- Kasir = Cashier/Payment
- Dokter = Doctor
