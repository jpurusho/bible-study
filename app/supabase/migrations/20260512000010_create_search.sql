-- Enable pg_trgm for fuzzy matching
create extension if not exists pg_trgm;

-- Add full-text search vector to sessions
alter table public.sessions add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) stored;

create index sessions_search_idx on public.sessions using gin(search_vector);
create index sessions_title_trgm_idx on public.sessions using gin(title gin_trgm_ops);
