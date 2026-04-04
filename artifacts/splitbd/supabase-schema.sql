-- SplitBD Database Schema
-- Run this in your Supabase SQL Editor

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_color TEXT NOT NULL DEFAULT '#4F46E5',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Group Members
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount > 0),
  created_by UUID NOT NULL REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Expense Payers (who paid, how much)
CREATE TABLE IF NOT EXISTS expense_payers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  amount_paid NUMERIC(12,2) NOT NULL CHECK (amount_paid > 0)
);

-- Expense Splits (who owes, how much each)
CREATE TABLE IF NOT EXISTS expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  share_amount NUMERIC(12,2) NOT NULL CHECK (share_amount > 0)
);

-- Settlements
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  paid_by UUID NOT NULL REFERENCES profiles(id),
  paid_to UUID NOT NULL REFERENCES profiles(id),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_payers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles (needed for display), only update their own
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Helper function: is the current user a member of a group?
CREATE OR REPLACE FUNCTION is_group_member(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members WHERE group_id = gid AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Groups: only members can see
CREATE POLICY "groups_select_members" ON groups FOR SELECT USING (is_group_member(id));
CREATE POLICY "groups_insert_auth" ON groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "groups_update_creator" ON groups FOR UPDATE USING (auth.uid() = created_by);

-- Group Members: members can see, authenticated users can insert (to join)
CREATE POLICY "group_members_select" ON group_members FOR SELECT USING (is_group_member(group_id));
CREATE POLICY "group_members_insert" ON group_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "group_members_delete_own" ON group_members FOR DELETE USING (auth.uid() = user_id);

-- Expenses: only group members
CREATE POLICY "expenses_select" ON expenses FOR SELECT USING (is_group_member(group_id));
CREATE POLICY "expenses_insert" ON expenses FOR INSERT WITH CHECK (is_group_member(group_id) AND auth.uid() = created_by);
CREATE POLICY "expenses_delete" ON expenses FOR DELETE USING (
  auth.uid() = created_by OR
  auth.uid() = (SELECT created_by FROM groups WHERE id = group_id)
);

-- Expense Payers: via expense membership
CREATE POLICY "expense_payers_select" ON expense_payers FOR SELECT
  USING (EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_id AND is_group_member(e.group_id)));
CREATE POLICY "expense_payers_insert" ON expense_payers FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_id AND is_group_member(e.group_id)));
CREATE POLICY "expense_payers_delete" ON expense_payers FOR DELETE
  USING (EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_id AND is_group_member(e.group_id)));

-- Expense Splits: via expense membership
CREATE POLICY "expense_splits_select" ON expense_splits FOR SELECT
  USING (EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_id AND is_group_member(e.group_id)));
CREATE POLICY "expense_splits_insert" ON expense_splits FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_id AND is_group_member(e.group_id)));
CREATE POLICY "expense_splits_delete" ON expense_splits FOR DELETE
  USING (EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_id AND is_group_member(e.group_id)));

-- Settlements: group members
CREATE POLICY "settlements_select" ON settlements FOR SELECT USING (is_group_member(group_id));
CREATE POLICY "settlements_insert" ON settlements FOR INSERT WITH CHECK (is_group_member(group_id));

-- =====================
-- REALTIME
-- =====================
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE expense_payers;
ALTER PUBLICATION supabase_realtime ADD TABLE expense_splits;
ALTER PUBLICATION supabase_realtime ADD TABLE settlements;
