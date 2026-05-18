
-- Roles enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('user', 'host', 'admin');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE TYPE public.listing_status AS ENUM ('live', 'draft', 'paused');
CREATE TYPE public.price_unit AS ENUM ('hour', 'day', 'ticket', 'package', 'person');
CREATE TYPE public.booking_status AS ENUM ('pending', 'approved', 'rejected', 'completed', 'cancelled');

CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  price_unit public.price_unit NOT NULL DEFAULT 'hour',
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  instant_book BOOLEAN NOT NULL DEFAULT false,
  status public.listing_status NOT NULL DEFAULT 'live',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_listings_host ON public.listings(host_id);
CREATE INDEX idx_listings_category ON public.listings(category);

CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  host_id UUID NOT NULL,
  guest_id UUID NOT NULL,
  guest_name TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  duration TEXT,
  guests INTEGER NOT NULL DEFAULT 1,
  amount NUMERIC(10,2) NOT NULL,
  status public.booking_status NOT NULL DEFAULT 'pending',
  qr_code TEXT,
  otp TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bookings_host ON public.bookings(host_id);
CREATE INDEX idx_bookings_guest ON public.bookings(guest_id);
CREATE INDEX idx_bookings_listing ON public.bookings(listing_id);

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reviews_listing ON public.reviews(listing_id);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, owner write
CREATE POLICY "profiles readable by all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles: users see own; admins see all
CREATE POLICY "users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Listings: live ones publicly readable; hosts manage own
CREATE POLICY "live listings readable" ON public.listings FOR SELECT USING (status = 'live' OR auth.uid() = host_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "hosts insert own listings" ON public.listings FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "hosts update own listings" ON public.listings FOR UPDATE USING (auth.uid() = host_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "hosts delete own listings" ON public.listings FOR DELETE USING (auth.uid() = host_id OR public.has_role(auth.uid(), 'admin'));

-- Bookings: visible to guest or host involved
CREATE POLICY "booking parties read" ON public.bookings FOR SELECT USING (auth.uid() = guest_id OR auth.uid() = host_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "guests create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = guest_id);
CREATE POLICY "host or guest update booking" ON public.bookings FOR UPDATE USING (auth.uid() = host_id OR auth.uid() = guest_id);

-- Reviews: public read; guest creates own
CREATE POLICY "reviews readable by all" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "guests create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = guest_id);
CREATE POLICY "guests update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = guest_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_listings_updated BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
