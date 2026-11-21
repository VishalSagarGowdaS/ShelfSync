-- ShopSphere schema (Aiven PostgreSQL)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS customers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  phone         TEXT CHECK (phone IS NULL OR phone ~ '^[6-9][0-9]{9}$'),
  role          TEXT NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'ADMIN')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS customers_email_lower_uq ON customers (lower(email));

CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL CHECK (char_length(name) BETWEEN 3 AND 200),
  description      TEXT NOT NULL,
  category_id      UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  image_url        TEXT NOT NULL,
  original_price   NUMERIC(12,2) NOT NULL CHECK (original_price > 0),
  selling_price    NUMERIC(12,2) NOT NULL CHECK (selling_price > 0),
  rating           NUMERIC(2,1) NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  rating_count     INTEGER NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  city             TEXT NOT NULL,
  sold_count       INTEGER NOT NULL DEFAULT 0 CHECK (sold_count >= 0),
  specifications   JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT selling_le_original CHECK (selling_price <= original_price)
);
CREATE INDEX IF NOT EXISTS products_category_idx ON products (category_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS products_created_idx ON products (created_at DESC);
CREATE INDEX IF NOT EXISTS products_sold_idx ON products (sold_count DESC);

-- Stock lives in its own table so reservations lock only inventory rows.
CREATE TABLE IF NOT EXISTS inventory (
  product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  stock      INTEGER NOT NULL CHECK (stock >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_changes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  delta       INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  reason      TEXT NOT NULL,
  order_id    UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS inventory_changes_created_idx ON inventory_changes (created_at DESC);

CREATE TABLE IF NOT EXISTS carts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id    UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cart_id, product_id)
);

CREATE TABLE IF NOT EXISTS addresses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label       TEXT NOT NULL DEFAULT 'Home',
  full_name   TEXT NOT NULL,
  phone       TEXT NOT NULL CHECK (phone ~ '^[6-9][0-9]{9}$'),
  line1       TEXT NOT NULL,
  city        TEXT NOT NULL,
  state       TEXT NOT NULL,
  pincode     TEXT NOT NULL CHECK (pincode ~ '^[1-9][0-9]{5}$'),
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS addresses_customer_idx ON addresses (customer_id);
CREATE UNIQUE INDEX IF NOT EXISTS addresses_one_default ON addresses (customer_id) WHERE is_default;

CREATE TABLE IF NOT EXISTS wishlists (
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (customer_id, product_id)
);

CREATE SEQUENCE IF NOT EXISTS order_number_seq START 100001;

CREATE TABLE IF NOT EXISTS orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number     TEXT NOT NULL UNIQUE DEFAULT ('SS-' || nextval('order_number_seq')),
  customer_id      UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  status           TEXT NOT NULL DEFAULT 'PENDING'
                   CHECK (status IN ('PENDING','CONFIRMED','REJECTED','PROCESSING','SHIPPED','DELIVERED','CANCELLED')),
  rejection_reason TEXT,
  full_name        TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT NOT NULL,
  address          TEXT NOT NULL,
  city             TEXT NOT NULL,
  state            TEXT NOT NULL,
  pincode          TEXT NOT NULL,
  payment_method   TEXT NOT NULL DEFAULT 'COD' CHECK (payment_method IN ('COD')),
  subtotal         NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  delivery_charge  NUMERIC(12,2) NOT NULL CHECK (delivery_charge >= 0),
  total            NUMERIC(12,2) NOT NULL CHECK (total >= 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_customer_idx ON orders (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders (created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  image_url    TEXT,
  unit_price   NUMERIC(12,2) NOT NULL CHECK (unit_price > 0),
  quantity     INTEGER NOT NULL CHECK (quantity > 0),
  line_total   NUMERIC(12,2) NOT NULL CHECK (line_total > 0)
);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id);
CREATE INDEX IF NOT EXISTS order_items_product_idx ON order_items (product_id);

CREATE TABLE IF NOT EXISTS order_status_history (
  id         BIGSERIAL PRIMARY KEY,
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status     TEXT NOT NULL,
  note       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS order_status_history_order_idx ON order_status_history (order_id, id);

-- Transactional outbox: written in the SAME transaction as the business change.
CREATE TABLE IF NOT EXISTS outbox_events (
  id           UUID PRIMARY KEY,
  topic        TEXT NOT NULL,
  message_key  TEXT NOT NULL,
  payload      JSONB NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  attempts     INTEGER NOT NULL DEFAULT 0,
  last_error   TEXT
);
CREATE INDEX IF NOT EXISTS outbox_unpublished_idx ON outbox_events (created_at) WHERE published_at IS NULL;

-- Idempotency for consumers: one row per (event, consumer group).
CREATE TABLE IF NOT EXISTS processed_events (
  event_id     UUID NOT NULL,
  consumer     TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, consumer)
);

CREATE TABLE IF NOT EXISTS worker_heartbeats (
  worker    TEXT PRIMARY KEY,
  status    TEXT NOT NULL,
  detail    TEXT NOT NULL DEFAULT '',
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sync_state (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
