# Smart Incentive Calculator

A vehicle sales incentive management platform for dealerships. Admins configure car models and tiered incentive slabs; sales officers log monthly sales and instantly see their calculated incentive payout.

---

## Features

- **Admin Portal** — Full CRUD for vehicle models and incentive slabs
- **Sales Officer Portal** — Month-based sales entry with real-time incentive breakdown
- **Tiered incentive engine** — Automatically picks the correct slab based on total units sold
- **Demo mode** — Works fully without a database (data resets on refresh)
- **Supabase backend** — Persistent storage when credentials are configured
- **Vercel-ready** — Includes `vercel.json` for SPA routing

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 + Vite |
| Styling | Bootstrap 5 + Bootstrap Icons |
| Routing | React Router v6 |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel |

---

## Prerequisites

- Node.js 18 or later
- npm 9 or later
- A [Supabase](https://supabase.com) project *(optional for demo mode)*

---

## Local Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd toyota
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

> **Skip this step to run in demo mode.** The app will use in-memory data that resets on refresh.

### 4. Set up the database

If you are connecting Supabase, run the SQL schema in your project's **SQL Editor**:

1. Go to [supabase.com](https://supabase.com) → your project → **SQL Editor**
2. Open `supabase_schema.sql` from this repo
3. Paste the contents and click **Run**

This creates the `vehicle_models`, `incentive_slabs`, and `monthly_sales` tables and seeds default data.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Default Incentive Slabs (seeded by schema)

| Range | Incentive per Car |
|-------|-----------------|
| 1 – 3 cars | ₹1,000 |
| 4 – 7 cars | ₹2,000 |
| 8+ cars | ₹3,500 |

---

## Project Structure

```
src/
├── lib/
│   └── supabase.js              # Supabase client (falls back to demo mode)
├── services/
│   ├── vehicleModelService.js   # Vehicle model CRUD
│   ├── incentiveSlabService.js  # Incentive slab CRUD
│   └── salesService.js          # Monthly sales upsert & query
├── pages/
│   ├── LandingPage.jsx          # Role selection screen
│   ├── AdminDashboard.jsx       # Admin layout & nested routes
│   └── SalesDashboard.jsx       # Sales officer calculator
├── components/
│   └── admin/
│       ├── VehicleModels.jsx    # CRUD table + modal
│       └── IncentiveSlabs.jsx   # CRUD table + modal + live preview
├── App.jsx                      # Route definitions
├── main.jsx                     # React entry point
└── index.css                    # Custom styles & design tokens
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build locally |

---

## Deployment on Vercel

### Option A — Vercel CLI

```bash
npm install -g vercel
vercel --prod
```

### Option B — GitHub integration

1. Push this repository to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Add the two environment variables in **Project Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

The included `vercel.json` handles SPA client-side routing automatically.

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | No* | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | No* | Your Supabase anonymous public key |

*Required only for persistent data storage. Omitting both variables enables demo mode.
