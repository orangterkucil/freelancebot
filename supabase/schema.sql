-- FreelanceBot Supabase schema (MVP)
-- Apply via: Supabase dashboard -> SQL Editor -> paste -> Run

create table if not exists orders (
  id              bigserial primary key,
  onchain_id      bigint,                       -- order id in escrow contract (filled after fund)
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

create table if not exists messages (
  id          bigserial primary key,
  order_id    bigint references orders(id) on delete cascade,
  role        text not null,    -- 'client', 'freelancer', 'agent', 'system'
  content     text not null,
  created_at  timestamptz default now()
);

-- Enable RLS, then add policies in week 4 once auth pattern is decided.
alter table orders   enable row level security;
alter table messages enable row level security;
