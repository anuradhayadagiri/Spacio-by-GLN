-- Host system, media storage, and secure post-payment location access for Spacio by GLN.

alter table if exists public.profiles
  add column if not exists host_activated_at timestamptz,
  add column if not exists account_modes text[] not null default array['user']::text[];

alter table if exists public.listings
  add column if not exists state text,
  add column if not exists pincode text,
  add column if not exists approximate_area text,
  add column if not exists exact_location_locked boolean not null default true,
  add column if not exists media_urls text[] not null default '{}',
  add column if not exists video_urls text[] not null default '{}',
  add column if not exists amenities text[] not null default '{}',
  add column if not exists rules text[] not null default '{}',
  add column if not exists capacity integer not null default 1 check (capacity > 0);

alter table if exists public.bookings
  add column if not exists location_unlocked_at timestamptz;

do $$
begin
  alter type public.booking_status add value if not exists 'confirmed';
  alter type public.booking_status add value if not exists 'checked_in';
  alter type public.booking_status add value if not exists 'checked_out';
exception when undefined_object then null;
end $$;

create table if not exists public.location_access_logs (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  access_type text not null default 'unlock',
  granted boolean not null default false,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists listings_host_plan_idx on public.listings(host_id, plan);
create index if not exists listings_city_area_idx on public.listings(city, approximate_area);
create index if not exists bookings_guest_payment_idx on public.bookings(guest_id, payment_status, status);
create index if not exists location_access_logs_booking_idx on public.location_access_logs(booking_id, created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-media',
  'listing-media',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.location_access_logs enable row level security;

drop policy if exists "users read own location access logs" on public.location_access_logs;
create policy "users read own location access logs"
on public.location_access_logs
for select
using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

drop policy if exists "public listing media is readable" on storage.objects;
create policy "public listing media is readable"
on storage.objects
for select
using (bucket_id = 'listing-media');

drop policy if exists "hosts upload own listing media" on storage.objects;
create policy "hosts upload own listing media"
on storage.objects
for insert
with check (
  bucket_id = 'listing-media'
  and auth.uid()::text = (storage.foldername(name))[1]
  and (
    public.has_role(auth.uid(), 'host')
    or public.has_role(auth.uid(), 'admin')
    or exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('host', 'admin')
    )
  )
);

drop policy if exists "hosts update own listing media" on storage.objects;
create policy "hosts update own listing media"
on storage.objects
for update
using (
  bucket_id = 'listing-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "hosts delete own listing media" on storage.objects;
create policy "hosts delete own listing media"
on storage.objects
for delete
using (
  bucket_id = 'listing-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Public marketplace reads can see only approximate location columns.
revoke select on public.listings from anon, authenticated;
grant select (
  id,
  host_id,
  title,
  category,
  city,
  approximate_area,
  description,
  price,
  price_unit,
  rating,
  review_count,
  image_url,
  instant_book,
  status,
  created_at,
  updated_at
) on public.listings to anon, authenticated;
grant insert, update, delete on public.listings to authenticated;

grant select, insert on public.location_access_logs to authenticated;
