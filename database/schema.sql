-- ============================================================
-- AROHVI Adornments — Complete Supabase PostgreSQL Schema & Seed
-- Aesthetic: Dark Indian Maximalism
-- ============================================================

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    tagline TEXT,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    category TEXT NOT NULL,
    material TEXT NOT NULL,
    finish TEXT NOT NULL,
    dimensions TEXT,
    care_instructions TEXT,
    story TEXT,
    styling_tip TEXT,
    stock INTEGER NOT NULL DEFAULT 10,
    in_stock INTEGER NOT NULL DEFAULT 1,
    image_url TEXT NOT NULL,
    gallery JSONB DEFAULT '[]'::jsonb,
    variants JSONB DEFAULT '[]'::jsonb,
    is_featured INTEGER DEFAULT 0,
    is_bestseller INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    shipping_address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    delivery_instructions TEXT,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'Pending',
    order_status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Confirmed, Shipped, Delivered, Cancelled
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC NOT NULL,
    shipping_fee NUMERIC NOT NULL DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    payment_verified_at TIMESTAMP WITH TIME ZONE,
    tracking_number TEXT,
    courier_name TEXT,
    tracking_url TEXT,
    estimated_delivery TEXT,
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. SITE CONTENT TABLE
CREATE TABLE IF NOT EXISTS site_content (
    section_key TEXT PRIMARY KEY,
    title TEXT,
    subtitle TEXT,
    body_text TEXT,
    data_json JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. EMAIL LOGS TABLE
CREATE TABLE IF NOT EXISTS email_logs (
    id TEXT PRIMARY KEY,
    order_id TEXT,
    order_number TEXT,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Sent', -- Sent, Failed, Simulated
    provider TEXT NOT NULL,             -- resend, smtp, simulated_logger
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. COLLECTIONS TABLE
CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    tagline TEXT,
    description TEXT,
    image_url TEXT,
    display_order INTEGER DEFAULT 0
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_email_logs_order ON email_logs(order_id);

-- ============================================================
-- 7. SUPABASE STORAGE BUCKET CONFIGURATION
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('arohvi-products', 'arohvi-products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public read access to product images
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Public Read AROHVI Products'
    ) THEN
        CREATE POLICY "Public Read AROHVI Products" 
        ON storage.objects FOR SELECT 
        USING (bucket_id = 'arohvi-products');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Allow Authenticated & Service Role Upload AROHVI'
    ) THEN
        CREATE POLICY "Allow Authenticated & Service Role Upload AROHVI" 
        ON storage.objects FOR ALL 
        USING (bucket_id = 'arohvi-products');
    END IF;
END $$;

-- ============================================================
-- 8. INITIAL SEED DATA (Statement Pieces & Manifesto)
-- ============================================================

-- Collections
INSERT INTO collections (id, name, slug, tagline, description, display_order)
VALUES 
    ('col-1', 'All Adornments', 'all', 'The complete everyday statement archive', 'Sculptural forms crafted for ordinary days.', 1),
    ('col-2', 'Rings', 'rings', 'Volcanic contours & tactile bands', 'Raw-edge rings inspired by temple stonework.', 2),
    ('col-3', 'Earrings', 'earrings', 'Architectural drops & smoked studs', 'Lightweight statement earrings for all-day comfort.', 3),
    ('col-4', 'Cuffs & Kadas', 'cuffs-kadas', 'Tribal totems & engraved wrist armour', 'Nomadic tribal wristwear of the Thar desert.', 4),
    ('col-5', 'Necklaces & Haslis', 'necklaces-haslis', 'Asymmetric torque collars', 'Traditional haslis reimagined as modern sculptural architecture.', 5)
ON CONFLICT (id) DO NOTHING;

-- Initial Catalog Products
INSERT INTO products (
    id, name, slug, tagline, price, original_price, category, 
    material, finish, dimensions, care_instructions, story, styling_tip, 
    stock, in_stock, image_url, gallery, variants, is_featured, is_bestseller
)
VALUES 
(
    'prod-1',
    'Surya Rekha Sculptural Ring',
    'surya-rekha-sculptural-ring',
    'Volcanic contours forged for everyday rebellion',
    499,
    650,
    'Rings',
    'Solid 92.5 Oxidised Brass Alloy with Antique Sterling Finish',
    'Deep Obsidian Black & Polished Ridge Accents',
    'Adjustable band (Fits standard Indian sizes 12 to 18)',
    'Store in an airtight cloth pouch. Wipe clean with a soft dry cotton cloth after wear. Avoid direct perfumes and moisture.',
    'Inspired by ancient solar iconography found on temple stonework, reinterpreted into a modern raw-edge ring. Made to be worn every single day without waiting for a festive calendar invite.',
    'Stack with minimal bands or wear alone as a thumb statement piece with casual oversized linen shirts.',
    24,
    1,
    '/images/ring_sculptural.jpg',
    '["/images/ring_sculptural.jpg", "/images/hero_banner.jpg"]'::jsonb,
    '[{"id": "v1", "name": "Adjustable Standard (Sizes 12-18)", "stock": 24}]'::jsonb,
    1,
    1
),
(
    'prod-2',
    'Dharini Architectural Drop Earrings',
    'dharini-architectural-drop-earrings',
    'Intricate tribal filigree meeting bold geometric grace',
    580,
    750,
    'Earrings',
    'Handcrafted Oxidised Silver Tone Metal with Ruby Glass Cabochons',
    'Antique Patina & Dark Red Ruby Inlays',
    'Length: 7.2 cm | Width: 3.4 cm | Weight: 18g (Balanced for all-day comfort)',
    'Keep away from chlorinated water and lotions. Handle small bell chimes gently when storing in the signature cloth bag.',
    'Challenging the notion that chandelier earrings belong strictly to bridal trousseaus. The Dharini drops are lightweight statement pieces engineered for high-impact styling from morning lectures to evening soirees.',
    'Pair with an understated charcoal turtleneck or an unbuttoned dark khadi kurta.',
    18,
    1,
    '/images/earrings_sculptural.jpg',
    '["/images/earrings_sculptural.jpg"]'::jsonb,
    '[{"id": "v1", "name": "Oxidised Silver with Ruby Accent", "stock": 18}]'::jsonb,
    1,
    1
),
(
    'prod-3',
    'Karan Tribal Engraved Cuff',
    'karan-tribal-engraved-cuff',
    'Heirloom totems carved into contemporary armour',
    649,
    799,
    'Cuffs & Kadas',
    'Dense Cast German Silver with Deep Acid Etching',
    'Matte Antique Smoked Silver with Carved Reliefs',
    'Internal Diameter: 6.2 cm (Malleable open cuff fits wrists 6.0 to 7.8 inches)',
    'Gently squeeze or widen at the base to fit your wrist snugly. Clean occasionally with dry baking soda for natural lustre restoration.',
    'A gender-inclusive adornment piece inspired by nomadic tribal wristwear of the Thar desert. Strong, tactile, and designed to age gracefully alongside your own story.',
    'Looks commanding worn right above a wrist watch or on an otherwise bare arm with a rolled-up black sleeve.',
    15,
    1,
    '/images/cuff_bracelet.jpg',
    '["/images/cuff_bracelet.jpg"]'::jsonb,
    '[{"id": "v1", "name": "Standard Malleable Fit (Unisex)", "stock": 15}]'::jsonb,
    1,
    0
),
(
    'prod-4',
    'Nirva Asymmetric Hasli Choker',
    'nirva-asymmetric-hasli-choker',
    'A sweeping collar of sculptured silver and garnet accents',
    720,
    899,
    'Necklaces & Haslis',
    'Structured Rigid Copper-Silver Alloy with Garnet Red Stones',
    'Dual-tone Oxidised & Satin Brushed Charcoal',
    'Inner Circumference: 38 cm | Collar Width: 2.2 cm at focal apex',
    'Store flat in the provided case. Do not bend excessively at the central curve.',
    'The traditional Indian hasli reimagined as modern sculptural architecture. By breaking symmetry and tapering the collar into an off-centre crescent, Nirva frames the collarbone with effortless drama.',
    'Ideal with deep V-necks, bandhgala jackets, or layered with delicate oxidized chains.',
    12,
    1,
    '/images/hasli_choker.jpg',
    '["/images/hasli_choker.jpg", "/images/hero_banner.jpg"]'::jsonb,
    '[{"id": "v1", "name": "Asymmetric Torque Choker (Free Size)", "stock": 12}]'::jsonb,
    1,
    1
),
(
    'prod-5',
    'Agni Prateek Stud Earrings',
    'agni-prateek-stud-earrings',
    'Geometric flame studs for subtle everyday intensity',
    299,
    399,
    'Earrings',
    'Hypoallergenic Oxidised Metal with Sterling Silver Posts',
    'Smoked Silver with Textured Ridges',
    'Diameter: 1.8 cm | Weight: 4g per pair',
    'Remove before showering and swimming. Store dry.',
    'For those days when you crave the character of Indian adornment without the weight. Tiny sculptural fire-motifs that elevate the simplest jeans-and-tee routine.',
    'Great as first or second ear piercings stacked together.',
    35,
    1,
    '/images/ring_sculptural.jpg',
    '["/images/ring_sculptural.jpg"]'::jsonb,
    '[{"id": "v1", "name": "One Size Pair (Smoked Silver)", "stock": 35}]'::jsonb,
    0,
    1
),
(
    'prod-6',
    'Viraat Oxidised Midi Rings Set',
    'viraat-oxidised-midi-rings-set',
    'A quartet of tactile stackable bands and midi accents',
    399,
    520,
    'Rings',
    'Cast Metal with Hand-Stamped Tribal Runes',
    'Oxidised Charcoal Patina',
    'Set of 4 rings: 2 Regular (Sizes 14, 16) + 2 Knuckle/Midi (Sizes 8, 10)',
    'Wipe clean after daily wear. Avoid sanitizers directly on rings.',
    'Designed for effortless self-expression. Spread them across multiple fingers or stack them on one for dramatic rhythm.',
    'Wear across index and ring fingers on both hands.',
    20,
    1,
    '/images/cuff_bracelet.jpg',
    '["/images/cuff_bracelet.jpg"]'::jsonb,
    '[{"id": "v1", "name": "Set of 4 Rings (Mixed Sizes)", "stock": 20}]'::jsonb,
    0,
    0
)
ON CONFLICT (id) DO NOTHING;

-- Initial Site Content
INSERT INTO site_content (section_key, title, subtitle, body_text, data_json)
VALUES 
(
    'hero',
    'Indian Adornment, Reimagined.',
    'Challenging the idea that expressive Indian jewellery belongs only to weddings and special occasions. Handcrafted statement pieces, sculptural forms, and oxidised silver aesthetics created for everyday self-expression.',
    'Contemporary Indian Adornment',
    '{"badge": "Contemporary Indian Adornment", "tagline": "Adorn the Unordinary.", "ctaPrimary": "Explore Collection", "ctaSecondary": "Meet the Founder"}'::jsonb
),
(
    'announcement',
    'Store Announcement Bar',
    '',
    '',
    '{"text": "✨ Free standard shipping across India on orders above ₹499 | Handcrafted oxidised collections", "enabled": true}'::jsonb
),
(
    'philosophy',
    'Brand Manifesto',
    'Jewellery is not just something you wear for an occasion. It is a way of expressing who you are.',
    '— AROHVI Brand Manifesto · Tulsi Prakash',
    '{"quote": "Jewellery is not just something you wear for an occasion. It is a way of expressing who you are.", "statement1_title": "Tradition, Without the Rules", "statement1_desc": "We bring cultural inspiration together with contemporary fashion. Wear it to college, work, evening strolls, or quiet ordinary days.", "statement2_title": "Accessible Self-Expression", "statement2_desc": "Everyday luxury shouldn''t cost a fortune. Our pieces are thoughtfully priced between ₹100 and ₹800 without compromising on tactile quality.", "statement3_title": "Dark Indian Maximalism", "statement3_desc": "Bold sculptural forms, deep obsidian charcoal, dramatic oxidized silver, and hints of rich ruby burgundy."}'::jsonb
),
(
    'founderStory',
    'Tulsi Prakash',
    'Founder & Creative Director',
    'Why should people save the things they love for someday?',
    '{"founderName": "Tulsi Prakash", "role": "Founder & Creative Director", "title": "Why should people save the things they love for someday?", "quote": "Wear what makes you, you.", "image_url": "/images/founder_tulsi.jpg", "paragraphs": ["I grew up watching the most breathtaking Indian jewellery locked away inside heavy steel almirahs, brought out only twice a year for weddings or Diwali poojas. The rest of the year, we settled for mundane, lifeless accessories.", "AROHVI began with a very clear, stubborn question: why can''t we wear evocative, sculptural Indian adornment on a Tuesday afternoon? To college? To an art show? On a solitary coffee run?", "AROHVI isn''t a generic jewellery shop or an inaccessible bridal house. It is a sanctuary for people who treat personal style as an ongoing creative act. Each piece is designed to be lived in, experimented with, and cherished on the most ordinary of days.", "Thank you for being here and adorning the unordinary with us."]}'::jsonb
),
(
    'policies',
    'Store Policies & Fulfillment',
    '',
    '',
    '{"shipping": "We ship all across India via reputed express couriers (Bluedart, Delhivery, DTDC). Standard dispatch within 24-48 business hours. Delivery takes 3-5 working days.", "returns": "We offer a 7-day hassle-free replacement policy if your piece arrives damaged or with any transit issue. Simply WhatsApp or email our care team.", "careGuide": "All AROHVI pieces are made with oxidised alloys. Keep away from harsh chemicals, perfumes, and water. Store in our signature cloth pouch."}'::jsonb
),
(
    'settings',
    'Store Operational Settings',
    '',
    '',
    '{"freeShippingThreshold": 499, "standardShippingFee": 49, "supportEmail": "care@arohvi.in", "supportPhone": "+91 98201 45892", "storeAddress": "AROHVI Design Studio, Bangalore, India"}'::jsonb
)
ON CONFLICT (section_key) DO NOTHING;
