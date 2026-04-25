-- Create incomes table for tracking received money separately from expenses
CREATE TABLE public.incomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  source TEXT NOT NULL,
  note TEXT,
  received_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own incomes"
  ON public.incomes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own incomes"
  ON public.incomes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own incomes"
  ON public.incomes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own incomes"
  ON public.incomes FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_incomes_user_date ON public.incomes(user_id, received_date DESC);