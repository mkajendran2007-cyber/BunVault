-- Run this entire script in the Supabase SQL Editor

-- 1. Create a table for Holdings
CREATE TABLE public.holdings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL, -- 'Equity', 'Debt', 'Crypto', 'Commodity'
  qty NUMERIC NOT NULL,
  buy_price NUMERIC NOT NULL,
  purchase_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create a table for SIPs
CREATE TABLE public.sips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  frequency TEXT NOT NULL, -- 'Daily', 'Weekly', 'Monthly'
  next_date DATE NOT NULL,
  status TEXT DEFAULT 'Active', -- 'Active', 'Paused'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Set up Row Level Security (RLS) so users can only see their own data
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own holdings" 
ON public.holdings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own holdings" 
ON public.holdings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own holdings" 
ON public.holdings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own holdings" 
ON public.holdings FOR DELETE USING (auth.uid() = user_id);

-- Same for SIPs
CREATE POLICY "Users can view their own sips" 
ON public.sips FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sips" 
ON public.sips FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sips" 
ON public.sips FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sips" 
ON public.sips FOR DELETE USING (auth.uid() = user_id);

-- 4. Create a table for Goals
CREATE TABLE public.goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  target NUMERIC NOT NULL,
  current NUMERIC DEFAULT 0,
  color TEXT NOT NULL,
  target_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own goals" 
ON public.goals FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" 
ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
ON public.goals FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" 
ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- 5. Create a table for Watchlist
CREATE TABLE public.watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own watchlist" 
ON public.watchlist FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watchlist" 
ON public.watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlist" 
ON public.watchlist FOR DELETE USING (auth.uid() = user_id);

-- 6. Create a table for Portfolio Snapshots (Historical Tracking)
CREATE TABLE public.portfolio_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  total_investment NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL,
  asset_breakdown JSONB DEFAULT '{}'::jsonb, -- Stores {'Equity': 500, 'Mutual Fund': 1200, ...}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, date)
);

ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own snapshots" 
ON public.portfolio_snapshots FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own snapshots" 
ON public.portfolio_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
