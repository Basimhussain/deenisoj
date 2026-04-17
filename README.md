# DeeniSOJ

Islamic Q&A platform connecting users with verified scholars. Users submit questions, scholars review and answer them, and published fatawa are available for anyone to browse.

## Features

- **Ask a Question** — submit questions with category tagging; responses delivered by email
- **Fatwa Library** — browse recent and featured published fatawa
- **Scholar Review** — dedicated review workflow for verified scholars
- **Admin Dashboard** — manage questions, answers, categories, and scholars
- **Search** — full-text search across published fatawa
- **Authentication** — Supabase Auth with role-based access (user, scholar, admin)
- **Dark Mode** — full light/dark theme support

## Tech Stack

- **Framework**: Next.js 14 (App Router, Turbopack)
- **Language**: TypeScript
- **Database & Auth**: Supabase (PostgreSQL + Auth + SSR helpers)
- **Styling**: CSS Modules
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod validation

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/basimhussain/deenisoj.git
   cd deenisoj
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/
  api/          — API routes (fatwas, questions, categories, scholar reviews, search)
  admin/        — Admin dashboard pages
  auth/         — Auth callback handling
  dashboard/    — User dashboard
  fatwas/       — Fatwa detail pages
  search/       — Search page
  signin/       — Sign-in page
components/     — Reusable UI components
lib/            — Supabase clients, auth helpers, Zod schemas
db/             — SQL schema files
public/         — Static assets (hero backgrounds)
```

## Deployment

Deploy on [Vercel](https://vercel.com) for the best Next.js experience:

1. Push to GitHub
2. Import the repo in Vercel
3. Add your Supabase environment variables
4. Deploy

## License

This project is private and not licensed for redistribution.
