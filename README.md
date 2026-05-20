This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Supabase Auth setup

Set these values in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-supabase-publishable-or-anon-key"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

In Supabase Dashboard, enable email/password auth and add this redirect URL:

```text
http://localhost:3000/auth/callback
```

For production, also add `https://your-domain.com/auth/callback`.

To send auth emails from your own SMTP account, add these private values to
`.env.local`:

```bash
SUPABASE_ACCESS_TOKEN="your-supabase-management-api-access-token"
SUPABASE_PROJECT_REF="your-project-ref"
SMTP_ADMIN_EMAIL="no-reply@example.com"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"
SMTP_SENDER_NAME="BonSync"
```

Then run:

```bash
npm run supabase:smtp
```

For Gmail, use `smtp.gmail.com`, port `587`, your Gmail address as the user,
and a Google App Password as `SMTP_PASS`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
