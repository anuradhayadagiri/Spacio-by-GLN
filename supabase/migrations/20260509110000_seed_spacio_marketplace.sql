-- Starter backend data for Spacio by GLN.
-- These rows make the Supabase-backed marketplace usable immediately after migrations run.

insert into public.profiles (id, full_name, avatar_url)
values
  ('00000000-0000-0000-0000-00000000d1d1', 'Spacio Demo Host', null)
on conflict (id) do update set full_name = excluded.full_name;

insert into public.user_roles (user_id, role)
values ('00000000-0000-0000-0000-00000000d1d1', 'host')
on conflict (user_id, role) do nothing;

insert into public.listings (
  id,
  host_id,
  title,
  category,
  city,
  address,
  description,
  price,
  price_unit,
  rating,
  review_count,
  image_url,
  instant_book,
  status,
  plan,
  commission_percentage
)
values
  (
    '11111111-1111-1111-1111-000000000001',
    '00000000-0000-0000-0000-00000000d1d1',
    'The Glasshouse Studio',
    'pro-spaces',
    'Bengaluru',
    'Indiranagar',
    'A bright glass-walled studio perfect for shoots, workshops and focused team offsites.',
    450,
    'hour',
    4.8,
    214,
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=70&auto=format&fit=crop',
    true,
    'live',
    'standard',
    20
  ),
  (
    '11111111-1111-1111-1111-000000000002',
    '00000000-0000-0000-0000-00000000d1d1',
    'Skyline Rooftop',
    'party',
    'Bengaluru',
    'MG Road',
    'An open-air rooftop with panoramic city views for birthdays, launch parties and private events.',
    2200,
    'hour',
    4.9,
    432,
    'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=900&q=70&auto=format&fit=crop',
    false,
    'live',
    'pro',
    25
  ),
  (
    '11111111-1111-1111-1111-000000000003',
    '00000000-0000-0000-0000-00000000d1d1',
    'Quiet Corner Library',
    'study',
    'Bengaluru',
    'Koramangala',
    'A serene library with private cubicles, fast Wi-Fi and deep-work friendly silence.',
    120,
    'hour',
    4.7,
    178,
    'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=900&q=70&auto=format&fit=crop',
    true,
    'live',
    'regular',
    15
  ),
  (
    '11111111-1111-1111-1111-000000000004',
    '00000000-0000-0000-0000-00000000d1d1',
    'Asado Wood-Fire Kitchen',
    'dining',
    'Bengaluru',
    'HSR Layout',
    'Reserve a table, split the bill and skip the queue at a wood-fire dining space.',
    1800,
    'package',
    4.6,
    612,
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=70&auto=format&fit=crop',
    true,
    'live',
    'standard',
    20
  )
on conflict (id) do update set
  title = excluded.title,
  category = excluded.category,
  city = excluded.city,
  address = excluded.address,
  description = excluded.description,
  price = excluded.price,
  price_unit = excluded.price_unit,
  rating = excluded.rating,
  review_count = excluded.review_count,
  image_url = excluded.image_url,
  instant_book = excluded.instant_book,
  status = excluded.status,
  plan = excluded.plan,
  commission_percentage = excluded.commission_percentage;
