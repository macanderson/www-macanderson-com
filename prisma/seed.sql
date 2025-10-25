-- Enable extensions required by RAG (Neon supports CREATE EXTENSION)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Use pgcrypto gen_salt/crypt to generate a valid bcrypt hash at seed time
INSERT INTO "User" (id, email, password, role, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text,
       'admin@macanderson.com',
       crypt('admin123', gen_salt('bf', 10)),
       'admin',
       NOW(),
       NOW()
WHERE NOT EXISTS (SELECT 1 FROM "User" WHERE email = 'admin@macanderson.com');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON "DocumentChunk" USING ivfflat (embedding vector_cosine_ops);

-- Insert default component registry entries
INSERT INTO "ComponentRegistry" (id, name, "displayName", description, intent, "componentPath", "isActive", priority, "createdAt", "updatedAt")
VALUES
  (
    gen_random_uuid()::text,
    'work-timeline',
    'Work Timeline',
    'Interactive timeline showing Mac Anderson''s career history and work experience',
    ARRAY['work', 'career', 'job', 'experience', 'employment', 'professional', 'timeline'],
    'components/work-timeline',
    true,
    10,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid()::text,
    'education-selector',
    'Education Selector',
    'Interactive component for exploring undergraduate and graduate education',
    ARRAY['education', 'school', 'university', 'degree', 'study', 'academic', 'graduate', 'undergraduate'],
    'components/education-selector',
    true,
    10,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid()::text,
    'social-links',
    'Social Links',
    'Social media connections and personal interests',
    ARRAY['social', 'connect', 'contact', 'interest', 'hobby', 'passion', 'reach', 'follow'],
    'components/social-links',
    true,
    10,
    NOW(),
    NOW()
  )
ON CONFLICT (name) DO NOTHING;
