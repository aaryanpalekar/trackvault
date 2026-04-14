
-- Add type column to borrowings to distinguish "they owe me" vs "I owe them"
ALTER TABLE public.borrowings ADD COLUMN type text NOT NULL DEFAULT 'lent';
-- type = 'lent' means someone owes you, type = 'owed' means you owe someone
