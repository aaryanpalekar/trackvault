-- Add expense_date (the date the expense actually happened) and custom_name (for Others category)
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS expense_date timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS custom_name text;

-- Backfill expense_date from created_at for existing rows
UPDATE public.expenses SET expense_date = created_at WHERE expense_date IS NULL OR expense_date = created_at;

-- Allow users to update their own expenses (needed for editing past transactions)
DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
CREATE POLICY "Users can update own expenses"
ON public.expenses
FOR UPDATE
USING (auth.uid() = user_id);

-- Index to speed up date-based queries
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expenses(user_id, expense_date DESC);