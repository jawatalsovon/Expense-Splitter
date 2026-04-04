-- Fix RLS policies — run this in Supabase SQL Editor
-- Drops and recreates all policies using the recommended (select auth.uid()) pattern

-- =====================
-- PROFILES
-- =====================
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK ((select auth.uid()) = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING ((select auth.uid()) = id);

-- =====================
-- GROUPS
-- =====================
DROP POLICY IF EXISTS "groups_select_members" ON groups;
DROP POLICY IF EXISTS "groups_insert_auth" ON groups;
DROP POLICY IF EXISTS "groups_update_creator" ON groups;

CREATE POLICY "groups_select_members" ON groups FOR SELECT USING (is_group_member(id));
CREATE POLICY "groups_insert_auth" ON groups FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "groups_update_creator" ON groups FOR UPDATE USING ((select auth.uid()) = created_by);

-- =====================
-- GROUP MEMBERS
-- =====================
DROP POLICY IF EXISTS "group_members_select" ON group_members;
DROP POLICY IF EXISTS "group_members_insert" ON group_members;
DROP POLICY IF EXISTS "group_members_delete_own" ON group_members;

CREATE POLICY "group_members_select" ON group_members FOR SELECT USING (is_group_member(group_id));
CREATE POLICY "group_members_insert" ON group_members FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "group_members_delete_own" ON group_members FOR DELETE USING ((select auth.uid()) = user_id);

-- =====================
-- EXPENSES
-- =====================
DROP POLICY IF EXISTS "expenses_select" ON expenses;
DROP POLICY IF EXISTS "expenses_insert" ON expenses;
DROP POLICY IF EXISTS "expenses_delete" ON expenses;

CREATE POLICY "expenses_select" ON expenses FOR SELECT USING (is_group_member(group_id));
CREATE POLICY "expenses_insert" ON expenses FOR INSERT WITH CHECK (is_group_member(group_id));
CREATE POLICY "expenses_delete" ON expenses FOR DELETE USING (
  (select auth.uid()) = created_by OR
  (select auth.uid()) = (SELECT created_by FROM groups WHERE id = group_id)
);

-- =====================
-- EXPENSE PAYERS
-- =====================
DROP POLICY IF EXISTS "expense_payers_select" ON expense_payers;
DROP POLICY IF EXISTS "expense_payers_insert" ON expense_payers;
DROP POLICY IF EXISTS "expense_payers_delete" ON expense_payers;

CREATE POLICY "expense_payers_select" ON expense_payers FOR SELECT
  USING (EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_id AND is_group_member(e.group_id)));
CREATE POLICY "expense_payers_insert" ON expense_payers FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_id AND is_group_member(e.group_id)));
CREATE POLICY "expense_payers_delete" ON expense_payers FOR DELETE
  USING (EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_id AND is_group_member(e.group_id)));

-- =====================
-- EXPENSE SPLITS
-- =====================
DROP POLICY IF EXISTS "expense_splits_select" ON expense_splits;
DROP POLICY IF EXISTS "expense_splits_insert" ON expense_splits;
DROP POLICY IF EXISTS "expense_splits_delete" ON expense_splits;

CREATE POLICY "expense_splits_select" ON expense_splits FOR SELECT
  USING (EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_id AND is_group_member(e.group_id)));
CREATE POLICY "expense_splits_insert" ON expense_splits FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_id AND is_group_member(e.group_id)));
CREATE POLICY "expense_splits_delete" ON expense_splits FOR DELETE
  USING (EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_id AND is_group_member(e.group_id)));

-- =====================
-- SETTLEMENTS
-- =====================
DROP POLICY IF EXISTS "settlements_select" ON settlements;
DROP POLICY IF EXISTS "settlements_insert" ON settlements;

CREATE POLICY "settlements_select" ON settlements FOR SELECT USING (is_group_member(group_id));
CREATE POLICY "settlements_insert" ON settlements FOR INSERT WITH CHECK (is_group_member(group_id));
