-- Run in Chatbot Supabase SQL Editor: https://supabase.com/dashboard/project/mktzrhqaxxclisxckmed/sql
-- Enables Chatbot Admin page: enrollments (leads) + documents (uploaded resources).

-- Enrollments (leads)
CREATE TABLE IF NOT EXISTS public.enrollments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  sugar_level VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read enrollments" ON public.enrollments;
CREATE POLICY "Allow anon read enrollments" ON public.enrollments
  FOR SELECT TO anon USING (true);

-- Documents (uploaded files + links)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'document',
  file_name VARCHAR(255),
  storage_path VARCHAR(500),
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read documents" ON public.documents;
CREATE POLICY "Allow anon read documents" ON public.documents
  FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow anon insert documents" ON public.documents;
CREATE POLICY "Allow anon insert documents" ON public.documents
  FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon delete documents" ON public.documents;
CREATE POLICY "Allow anon delete documents" ON public.documents
  FOR DELETE TO anon USING (true);

-- Storage bucket (create if not exists)
-- Or create manually: Dashboard → Storage → New bucket → id: chatbot-documents, Public: yes
INSERT INTO storage.buckets (id, name, public)
VALUES ('chatbot-documents', 'chatbot-documents', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow anon upload chatbot-documents" ON storage.objects;
CREATE POLICY "Allow anon upload chatbot-documents" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'chatbot-documents');
DROP POLICY IF EXISTS "Allow anon read chatbot-documents" ON storage.objects;
CREATE POLICY "Allow anon read chatbot-documents" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'chatbot-documents');
DROP POLICY IF EXISTS "Allow anon delete chatbot-documents" ON storage.objects;
CREATE POLICY "Allow anon delete chatbot-documents" ON storage.objects
  FOR DELETE TO anon USING (bucket_id = 'chatbot-documents');
