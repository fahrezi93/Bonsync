# BonSync - Track, Split, Get Roasted

BonSync adalah aplikasi expense tracker berbasis AI untuk membantu pengguna mencatat pengeluaran harian, memindai struk, membagi tagihan, dan memahami kebiasaan belanja lewat evaluasi AI berbahasa Indonesia.

## Problem Statement

Banyak orang sadar uangnya cepat habis, tetapi tidak punya catatan yang jelas tentang ke mana uang itu pergi. Mencatat pengeluaran manual sering terasa ribet, struk belanja mudah hilang, dan split bill saat makan bersama teman sering bikin hitungan tidak transparan. BonSync menyelesaikan masalah ini dengan pencatatan cepat, scan struk berbasis AI, split bill otomatis, dan insight keuangan yang lebih mudah dipahami.

## Live Demo

Live app: [BonSync-App](https://bonsync-app-115070783950.asia-southeast2.run.app)

## Key Features

- Dashboard budget bulanan, survival score, distribusi kategori, dan transaksi terbaru.
- Manual expense untuk mencatat pengeluaran langsung.
- Quick Receipt Scan untuk mengambil merchant, item, diskon, pajak, dan total dari foto struk.
- Smart Split Bill untuk membagi item per orang, termasuk pembagian pajak dan diskon secara proporsional.
- AI Chat untuk mencatat pengeluaran dengan bahasa natural.
- AI Roasting untuk memberi evaluasi pengeluaran dengan gaya bahasa Indonesia yang tajam tetapi tetap informatif.
- History, filter, edit, delete, dan export transaksi.

## Tech Stack

- Next.js 16 App Router
- React 19 + TypeScript
- Tailwind CSS v4
- PostgreSQL + Prisma ORM
- Supabase Auth
- Google Gemini via `@google/genai`
- Recharts
- Lucide React
- Google Cloud Run

## Architecture

```text
BonSync/
|-- app/                 # Next.js routes and pages
|-- actions/             # Server Actions for auth, budget, expense, chat
|-- components/          # Reusable UI components
|-- lib/                 # Prisma, auth helpers, AI fallback, receipt utilities
|-- prisma/              # Database schema
|-- public/              # Static assets
`-- scripts/             # Deployment and utility scripts
```

## AI Usage

BonSync menggunakan Gemini untuk:

- OCR dan ekstraksi data struk dalam format JSON.
- Deteksi gambar yang bukan struk.
- Klasifikasi kategori transaksi.
- Roasting per transaksi.
- Monthly roasting berdasarkan pola pengeluaran.
- Chat assistant untuk pencatatan pengeluaran natural.

## Local Development

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Environment Variables

```env
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=
GEMINI_API_KEY=
```

## Database

```bash
npx prisma generate
npx prisma migrate dev
```

## Validation

Perintah yang digunakan untuk validasi:

```bash
npm run lint
npx tsc --noEmit
npx react-doctor@latest --verbose --diff
```

Status terakhir:

- ESLint: 0 error
- TypeScript: pass
- React Doctor diff: no errors

## Deployment

BonSync disiapkan untuk deployment ke Google Cloud Run melalui Docker atau Cloud Build.

```bash
gcloud builds submit --config cloudbuild.yaml
```

Pastikan environment variables production sudah diisi sebelum deploy.

## Built For

Built for #JuaraVibeCoding by Google for Developers Indonesia.

Category: Daily Life / Life Hacker
