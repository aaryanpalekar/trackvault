This is a large, multi-area upgrade. To keep quality high and stay within a single-turn scope, I'll ship it in **two phases**. Nothing existing is removed — every current screen keeps its data and behavior.

## Phase 1 — Ship now (this turn)

Focused on the specific fix you called out + high-impact polish + a few of the most useful new features.

**Fixes & refinements**
- **Received card on Home**: only shows when there's income *today* (spec: "shouldn't always display… should go after that particular day"). When there's none today, the slot falls back to Avg/day or Dues, same as before.
- Refined tokens in `index.css`: slightly deeper green, warmer neutrals, softer layered shadows, one unified corner radius scale.
- Consistent card treatment across Home / Stats / Received / Dues / Settings — same radius, same shadow, same padding rhythm.
- Subtle gradient depth on hero stat cards (barely-there, not loud).
- **Signature touch**: weekly bar chart bars ease upward on load (respecting `prefers-reduced-motion`).
- Count-up animation on the "spent today" hero number and stat card totals.
- Empty states fade in softly.

**New additive features**
1. **Quick-add chips** — last-used categories as one-tap shortcuts on Home, right above the FAB. Tapping opens the add sheet pre-filled.
2. **Month-over-month insight line** — single sentence above the Statistics donut ("12% more on Food than last month").
3. **CSV export** on Settings, next to the existing PDF report. Same month picker.
4. **Global search** — search icon in the Home header opens a lightweight overlay that searches across expenses, incomes, and dues by amount/category/note/person.

## Phase 2 — Next turn (larger surface, needs schema)

These need new tables + wiring across multiple screens and are better done as a focused follow-up so nothing regresses:

1. **Budgets** — monthly cap per category, slim progress bars on Home + Stats. New `budgets` table.
2. **Recurring expenses** — auto-logged subscriptions/rent/EMIs, "Upcoming" strip on Home. New `recurring_expenses` table + scheduled auto-insert on app load.
3. **Reminders on Dues** — gentle nudge badge when a due is unpaid past N days (user-configurable in Settings).
4. **Split-from-expense** — convert any transaction into a due split N ways, from the expense row menu.
5. **Multiple wallets/accounts** — cash/card/bank as a first-class filter across Home, Stats, Dues. New `wallets` table + `wallet_id` on expenses/incomes.

## Technical notes

- Design tokens live in `src/index.css` + `tailwind.config.ts` — no hardcoded colors in components.
- Count-up + bar ease-in use `framer-motion` (already reasonable to add) or CSS keyframes with `prefers-reduced-motion` guard — I'll use CSS to avoid new deps.
- CSV export: new `src/lib/monthlyCsv.ts`, wired into `DownloadReportDialog`.
- Global search: new `src/components/SearchOverlay.tsx`, opened from a new search button in the Home header.
- Home Received card gate: filter `incomes` to today's date range before deciding whether to render the Received tile.

Confirm and I'll build Phase 1 now, then we can tackle Phase 2 in a follow-up message.