-- Repayments table for Hisab
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS repayments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  paid_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  paid_to uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  note text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS is disabled as per project setup (all tables run without RLS)
-- If you later enable RLS, add policies similar to settlements table

-- Index for performance
CREATE INDEX IF NOT EXISTS repayments_group_id_idx ON repayments(group_id);
CREATE INDEX IF NOT EXISTS repayments_created_at_idx ON repayments(created_at DESC);
