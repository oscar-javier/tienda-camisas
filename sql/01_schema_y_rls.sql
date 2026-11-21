-- ==========================================
-- 1. TABLA DE PERFILES Y ROLES (profiles)
-- ==========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger automático: cada vez que se registra un usuario en Auth, se crea su perfil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'customer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 2. TABLA DE PRODUCTOS / CAMISAS (products)
-- ==========================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Camisas',
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sizes TEXT[] NOT NULL DEFAULT ARRAY['S', 'M', 'L', 'XL'],
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 3. TABLAS DE PEDIDOS (orders y order_items)
-- ==========================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado')),
  total NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  shipping_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  size TEXT NOT NULL DEFAULT 'M',
  custom_text TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0)
);

-- ==========================================
-- 4. SEGURIDAD ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Función auxiliar para validar si el usuario actual es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Políticas para PROFILES
CREATE POLICY "Usuarios ven su propio perfil y admin ve todos"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Usuarios editan su propio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Políticas para PRODUCTS
CREATE POLICY "Cualquiera puede ver productos activos"
  ON public.products FOR SELECT
  USING (active = TRUE OR public.is_admin());

CREATE POLICY "Solo admin inserta productos"
  ON public.products FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Solo admin actualiza productos"
  ON public.products FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Solo admin elimina productos"
  ON public.products FOR DELETE
  USING (public.is_admin());

-- Políticas para ORDERS
CREATE POLICY "Cliente ve sus pedidos y admin ve todos"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Cliente crea sus propios pedidos"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Solo admin actualiza estado de pedidos"
  ON public.orders FOR UPDATE
  USING (public.is_admin());

-- Políticas para ORDER_ITEMS
CREATE POLICY "Ver detalles de pedidos permitidos"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND (orders.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Insertar detalles en pedidos propios"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );