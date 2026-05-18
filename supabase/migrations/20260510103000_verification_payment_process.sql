-- Verification + payment process support for Spacio by GLN.
-- Apply this after the production marketplace migration.

create table if not exists public.verification_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  channel text not null check (channel in ('email', 'phone')),
  target_hash text not null,
  code_hash text,
  status text not null default 'pending' check (status in ('pending', 'verified', 'expired', 'failed')),
  provider text,
  provider_message_id text,
  attempts integer not null default 0,
  expires_at timestamptz not null default (now() + interval '5 minutes'),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.transactions
  add column if not exists provider text default 'razorpay',
  add column if not exists provider_order_id text,
  add column if not exists provider_payment_id text,
  add column if not exists provider_signature text,
  add column if not exists method text,
  add column if not exists receipt_id text,
  add column if not exists receipt_url text,
  add column if not exists paid_at timestamptz;

alter table public.bookings
  add column if not exists payment_provider text default 'razorpay',
  add column if not exists payment_reference text,
  add column if not exists access_expires_at timestamptz;

create index if not exists verification_attempts_user_idx
  on public.verification_attempts(user_id, created_at desc);

create index if not exists verification_attempts_target_idx
  on public.verification_attempts(channel, target_hash, created_at desc);

create index if not exists transactions_provider_order_idx
  on public.transactions(provider_order_id);

create index if not exists bookings_payment_reference_idx
  on public.bookings(payment_reference);

alter table public.verification_attempts enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "Users can read own verification attempts" on public.verification_attempts;
create policy "Users can read own verification attempts"
on public.verification_attempts
for select
using (auth.uid() = user_id);

drop policy if exists "Service role manages verification attempts" on public.verification_attempts;
create policy "Service role manages verification attempts"
on public.verification_attempts
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Transaction parties can read" on public.transactions;
create policy "Transaction parties can read"
on public.transactions
for select
using (
  auth.uid() = user_id
  or auth.uid() = host_id
  or public.has_role(auth.uid(), 'admin')
);

drop policy if exists "Guests can create own pending transactions" on public.transactions;
create policy "Guests can create own pending transactions"
on public.transactions
for insert
with check (auth.uid() = user_id);

drop policy if exists "Service role manages transactions" on public.transactions;
create policy "Service role manages transactions"
on public.transactions
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
