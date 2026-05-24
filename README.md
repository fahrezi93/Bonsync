# 🔥 BonSync — Track. Split. Get Roasted.

> **AI-powered expense tracker & split-bill app yang siap ngeroast kebiasaan boros kamu.**

[![Deploy Status](https://img.shields.io/badge/Cloud_Run-Deployed-brightgreen?logo=googlecloud)](https://your-live-url.run.app)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org)
[![Google AI](https://img.shields.io/badge/Gemini_AI-Powered-blue?logo=google)](https://ai.google.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Auth-green?logo=supabase)](https://supabase.com)

---

## 🌐 Live Demo

**→ [bonsync-app.run.app](https://your-live-url.run.app)** *(deployed on Google Cloud Run)*

---

## 💡 The Problem

Kita semua pernah ngerasain: **akhir bulan dompet kosong, tapi nggak tau uang habis ke mana.** Aplikasi expense tracker biasa membosankan, repot diisi manual, dan nggak kasih insight yang actionable. Kalau makan bareng temen? Ribet hitung-hitungan split bill.

**BonSync** hadir untuk nge-solve tiga masalah sekaligus:
1. 📸 **Scan nota** — foto struk, AI langsung ekstrak item & total
2. 🤝 **Split bill cerdas** — assign item ke masing-masing orang, hitung share termasuk pajak & diskon secara proporsional
3. 🤖 **AI Roasting** — Gemini bakal "roast" kebiasaan belanja kamu setiap bulan dengan bahasa gaul Indonesia yang nusuk tapi informatif

---

## ✨ Key Features

| Fitur | Deskripsi |
|---|---|
| 📊 **Dashboard** | Budget, Survival Score, pie chart kategori, transaksi terakhir |
| 📸 **Quick Receipt Scan** | Upload foto struk → AI ekstrak merchant, item, pajak, diskon |
| 🍕 **Smart Split Bill** | Assign item per orang, kalkulasi share proporsional dengan tax/diskon |
| 💬 **AI Chat** | Catat pengeluaran via chat natural ("beli kopi 25rb tadi") |
| 🔥 **Monthly Roasting** | Gemini ngeroast spending habit kamu tiap bulan |
| 📈 **History & Filter** | Riwayat dengan filter kategori, source (manual/nota/split), paginasi |
| 💰 **Budget Tracker** | Set monthly limit, pantau survival score real-time |

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org) (App Router, Server Actions, React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** PostgreSQL + [Prisma ORM](https://prisma.io)
- **Auth:** [Supabase SSR](https://supabase.com/docs/guides/auth/server-side)
- **AI/LLM:** [Google Gemini](https://ai.google.dev) (`@google/genai`) — vision, text, JSON schema
- **Deployment:** [Google Cloud Run](https://cloud.google.com/run) (containerized, auto-scaling)
- **Charts:** [Recharts](https://recharts.org)
- **Icons:** [Lucide React](https://lucide.dev)

---

## 🏗️ Architecture

```
BonSync/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Dashboard
│   ├── scan/               # Quick Receipt + Split Bill
│   ├── history/            # Expense history
│   ├── chat/               # AI Chat interface
│   └── settings/           # Budget & preferences
├── actions/                # Next.js Server Actions (no client-side DB calls)
│   ├── expense-actions.ts  # Receipt OCR, split bill, manual entry
│   ├── chat-actions.ts     # AI chat + monthly roasting
│   ├── budget-actions.ts   # Monthly budget management
│   └── auth-actions.ts     # Supabase auth
├── components/             # Reusable React components
├── lib/                    # Prisma client, AI fallback, receipt utils
└── prisma/                 # Database schema + migrations
```

---

## 🤖 AI Features (Gemini-Powered)

### 1. Receipt OCR (Vision)
Upload foto struk → Gemini ekstrak:
- Nama merchant
- Daftar item + harga
- Discount, pajak, service charge
- Validasi: deteksi kalau bukan foto struk (selfie, meme, dll)

### 2. Smart Classification
Setiap transaksi otomatis dikategorikan: `FOOD / TRANSPORT / LIFESTYLE / HEALTH / ENTERTAINMENT / OTHERS`

### 3. Per-Expense Roasting
Setiap catat pengeluaran → AI kasih "roasting" singkat sarkastik gaul Indonesia

### 4. Monthly Roasting (Cached)
Analisis mendalam pola belanja sebulan — di-cache di DB supaya tidak re-generate setiap request

### 5. AI Chat Assistant
Natural language expense logging — ketik "bayar parkir 5 ribu" → AI konfirmasi & catat otomatis

---

## 🚀 Cloud Run Deployment

### Quick Deploy (dengan script)

```bash
# 1. Set environment variables
export GCP_PROJECT_ID="your-project-id"
export DATABASE_URL="postgresql://..."
export NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
export NEXT_PUBLIC_SITE_URL="https://your-service.run.app"
export GEMINI_API_KEY="your-gemini-api-key"

# 2. Run deploy
chmod +x deploy.sh && ./deploy.sh
```

### Manual Deploy

```bash
# Build & push Docker image
docker build --platform linux/amd64 -t gcr.io/PROJECT_ID/bonsync-app .
docker push gcr.io/PROJECT_ID/bonsync-app

# Deploy to Cloud Run
gcloud run deploy bonsync-app \
  --image gcr.io/PROJECT_ID/bonsync-app \
  --region asia-southeast2 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="..." \
  --set-env-vars GEMINI_API_KEY="..."
```

### Via Cloud Build (CI/CD)

```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=\
_DATABASE_URL="...",\
_GEMINI_API_KEY="...",\
_NEXT_PUBLIC_SUPABASE_URL="...",\
_NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="...",\
_NEXT_PUBLIC_SITE_URL="https://your-service.run.app"
```

---

## ⚙️ Local Development

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/bonsync.git
cd bonsync
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env.local
# Edit .env.local dengan value yang sesuai
```

### 3. Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio
npx prisma studio
```

### 4. Run Dev Server

```bash
npm run dev
# Open http://localhost:3000
```

---

## 🔐 Environment Variables

| Variable | Required | Keterangan |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (Supabase) |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | Supabase anon/public key |
| `NEXT_PUBLIC_SITE_URL` | ✅ | URL live app (untuk auth callback) |
| `GEMINI_API_KEY` | ✅ | Google AI / Gemini API key |
| `SUPABASE_ACCESS_TOKEN` | optional | Untuk konfigurasi SMTP Supabase |
| `SUPABASE_PROJECT_REF` | optional | Untuk konfigurasi SMTP Supabase |

---

## 📸 Screenshots

> *Dashboard — Survival Score, Budget Overview, AI Roasting, Category Chart*

---

## 🏆 Built For

**#JuaraVibeCoding** — Google for Developers Indonesia  
Category: **Daily Life: The Life Hacker** 🏠

---

## 📄 License

MIT © 2026 BonSync Team
