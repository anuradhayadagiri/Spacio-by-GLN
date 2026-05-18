-- Production marketplace foundation for Spacio by GLN.
-- Adds role/profile preferences, commission-ready transactions, notifications,
-- wishlists, activity logs, and secure QR/OTP booking access fields.

do $$
begin
  create type public.spacio_role as enum ('user', 'host', 'admin');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.host_plan as enum ('regular', 'standard', 'pro');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.theme_preference as enum ('light', 'dark', 'system');
exception when duplicate_object then null;
end $$;

alter table if exists public.profiles
  add column if not exists role public.spacio_role default 'user',
  add column if not exists phone text,
  add column if not exists phone_verified boolean default false,
  add column if not exists email_verified boolean default false,
  add column if not exists theme_preference public.theme_preference default 'system',
  add column if not exists device_fingerprint text,
  add column if not exists suspicious_login_count integer default 0;

alter table if exists public.listings
  add column if not exists plan public.host_plan default 'regular',
  add column if not exists commission_percentage numeric(5,2) default 15.00,
  add column if not exists latitude numeric(10,7),
  add column if not exists longitude numeric(10,7),
  add column if not exists moderation_status text default 'pending',
  add column if not exists availability jsonb default '{}'::jsonb;

alter table if exists public.bookings
  add column if not exists qr_token_hash text,
  add column if not exists otp_hash text,
  add column if not exists otp_expires_at timestamptz,
  add column if not exists qr_status text default 'issued',
  add column if not exists checked_in_at timestamptz,
  add column if not exists checked_out_at timestamptz,
  add column if not exists payment_status text default 'pending';

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  host_id uuid references auth.users(id) on delete set null,
  razorpay_payment_id text,
  amount numeric(12,2) not null,
  admin_commission numeric(12,2) not null default 0,
  host_payout numeric(12,2) not null default 0,
  refund_amount numeric(12,2) not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  type text not null default 'system',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.wishlist (
  user_id uuid references auth.users(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  risk_score numeric(5,2) default 0,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table if exists public.reviews
  add column if not exists public_review text,
  add column if not exists private_feedback text,
  add column if not exists verified_booking boolean default false,
  add column if not exists moderation_status text default 'visible';

create index if not exists idx_listings_category_plan on public.listings(category, plan);
create index if not exists idx_listings_location on public.listings(latitude, longitude);
create index if not exists idx_bookings_payment_status on public.bookings(payment_status);
create index if not exists idx_transactions_booking on public.transactions(booking_id);
create index if not exists idx_notifications_user_unread on public.notifications(user_id, read_at);
create index if not exists idx_activity_logs_risk on public.activity_logs(risk_score desc, created_at desc);
