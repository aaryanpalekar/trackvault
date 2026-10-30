# TrackVault

TrackVault is a personal finance tracker for recording expenses and income, setting budgets, tracking money owed, and reviewing spending trends.

## Features

- Record expenses and income with categories, dates, notes, and payment methods.
- Set monthly budgets and review progress by category.
- Track money lent and owed.
- Explore spending summaries, charts, and pattern-based insights.
- Search transactions and export monthly reports as PDF, Excel, or CSV.
- Use the responsive interface on desktop and mobile, with support for multiple currencies.

## Technology

- React 18, TypeScript, and Vite
- Supabase Auth and Postgres
- Tailwind CSS, shadcn/ui, and Recharts
- jsPDF and ExcelJS for report exports

## Run locally

### Requirements

- Node.js 18 or later
- npm
- A Supabase project

### Setup

1. Clone the repository and install dependencies:

   ```sh
   git clone https://github.com/aaryanpalekar/trackvault.git
   cd trackvault
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in the URL and publishable (or legacy `anon`) key from your Supabase project settings.

3. Apply the SQL migrations in `supabase/migrations/` to your Supabase project. With the Supabase CLI installed, link your project and run:

   ```sh
   supabase link --project-ref YOUR_PROJECT_ID
   supabase db push
   ```

4. In Supabase Auth settings, enable the providers you intend to use. For Google sign-in, configure Google OAuth credentials and add your local and deployed app URLs to the allowed redirect URLs.

5. Start the development server:

   ```sh
   npm run dev
   ```

Vite prints the local address when the server starts.

## Environment variables

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (or legacy anon key) used by the browser client |

These `VITE_` values are included in the browser build and are not secrets. Never put a Supabase `service_role` key, database password, OAuth client secret, or other server credential in a `VITE_` variable or commit it to the repository. Keep local values in `.env`.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run the test suite once |

## Database and security

The Supabase schema and migration history are in `supabase/`. Review row-level security policies and Auth redirect settings in your own Supabase project before deploying. Do not expose service-role credentials in client code.

## License

No license has been added yet. Until a license is chosen and committed, the source is not explicitly offered for reuse under an open-source license.
