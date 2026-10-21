# AROHVI Database Architecture

## Structure
- `schema.sql`: Canonical relational SQL schema compatible with PostgreSQL / Supabase / SQLite.
- `seedData.js`: Default catalog data, brand philosophy, authentic Tulsi Prakash founder story, and orders.
- `db.js`: Database engine interface providing transactional CRUD, real-time inventory decrement, order generation, and analytics calculation.
- `arohvi_store.json`: Persistent database state file.

## Schema Details
- **products**: Catalog items with pricing (₹100–₹800), materials (oxidised silver alloys, brass), dimensions, care guidelines, and design stories.
- **orders**: Customer purchase transactions with shipping info, items, totals, India payment options, and courier fulfillment tracking numbers.
- **site_content**: Dynamic brand copy, banner headlines, founder Tulsi Prakash's story, and shipping rules.

## Production Supabase / PostgreSQL Migration
To switch from local engine to Supabase / PostgreSQL:
1. Run `schema.sql` inside your Supabase SQL editor or Postgres DB.
2. In `.env`, provide `DATABASE_URL=postgresql://postgres:...`
3. The clean data layer in `db.js` maps 1-to-1 with PostgreSQL tables.
