-- =====================================================
-- LONG HẢI ESPORTS - DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'member', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Team Members
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  full_name TEXT NOT NULL,
  nickname TEXT,
  date_of_birth DATE,
  role_in_team TEXT,
  hidden_stat TEXT DEFAULT 'PHẢN XẠ',
  signature_color TEXT,
  avatar_url TEXT,
  csgo_id TEXT,
  pubg_id TEXT,
  bio TEXT,
  position_order INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Products
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category TEXT,
  stock INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  total_amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  shipping_address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

-- 6. Posts
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  category TEXT DEFAULT 'news',
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Game Stats Cache
CREATE TABLE IF NOT EXISTS game_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id),
  game TEXT NOT NULL,
  stats JSONB,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Profiles: readable by all, editable by owner
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Members: readable by all
CREATE POLICY "Members are viewable by everyone" ON members FOR SELECT USING (true);
CREATE POLICY "Admins can manage members" ON members FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Products: readable by all, manageable by admin/member
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Admin/member can manage products" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'member'))
);

-- Orders: owner can see own, admin sees all
CREATE POLICY "Users can see own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin can see all orders" ON orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Order Items: same as orders
CREATE POLICY "Order items follow order access" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Users can create order items" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- Posts: readable by all, manageable by author/admin
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Members can create posts" ON posts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'member'))
);
CREATE POLICY "Authors can update own posts" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Admin can manage all posts" ON posts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Game Stats: readable by all
CREATE POLICY "Game stats are viewable by everyone" ON game_stats FOR SELECT USING (true);

-- =====================================================
-- TRIGGER: Auto-create profile on signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    'customer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SEED DATA: Team Members
-- =====================================================
INSERT INTO members (full_name, nickname, date_of_birth, role_in_team, hidden_stat, signature_color, position_order)
VALUES
  ('Hoàng Hữu Nhân', 'NhanHoag', '2004-12-23', 'Scout', 'Quan Sát', '#3B82F6', 1),
  ('Nguyễn Trương Tuấn Kiệt', 'TuanKitt', '2004-09-14', 'Entry Fragger', 'Đột Biến', '#F97316', 2),
  ('Lâm Quốc Bảo', 'Roab', '2004-10-20', 'Rifler', 'Tốc Độ', '#EAB308', 3),
  ('Nguyễn Anh Xuân Quân', 'XunWon', '2006-04-24', 'Support', 'Phản Xạ', '#9CA3AF', 4),
  ('Đặng Thành Lộc', 'LocMaster', '2004-11-14', 'IGL / Analyst', 'Phân Tích', '#EF4444', 5),
  ('Hoàng Trí Luật', 'YenOi', '2004-01-01', 'Lurker', 'Phán Đoán', '#A855F7', 6),
  ('Phạm Thanh Tài', 'Taile', '2004-06-12', 'AWPer', 'Rình Ai Tắm', '#EC4899', 7);
