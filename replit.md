# Hisab - Expense Splitting App

## Overview

A full-stack expense splitting web app built with React + Vite + Supabase. Bengali word for "account/calculation". Currency: ৳ (Bangladeshi Taka).

## Stack

- **Frontend**: React, Tailwind CSS v4 (via @tailwindcss/vite), Wouter (routing)
- **Backend/Auth/DB/Realtime**: Supabase
- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm

## Key Commands

- `pnpm --filter @workspace/splitbd run dev` — run the frontend locally
- `pnpm --filter @workspace/api-server run dev` — run the API server

## Architecture

- `artifacts/splitbd/` — React frontend (all pages, components, logic)
- `artifacts/api-server/` — Express API server (health check only, app data lives in Supabase)
- All data is stored in Supabase (PostgreSQL) with RLS **disabled** on all tables

## Supabase Setup

1. Run `artifacts/splitbd/supabase-schema.sql` to create the base tables
2. Run `artifacts/splitbd/supabase-disable-rls.sql` to disable RLS on all tables
3. Run `artifacts/splitbd/supabase-repayments.sql` to create the repayments table

### Tables
- `profiles` — user profiles (display name, avatar color)
- `groups` — expense groups (with invite_code)
- `group_members` — group membership
- `expenses` — individual expenses
- `expense_payers` — who paid what for each expense
- `expense_splits` — who owes what for each expense
- `settlements` — recorded debt settlements (legacy)
- `repayments` — new repayment records with optional note field

## Features

- Email/password auth via Supabase Auth (email confirmation disabled)
- Create/join groups via 8-char invite codes
- Add expenses with flexible split (equal split, multiple payers, custom amounts)
- Greedy debt simplification algorithm (minimum transactions)
- Real-time updates via Supabase Realtime subscriptions (expenses, settlements, repayments)
- Repayment tracking: "Mark as Paid" with note field, repayment history, affects balance calculation
- Dark/light mode toggle (persisted in localStorage, respects system preference)
- Bengali/English language toggle (persisted in localStorage) — full i18n via `src/lib/i18n.ts`
- Currency: ৳ (configurable in `src/lib/constants.ts`)
- Color-coded avatar system (8 preset colors)
- Favicon: `/public/hisab-icon.png`

## Key Context Files

- `src/context/ThemeContext.tsx` — dark/light mode, toggles `.dark` class on `<html>`
- `src/context/LangContext.tsx` — Bengali/English, provides `T` translation object
- `src/lib/i18n.ts` — full EN + BN translation dictionaries with typed `Translations` interface
- `src/lib/balance.ts` — `calculateMemberBalances(expenses, settlements, members, repayments?)`
- `src/lib/types.ts` — all TypeScript types including `Repayment`
- `src/index.css` — Tailwind v4, `@custom-variant dark (&:is(.dark *))`, dark CSS variables

## Dark Mode

Tailwind v4 with `@custom-variant dark (&:is(.dark *))`. ThemeContext toggles `dark` class on `document.documentElement`. Dark CSS variable overrides are in `index.css` `.dark` block.

## Environment Variables

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key
- `SESSION_SECRET` — session secret for API server
