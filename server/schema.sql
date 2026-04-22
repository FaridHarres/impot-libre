-- =============================================================
-- Schéma de la base de données impot-libre.fr
-- Version 2.0 — Sécurité avancée (email verification + 2FA admin)
-- =============================================================

BEGIN;

-- Table des utilisateurs (enrichie)
CREATE TABLE IF NOT EXISTS users (
    id               SERIAL PRIMARY KEY,
    prenom           VARCHAR(100) NOT NULL DEFAULT '',
    nom              VARCHAR(100) NOT NULL DEFAULT '',
    email            VARCHAR(255) UNIQUE NOT NULL,
    password_hash    VARCHAR(255) NOT NULL,
    role             VARCHAR(20) NOT NULL DEFAULT 'user',     -- 'user' | 'admin'

    -- Vérification email
    email_verified   BOOLEAN NOT NULL DEFAULT FALSE,
    verify_token     VARCHAR(64),
    verify_expires   TIMESTAMPTZ,

    -- 2FA admin (OTP)
    otp_code         VARCHAR(6),
    otp_expires      TIMESTAMPTZ,
    otp_attempts     INTEGER NOT NULL DEFAULT 0,
    otp_locked_until TIMESTAMPTZ,

    -- Anti-doublon
    ip_hash          VARCHAR(64),
    fingerprint_hash VARCHAR(64),

    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_ip_fingerprint ON users (ip_hash, fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_verify_token ON users (verify_token);

-- Table des ministères — SOURCE DE VÉRITÉ UNIQUE
-- Les IDs numériques sont la clé de liaison front ↔ back
CREATE TABLE IF NOT EXISTS ministeres (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    slug                VARCHAR(255) UNIQUE NOT NULL,
    minimum_percentage  NUMERIC(5,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ministeres_slug ON ministeres (slug);

-- Table des allocations (en-tête)
CREATE TABLE IF NOT EXISTS allocations (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_amount NUMERIC(12,2) NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_allocations_user_id ON allocations (user_id);

-- Détail des allocations par ministère
CREATE TABLE IF NOT EXISTS allocations_detail (
    id             SERIAL PRIMARY KEY,
    allocation_id  INTEGER NOT NULL REFERENCES allocations(id) ON DELETE CASCADE,
    ministere_id   INTEGER NOT NULL REFERENCES ministeres(id) ON DELETE CASCADE,
    percentage     NUMERIC(5,2) NOT NULL,
    UNIQUE(allocation_id, ministere_id)
);

CREATE INDEX IF NOT EXISTS idx_allocations_detail_allocation ON allocations_detail (allocation_id);
CREATE INDEX IF NOT EXISTS idx_allocations_detail_ministere ON allocations_detail (ministere_id);

-- Newsletter
CREATE TABLE IF NOT EXISTS newsletter (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter (email);

-- Logs d'administration
CREATE TABLE IF NOT EXISTS admin_logs (
    id         SERIAL PRIMARY KEY,
    admin_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action     TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs (admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs (created_at DESC);

-- =============================================================
-- Seed : 20 ministères avec pourcentages minimaux (total = 72%)
-- Les IDs fixes (1-20) sont la clé de référence utilisée partout
-- =============================================================

INSERT INTO ministeres (id, name, slug, minimum_percentage) VALUES
    (1,  'Éducation nationale',                     'education-nationale',         8.00),
    (2,  'Économie et Finances',                    'economie-finances',           5.00),
    (3,  'Défense',                                 'defense',                     6.00),
    (4,  'Santé et Prévention',                     'sante-prevention',            7.00),
    (5,  'Intérieur',                               'interieur',                   6.00),
    (6,  'Justice',                                 'justice',                     5.00),
    (7,  'Travail et Emploi',                       'travail-emploi',              5.00),
    (8,  'Transition écologique',                   'transition-ecologique',       4.00),
    (9,  'Enseignement supérieur et Recherche',     'enseignement-superieur',      4.00),
    (10, 'Agriculture et Souveraineté alimentaire', 'agriculture',                 3.00),
    (11, 'Logement',                                'logement',                    3.00),
    (12, 'Transports',                              'transports',                  3.00),
    (13, 'Culture',                                 'culture',                     2.00),
    (14, 'Sport',                                   'sport',                       1.00),
    (15, 'Europe et Affaires étrangères',           'affaires-etrangeres',         2.00),
    (16, 'Outre-Mer',                               'outre-mer',                   2.00),
    (17, 'Cohésion des territoires',                'cohesion-territoires',        2.00),
    (18, 'Fonction publique',                       'fonction-publique',           2.00),
    (19, 'Numérique',                               'numerique',                   1.00),
    (20, 'Anciens combattants',                     'anciens-combattants',         1.00)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    minimum_percentage = EXCLUDED.minimum_percentage;

-- Reset de la séquence après insertion avec IDs explicites
SELECT setval('ministeres_id_seq', 20);

-- =============================================================
-- Migration : si la BDD existe déjà, ajouter les colonnes manquantes
-- (safe to run multiple times grâce à IF NOT EXISTS / DO NOTHING)
-- =============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'prenom') THEN
    ALTER TABLE users ADD COLUMN prenom VARCHAR(100) NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'nom') THEN
    ALTER TABLE users ADD COLUMN nom VARCHAR(100) NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified') THEN
    ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'verify_token') THEN
    ALTER TABLE users ADD COLUMN verify_token VARCHAR(64);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'verify_expires') THEN
    ALTER TABLE users ADD COLUMN verify_expires TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'otp_code') THEN
    ALTER TABLE users ADD COLUMN otp_code VARCHAR(6);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'otp_expires') THEN
    ALTER TABLE users ADD COLUMN otp_expires TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'otp_attempts') THEN
    ALTER TABLE users ADD COLUMN otp_attempts INTEGER NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'otp_locked_until') THEN
    ALTER TABLE users ADD COLUMN otp_locked_until TIMESTAMPTZ;
  END IF;
END $$;

-- Marquer les admins existants comme vérifiés
UPDATE users SET email_verified = TRUE WHERE role = 'admin' AND email_verified = FALSE;

COMMIT;
