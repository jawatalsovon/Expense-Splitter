# Hisab - Expense Splitting App

## Overview

A full-stack expense splitting web app (Splitwise alternative) built with React + Vite + Supabase.

## Stack

- **Frontend**: React, Tailwind CSS, Wouter (routing)
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
- All data is stored in Supabase (PostgreSQL) with Row Level Security

## Supabase Setup

Run `artifacts/splitbd/supabase-schema.sql` in the Supabase SQL Editor to create all tables and RLS policies.

### Tables
- `profiles` — user profiles (display name, avatar color)
- `groups` — expense groups
- `group_members` — group membership
- `expenses` — individual expenses
- `expense_payers` — who paid what for each expense
- `expense_splits` — who owes what for each expense
- `settlements` — recorded debt settlements

## Features

- Email/password auth via Supabase Auth
- Create/join groups via invite codes
- Add expenses with flexible split (equal, multiple payers)
- Greedy debt simplification algorithm (minimum transactions)
- Real-time updates via Supabase Realtime subscriptions
- Currency: ৳ (configurable in `src/lib/constants.ts`)
- Color-coded avatar system (8 preset colors)

## Environment Variables

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key
