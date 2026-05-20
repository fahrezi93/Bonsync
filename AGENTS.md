<!-- BEGIN:bonsync-agent-rules -->
# BonSync Agent Instructions

Welcome to the BonSync project! This `AGENTS.md` file contains the context, architecture, and rules you must follow when working on this codebase. Read it carefully before making any changes.

## 1. Project Overview

**BonSync** is a modern, AI-powered expense tracker and split-bill application. It helps users record their daily expenses, scan receipts for quick input, split bills with friends, and get "roasted" (critiqued) by an AI based on their spending habits.

### Key Features
- **Dashboard**: Displays remaining budget, survival score, category distribution (Pie Chart), and recent transactions.
- **Expense Recording**:
  - **Manual**: Standard form for inputting expenses.
  - **Quick Receipt**: Upload a receipt image, and AI extracts the total and merchant name.
  - **Split Bill**: Upload a receipt, and AI extracts items, prices, and totals. Users can mark items as theirs or someone else's to split the cost.
- **AI Roasting**: A monthly or on-demand AI analysis that harshly but constructively critiques the user's spending habits.
- **Monthly Budget**: Users set a limit per month, and the app calculates a "Survival Score" based on how much is left.

## 2. Tech Stack

- **Framework**: Next.js 16.2.4 (App Router)
- **Language**: TypeScript, React 19
- **Styling**: Tailwind CSS v4 (using `@tailwindcss/postcss`), Lucide React icons
- **Database**: PostgreSQL with Prisma ORM (`@prisma/client`, `@prisma/adapter-pg`)
- **Authentication**: Supabase SSR (`@supabase/ssr`, `@supabase/supabase-js`)
- **AI/LLM**: Google GenAI SDK (`@google/genai`)
- **UI Primitives**: Radix UI
- **Charts**: Recharts

## 3. Architecture & Folder Structure

- `/app`: Next.js App Router pages, layouts, and global styles (`globals.css`).
  - Contains routes like `/login`, `/scan` (for Quick Receipt and Split Bill), `/history`, `/settings`, and the `/` dashboard.
- `/actions`: Next.js Server Actions. **Do not put data fetching or mutations directly in components**. Use Server Actions here (e.g., `expense-actions.ts`, `chat-actions.ts`, `budget-actions.ts`, `auth-actions.ts`).
- `/components`: Reusable React components (e.g., `manual-expense-form.tsx`, `split-bill-zone.tsx`, `roasting-card.tsx`).
- `/lib`: Utility instances (e.g., `prisma.ts` for database connection).
- `/prisma`: Contains `schema.prisma` which defines the database models.

## 4. Database Schema Rules

We use Prisma with the following core models:
- `MonthlyBudget`: Tracks `limitAmount` and `month` (e.g., "05/2026").
- `Receipt`: Represents a scanned receipt with `merchantName`, `subtotalAmount`, `taxAmount`, etc. Has a `mode` (`QUICK` or `SPLIT`).
- `ReceiptItem`: Individual items extracted from a `SPLIT` receipt. Has an `ownerType` (`SELF` or `OTHER`).
- `Expense`: The actual financial record. Linked to a `Receipt` (optional). Has `source` (`MANUAL`, `QUICK_RECEIPT`, `SPLIT_BILL`), `category`, and `aiAdvice` (the roasting text).

**Rule**: Always use `prisma` from `@/lib/prisma` to interact with the database within Server Actions.

## 5. UI/UX & Styling Guidelines

- **Tailwind v4**: We use Tailwind CSS v4. Note that configuration is handled largely in `app/globals.css` via `@theme` directives rather than `tailwind.config.ts`.
- **Fonts**: We use `Sora` (sans-serif) for general text and headings, and `DM Mono` for numbers/receipts. Variables are `--font-sora` and `--font-mono`.
- **Colors**: The theme heavily relies on `slate` (for backgrounds and text), `emerald` (for success/primary), `rose` (for danger/critical), and `amber` (for warnings).
- **Components**:
  - Use the `.premium-card` utility class (defined in `globals.css`) for consistent card styling (white bg, subtle border, rounded-3xl, shadow-sm).
  - Use `.animate-fade-in-up` for smooth entrance animations.
  - Avoid generic default browser scrollbars; use `.hide-scrollbar` or `.custom-scrollbar` where appropriate.
- **Mobile First**: The app is designed mobile-first. Ensure all UI looks great on a max-width container (e.g., `max-w-md md:max-w-5xl`).

## 6. Development Rules

1. **Next.js 15+ / 16+ Patterns**: Be aware of breaking changes in recent Next.js versions. Asynchronous route segments, caching defaults, and Server Actions usage must follow Next.js 16 conventions.
2. **AI Prompts**: When modifying AI features (in `chat-actions.ts` or `expense-actions.ts`), ensure prompts are designed to return robust JSON when extracting receipt data, or sharp, witty Indonesian slang when "roasting".
3. **No Placeholders**: When building new UI, do not use ugly placeholders. Maintain the "premium" feel of BonSync.
4. **Indonesian Language**: The app's primary language is Indonesian. All user-facing text, AI prompts (for roasting), and date formatting (`id-ID`) should be in Indonesian.
<!-- END:bonsync-agent-rules -->
