-- Run in Chatbot Supabase SQL Editor: https://supabase.com/dashboard/project/mktzrhqaxxclisxckmed/sql
-- Allows the frontend to read enrollments (leads) for the Chatbot Admin page.

-- Create enrollments table if it doesn't exist (matches backend model)
CREATE TABLE IF NOT EXISTS public.enrollments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  sugar_level VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Allow anon read for leads (admin dashboard)
DROP POLICY IF EXISTS "Allow anon read enrollments" ON public.enrollments;
CREATE POLICY "Allow anon read enrollments" ON public.enrollments
  FOR SELECT TO anon USING (true);
