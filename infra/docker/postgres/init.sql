-- NUHIRIS PostgreSQL initialization
-- This runs on first container start only.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create a read-only audit role (used after migrations create the tables)
-- The app role (nuhiris_app) is already created by POSTGRES_USER env var.
-- After migrations, run the revoke script to lock down audit tables.
