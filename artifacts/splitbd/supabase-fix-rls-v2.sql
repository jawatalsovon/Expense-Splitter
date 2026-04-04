-- RLS Fix v2: Drop all old policies and use role-based access
-- Run this in Supabase SQL Editor

-- Drop ALL existing policies on every table
DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Drop the old helper function and recreate it
DROP FUNCTION IF EXISTS is_group_member(UUID);

CREATE OR REPLACE FUNCTION is_group_member(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members WHERE group_id = gid AND user_id = (select auth.uid())
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================
-- PROFILES
-- =====================
CREATE POLICY "profiles_read" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (true);

-- =====================
-- GROUPS
-- =====================
CREATE POLICY "groups_read" ON groups FOR SELECT TO authenticated USING (is_group_member(id));
CREATE POLICY "groups_insert" ON groups FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "groups_update" ON groups FOR UPDATE TO authenticated USING (is_group_member(id));
CREATE POLICY "groups_delete" ON groups FOR DELETE TO authenticated USING (
  (select auth.uid()) = created_by
);

-- =====================
-- GROUP MEMBERS
-- =====================
CREATE POLICY "group_members_read" ON group_members FOR SELECT TO authenticated USING (is_group_member(group_id));
CREATE POLICY "group_members_insert" ON group_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "group_members_delete" ON group_members FOR DELETE TO authenticated USING (
  (select auth.uid()) = user_id
);

-- =====================
-- EXPENSES
-- =====================
CREATE POLICY "expenses_read" ON expenses FOR SELECT TO authenticated USING (is_group_member(group_id));
CREATE POLICY "expenses_insert" ON expenses FOR INSERT TO authenticated WITH CHECK (is_group_member(group_id));
CREATE POLICY "expenses_delete" ON expenses FOR DELETE TO authenticated USING (is_group_member(group_id));

-- =====================
-- EXPENSE PAYERS
-- =====================
CREATE POLICY "expense_payers_read" ON expense_payers FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_id AND is_group_member(e.group_id))
);
CREATE POLICY "expense_payers_insert" ON expense_payers FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_id AND is_group_member(e.group_id))
);
CREATE POLICY "expense_payers_delete" ON expense_payers FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_id AND is_group_member(e.group_id))
);

-- =====================
-- EXPENSE SPLITS
-- =====================
CREATE POLICY "expense_splits_read" ON expense_splits FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_id AND is_group_member(e.group_id))
);
CREATE POLICY "expense_splits_insert" ON expense_splits FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_id AND is_group_member(e.group_id))
);
CREATE POLICY "expense_splits_delete" ON expense_splits FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_id AND is_group_member(e.group_id))
);

-- =====================
-- SETTLEMENTS
-- =====================
CREATE POLICY "settlements_read" ON settlements FOR SELECT TO authenticated USING (is_group_member(group_id));
CREATE POLICY "settlements_insert" ON settlements FOR INSERT TO authenticated WITH CHECK (is_group_member(group_id));
