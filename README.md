# Track Vault

A modern, responsive expense tracker built for clarity and control. Track daily spending, manage income, set budgets, and understand your financial patterns through actionable insights and reports.

## Features

- **Expense Tracking** — Log expenses with categories, payment methods, notes, and custom names. Calendar-based date selection lets you record past transactions accurately.
- **Income Tracking** — Record income from salary, freelance, investments, bonuses, gifts, and other sources.
- **Budgets** — Set monthly overall budgets and optional per-category budgets with visual progress bars.
- **Insights** — AI-assisted, pattern-based insights including month-end forecasts, category spikes, behavioral trends, and concrete savings suggestions.
- **Dues Management** — Track money lent and owed with reminders and settlement support.
- **Reports & Exports** — Download clean monthly expense reports as PDF, Excel (.xlsx), or CSV.
- **Statistics** — Interactive charts for daily, weekly, monthly, and yearly spending with drill-down support.
- **Global Search** — Quickly find transactions across your history.
- **Responsive Design** — Fully optimized for mobile and desktop with a glassmorphic, premium UI.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Lovable Cloud (auth, database, storage)
- **Charts:** Recharts
- **Reports:** jsPDF, jspdf-autotable, ExcelJS

## Getting Started

### Prerequisites

- Node.js 18+
- npm or bun

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:8080`.

## Project Structure

```
src/
  components/       # Reusable UI components (sheets, dialogs, charts, cards)
  hooks/            # Custom React hooks (auth, expenses, budgets, mobile)
  lib/              # Utilities, types, currencies, report generators
  pages/            # Top-level page components
  integrations/     # Backend client and generated types
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run test` | Run Vitest tests |
| `npm run lint` | Run ESLint |

## License

MIT
