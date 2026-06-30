-- FreelanceBot Supabase schema (MVP + v0.9.0 marketplace)
-- Apply via: Supabase dashboard -> SQL Editor -> paste -> Run
-- Idempotent: safe to re-run.

-- ---------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------
create table if not exists orders (
  id              bigserial primary key,
  onchain_id      bigint,
  client_email    text not null,
  freelancer_email text not null,
  brief           text not null,
  amount_usdc     numeric(18, 6) not null,
  deadline        timestamptz,
  status          text not null default 'draft',
  deliverable_url text,
  agent_notes     text,
  created_at      timestamptz default now()
);

-- v0.9.0 additions for marketplace
alter table orders add column if not exists field text default 'other';
alter table orders add column if not exists is_public boolean default false;
alter table orders add column if not exists title text;

create index if not exists idx_orders_public_field on orders (is_public, field) where is_public = true;
create index if not exists idx_orders_status on orders (status);

-- v0.9.2 additions for file attachments
-- attachments is an array of { filename, url, size_bytes, content_type, uploaded_by, created_at }
alter table orders add column if not exists attachments jsonb default '[]'::jsonb;

-- Storage bucket for uploaded files. Public bucket — privacy is enforced at
-- the application layer (we only render URLs to parties / public-job viewers).
insert into storage.buckets (id, name, public)
  values ('attachments', 'attachments', true)
  on conflict (id) do nothing;

-- Open read access to the bucket (any URL works as long as caller has it).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and policyname = 'attachments_public_read'
  ) then
    create policy "attachments_public_read" on storage.objects
      for select using (bucket_id = 'attachments');
  end if;
end $$;

-- Open write access (browser uploads with publishable key). Hardening for
-- per-user paths lands in MVP 2 alongside real auth.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and policyname = 'attachments_public_write'
  ) then
    create policy "attachments_public_write" on storage.objects
      for insert with check (bucket_id = 'attachments');
  end if;
end $$;

-- ---------------------------------------------------------------
-- Messages (agent chat thread)
-- ---------------------------------------------------------------
create table if not exists messages (
  id          bigserial primary key,
  order_id    bigint references orders(id) on delete cascade,
  role        text not null,
  content     text not null,
  created_at  timestamptz default now()
);

-- ---------------------------------------------------------------
-- Applications (v0.9.0 marketplace) — freelancers apply to open jobs
-- ---------------------------------------------------------------
create table if not exists applications (
  id                 bigserial primary key,
  order_id           bigint references orders(id) on delete cascade,
  freelancer_email   text not null,
  pitch              text,
  bid_amount_usdc    numeric(18, 6),
  status             text default 'pending',  -- pending | accepted | rejected | withdrawn
  created_at         timestamptz default now()
);

create index if not exists idx_applications_order  on applications (order_id);
create index if not exists idx_applications_freelancer on applications (freelancer_email);

-- ---------------------------------------------------------------
-- Row level security (enabled; policies added in week 4 of MVP 2)
-- ---------------------------------------------------------------
alter table orders       enable row level security;
alter table messages     enable row level security;
alter table applications enable row level security;
