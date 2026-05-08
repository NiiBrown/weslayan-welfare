# Weslayan Welfare Management System

A full-stack web application for the Weslayan Welfare Association — members, dues, payments, expenses, SMS reminders, and reports.

## Tech Stack

- **Frontend**: Next.js 14 + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (via Supabase or Neon, both free)
- **Auth**: NextAuth.js
- **Hosting**: Vercel (free)
- **SMS**: Hubtel / Africa's Talking / Twilio

---

## Deploy to Vercel (Production)

### Step 1: Get a free PostgreSQL database

Go to **https://supabase.com** and create a free account and project.

Once the project is created:
1. Go to **Project Settings > Database**
2. Scroll to **Connection string** section
3. Copy the **URI** (it looks like `postgresql://postgres.xxxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres`)
4. That's your `DATABASE_URL`
5. Also copy the **Direct connection** string — that's your `DIRECT_URL`

### Step 2: Push to GitHub

```bash
cd weslayan-welfare
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/weslayan-welfare.git
git push -u origin main
```

### Step 3: Deploy on Vercel

1. Go to **https://vercel.com** and sign in with GitHub
2. Click **Add New Project**
3. Select your `weslayan-welfare` repo
4. Before clicking Deploy, add these **Environment Variables**:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Supabase connection string (pooled) |
| `DIRECT_URL` | Your Supabase direct connection string |
| `NEXTAUTH_SECRET` | Any random string (use `openssl rand -base64 32` to generate one) |
| `NEXTAUTH_URL` | `https://your-app-name.vercel.app` (update after first deploy) |

5. Click **Deploy**

### Step 4: Set up the database and seed data

After the first deploy, run these commands locally (with your real DATABASE_URL):

```bash
# Create a .env file locally with your Supabase credentials
cp .env.example .env
# Edit .env and paste your real DATABASE_URL and DIRECT_URL

# Push the schema to your database
npx prisma db push

# Seed it with sample data
npx tsx prisma/seed.ts
```

Your app is now live. Every time you push to GitHub, Vercel auto-deploys.

---

## Login Credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | admin@weslayanwelfare.org | password123 |
| Treasurer | treasurer@weslayanwelfare.org | password123 |
| Member | kwame@email.com | password123 |

Any member email works with `password123`.

---

## Local Development

```bash
cp .env.example .env
# Edit .env with your database credentials

npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

Open **http://localhost:3000**

---

## Pages

| URL | Description |
|---|---|
| `/` | Public website |
| `/login` | Login page |
| `/admin` | Admin dashboard |
| `/member` | Member dashboard |

---

## Expense Categories

| Category | Description |
|---|---|
| Medical | Hospital bills and health support |
| Bereavement | Funeral donations and support |
| Marriage | Wedding gifts and support |
| Naming Ceremony | Naming ceremony donations |
| Other | Miscellaneous expenses |

---

## Project Structure

```
weslayan-welfare/
├── prisma/
│   ├── schema.prisma       # Database schema (PostgreSQL)
│   └── seed.ts             # Sample data
├── src/
│   ├── app/
│   │   ├── page.tsx        # Public homepage
│   │   ├── (auth)/login/   # Login
│   │   ├── admin/          # Admin dashboard
│   │   ├── member/         # Member dashboard
│   │   └── api/            # All API routes
│   ├── components/
│   └── lib/
│       ├── prisma.ts       # DB client
│       ├── auth.ts         # Auth config
│       ├── sms.ts          # SMS service
│       ├── validations.ts  # Zod schemas
│       ├── reports.ts      # Report generation
│       └── utils.ts        # Utilities
├── .env.example            # Template for environment variables
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```
 
