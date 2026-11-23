-- Carga inicial del catálogo de camisas para pruebas de la tienda
INSERT INTO public.products (name, description, category, price, stock, sizes, image_url, active)
VALUES
  (
    'Camisa Básica Algodón Premium',
    'Camisa 100% algodón peinado ideal para estampado DTF o serigrafía.',
    'Básicas',
    280.00,
    25,
    ARRAY['S', 'M', 'L', 'XL'],
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
    TRUE
  ),
  (
    'Camisa Oversize Negra Urbana',
    'Corte relajado de alto gramaje (220g) con cuello reforzado.',
    'Oversize',
    390.00,
    18,
    ARRAY['M', 'L', 'XL'],
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80',
    TRUE
  ),
  (
    'Camisa Personalizada Full Print',
    'Incluye estampado frontal y trasero a todo color con diseño propio.',
    'Personalizadas',
    450.00,
    15,
    ARRAY['S', 'M', 'L', 'XL'],
    'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&q=80',
    TRUE
  ),
  (
    'Polo Corporativo Bordado',
    'Tela piqué transpirable con opción de logotipo bordado en pecho.',
    'Corporativas',
    420.00,
    20,
    ARRAY['S', 'M', 'L', 'XL'],
    'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=600&q=80',
    TRUE
  );

-- Asigna permisos de administrador al usuario de pruebas admin
UPDATE public.profiles
SET role = 'admin', full_name = 'Administrador Estampa HN'
WHERE email = 'admin@estampahn.test';