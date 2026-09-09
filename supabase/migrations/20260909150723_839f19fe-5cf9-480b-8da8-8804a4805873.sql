CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  city TEXT,
  style_prefs JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  bust_cm NUMERIC,
  waist_cm NUMERIC,
  hips_cm NUMERIC,
  inseam_cm NUMERIC,
  shoulder_cm NUMERIC,
  body_shape TEXT,
  method TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.measurements TO authenticated;
GRANT ALL ON public.measurements TO service_role;
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "measurements_own" ON public.measurements FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users ON DELETE CASCADE,
  seller_name TEXT,
  title TEXT NOT NULL,
  description TEXT,
  brand TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  size_label TEXT,
  condition TEXT NOT NULL DEFAULT 'good',
  colour TEXT,
  style_tags TEXT[] NOT NULL DEFAULT '{}',
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'MYR',
  image_key TEXT,
  image_url TEXT,
  fit_notes JSONB NOT NULL DEFAULT '{}'::jsonb,
  mode TEXT NOT NULL DEFAULT 'both',
  status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT SELECT ON public.listings TO anon;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listings_public_read" ON public.listings FOR SELECT USING (true);
CREATE POLICY "listings_insert_own" ON public.listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "listings_update_own" ON public.listings FOR UPDATE TO authenticated USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "listings_delete_own" ON public.listings FOR DELETE TO authenticated USING (auth.uid() = seller_id);

CREATE TABLE public.favorites (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites_own" ON public.favorites FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MYR',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_buyer_read" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = buyer_id);
CREATE POLICY "orders_buyer_insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "orders_buyer_update" ON public.orders FOR UPDATE TO authenticated USING (auth.uid() = buyer_id) WITH CHECK (auth.uid() = buyer_id);

CREATE TABLE public.swap_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings ON DELETE CASCADE,
  offered_listing_id UUID REFERENCES public.listings ON DELETE SET NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.swap_requests TO authenticated;
GRANT ALL ON public.swap_requests TO service_role;
ALTER TABLE public.swap_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "swaps_requester_all" ON public.swap_requests FOR ALL TO authenticated USING (auth.uid() = requester_id) WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "swaps_seller_read" ON public.swap_requests FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = swap_requests.listing_id AND l.seller_id = auth.uid()));
CREATE POLICY "swaps_seller_update" ON public.swap_requests FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = swap_requests.listing_id AND l.seller_id = auth.uid())) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.closy_set_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.closy_set_updated_at();
CREATE TRIGGER measurements_updated_at BEFORE UPDATE ON public.measurements FOR EACH ROW EXECUTE FUNCTION public.closy_set_updated_at();
CREATE TRIGGER listings_updated_at BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.closy_set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.listings (seller_name, title, description, brand, category, size_label, condition, colour, style_tags, price_cents, image_key, mode, fit_notes) VALUES
('Aisyah', 'Buttercream linen midi dress', 'Worn twice to a garden brunch. Soft linen, hidden side pockets, sits mid-calf on 165cm.', 'Zara', 'dresses', 'M', 'like new', 'cream', ARRAY['romantic','minimal','brunch'], 8900, 'dress-cream', 'both', '{"bust_cm":88,"waist_cm":72,"length_cm":118}'),
('Mei Ling', 'Powder blue oversized blazer', 'Thrifted gem, boxy shoulders, great over a slip dress. Small mark inside the lining.', 'Uniqlo', 'outerwear', 'L', 'good', 'blue', ARRAY['street','oversized','office'], 6500, 'blazer-blue', 'swap', '{"shoulder_cm":45,"chest_cm":104}'),
('Nadia', 'Rose knit cardigan', 'Cosy cropped cardigan, pearl buttons. Zero pilling.', 'H&M', 'tops', 'S', 'like new', 'pink', ARRAY['cute','cottagecore','layering'], 4200, 'cardigan-pink', 'both', '{"bust_cm":82,"length_cm":48}'),
('Hana', 'High waist mom jeans', 'Rigid denim, ankle length on 160cm. Hemmed once by a tailor.', 'Levi''s', 'bottoms', '27', 'good', 'denim', ARRAY['casual','denim','everyday'], 7500, 'jeans-denim', 'buy', '{"waist_cm":68,"hips_cm":94,"inseam_cm":70}'),
('Sofea', 'Lilac satin slip skirt', 'Bias cut, falls beautifully. Perfect for dinners.', 'Mango', 'bottoms', 'M', 'like new', 'lilac', ARRAY['evening','satin','soft'], 5500, 'skirt-lilac', 'both', '{"waist_cm":70,"hips_cm":96,"length_cm":85}'),
('Tasha', 'Sky blue cotton shirt', 'Crisp everyday shirt, breathable cotton. Buttons all intact.', 'Cotton On', 'tops', 'M', 'good', 'blue', ARRAY['office','minimal','classic'], 3500, 'shirt-blue', 'swap', '{"bust_cm":92,"shoulder_cm":40}');