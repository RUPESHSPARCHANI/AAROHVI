# AROHVI — Adorn the Unordinary
### Contemporary Indian Adornment & Fine Jewellery E-Commerce Platform

Designed around **Dark Indian Maximalism** and the brand vision of founder **Tulsi Prakash**.

---

## 🏛 Architecture & Folder Separation

The application is structured into isolated, independent tiers for easy maintenance and deployment:

```
aarohvi/
├── frontend/             # React + Vite client app (User Store & Manager Portal)
│   ├── public/images/    # High-resolution generated jewelry & founder assets
│   ├── src/
│   │   ├── api/          # REST API Client (client.js)
│   │   ├── components/   # CinematicSlideUpReveal, CartDrawer, CheckoutModal, etc.
│   │   ├── context/      # CartContext, ManagerContext
│   │   ├── pages/
│   │   │   ├── user/     # User-facing Storefront (UserHome.jsx)
│   │   │   └── manager/  # Manager Admin Portal (ManagerDashboard.jsx)
│   │   ├── styles/       # Dark Indian Maximalism design system (index.css)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/              # Node.js + Express REST API Server
│   ├── src/
│   │   ├── routes/       # products, orders, content, analytics, auth
│   │   └── server.js     # Express server entry point
│   ├── Dockerfile
│   └── .env.example
│
├── database/             # Database Layer
│   ├── schema.sql        # Standard SQL schema (Postgres / SQLite)
│   ├── seedData.js       # Verified Indian adornment products (₹100–₹800 range)
│   ├── db.js             # High-performance transactional DB engine
│   └── arohvi_store.json # Persistent data store
│
├── docker-compose.yml    # Full-stack Docker deployment orchestration
└── README.md
```

---

## ✨ Brand Specifications & Visual Identity

- **Aesthetic**: *Dark Indian Maximalism*
  - **Obsidian Charcoal**: `#121110`
  - **Secondary Charcoal**: `#1D1A18`
  - **Deep Burgundy**: `#481C25`
  - **Ruby Red**: `#8C2635`
  - **Warm Ivory**: `#F0E6DB`
  - **Muted Champagne**: `#C7A58A`
  - **Subtle Dark Borders**: `#39312D`
- **Typography**: Editorial Serif headlines (`Cormorant Garamond`, `Cinzel`) paired with crisp sans-serif (`Plus Jakarta Sans`).
- **Signature Interaction**: **Cinematic Slide-Up Product Reveal**
  - Selecting any product triggers a panel rising from the bottom like a hidden door opening to reveal a treasured object.
  - Background dims while the collection remains visible.
  - Features high-resolution photography, price (₹100–₹800), specifications, "The Story Behind the Piece", "Wear It Your Way", and purchase actions.

---

## 🚀 Running Locally

### 1. Start the Backend API Server
```bash
cd backend
npm install
npm start
# Server runs on http://localhost:5000
```

### 2. Start the Frontend Store & Manager
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

---

## 🐳 Docker Deployment

To launch the full stack with one command:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

---

## 🔐 Manager / Admin Credentials

- **Email / Username**: `tulsi@arohvi.in` (or `admin`)
- **Password**: `arohvi2026`
- **1-Click Demo**: Click the **Manager** button in the top navigation bar and select **"⚡ 1-Click Demo Login (Tulsi Prakash)"** for instant access!

### Manager Features
1. **Overview & Analytics**: Live revenue in INR, order counts, Average Order Value (AOV), low-stock alert monitoring.
2. **Products & Inventory**: Add new pieces (with prices ₹100–₹800, photos, materials, stories), edit prices & stocks, toggle in-stock status, and remove pieces.
3. **Orders & Fulfilment**: Filter orders by status (Confirmed, Shipped, Delivered), view shipping addresses, update fulfillment status, and add courier tracking AWB numbers (Bluedart, Delhivery).
4. **Founder Story & Banners**: Live editing of Tulsi Prakash's story manifesto, brand quotes, homepage hero messaging, and announcement bar.
5. **Shipping & Store Settings**: Configure pan-India free shipping thresholds and flat delivery fees.
