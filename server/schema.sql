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
    total_amount      NUMERIC(12,2) NOT NULL,
    structure_version INTEGER NOT NULL DEFAULT 2,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
-- Table des pôles thématiques (8 pôles)
-- Chaque pôle regroupe plusieurs ministères, minimum 3% par pôle
-- =============================================================

CREATE TABLE IF NOT EXISTS poles (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,
    slug                VARCHAR(100) UNIQUE NOT NULL,
    emoji               VARCHAR(10),
    minimum_percentage  INTEGER NOT NULL DEFAULT 3
);

CREATE INDEX IF NOT EXISTS idx_poles_slug ON poles (slug);

-- =============================================================
-- Seed : 8 pôles thématiques
-- =============================================================

INSERT INTO poles (id, name, slug, emoji, minimum_percentage) VALUES
    ( 1, 'Enseignement scolaire',                    'enseignement-scolaire',            '🎓', 1),
    ( 2, 'Recherche et enseignement supérieur',      'recherche-enseignement-superieur',  '🔬', 1),
    ( 3, 'Défense',                                  'defense',                           '🛡️', 1),
    ( 4, 'Sécurités et justice',                     'securites-justice',                 '⚖️', 1),
    ( 5, 'Santé',                                    'sante',                             '🏥', 1),
    ( 6, 'Solidarité et insertion',                  'solidarite-insertion',              '🤝', 1),
    ( 7, 'Travail et emploi',                        'travail-emploi',                    '💼', 1),
    ( 8, 'Logement et territoires',                  'logement-territoires',              '🏠', 1),
    ( 9, 'Écologie et agriculture',                  'ecologie-agriculture',              '🌱', 1),
    (10, 'Économie et finances publiques',           'economie-finances-publiques',       '💰', 1),
    (11, 'Culture et médias',                        'culture-medias',                    '🎭', 1),
    (12, 'Action internationale',                    'action-internationale',             '🌍', 1),
    (13, 'Outre-mer',                                'outre-mer-pole',                    '🏝️', 1),
    (14, 'Immigration et intégration',               'immigration-integration',           '🛂', 1),
    (15, 'Investissement et innovation',             'investissement-innovation',         '🚀', 1),
    (16, 'Sport, jeunesse et mémoire nationale',     'sport-jeunesse-memoire',            '🏅', 1),
    (17, 'Institutions et gouvernance',              'institutions-gouvernance',          '🏛️', 1)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    emoji = EXCLUDED.emoji,
    minimum_percentage = EXCLUDED.minimum_percentage;

SELECT setval('poles_id_seq', 17);

-- =============================================================
-- Seed : 20 ministères rattachés à leur pôle
-- minimum_percentage est maintenant à 0 (le minimum est géré au niveau pôle)
-- =============================================================

INSERT INTO ministeres (id, name, slug, minimum_percentage) VALUES
    (1,  'Enseignement scolaire',                                      'enseignement-scolaire',              0),
    (2,  'Économie',                                                   'economie',                           0),
    (3,  'Défense',                                                    'defense',                            0),
    (4,  'Santé',                                                      'sante',                              0),
    (5,  'Sécurités',                                                  'securites',                          0),
    (6,  'Justice',                                                    'justice',                            0),
    (7,  'Travail et emploi',                                          'travail-emploi',                     0),
    (8,  'Écologie, développement et mobilité durables',               'ecologie-mobilite-durables',         0),
    (9,  'Recherche et enseignement supérieur',                        'recherche-enseignement-superieur',   0),
    (10, 'Agriculture, alimentation, forêt et affaires rurales',       'agriculture-alimentation-foret',     0),
    (11, 'Logement',                                                   'logement',                           0),
    (12, 'Transports',                                                 'transports',                         0),
    (13, 'Culture',                                                    'culture',                            0),
    (14, 'Sport, jeunesse et vie associative',                         'sport-jeunesse-vie-associative',     0),
    (15, 'Action extérieure de l''État',                                'action-exterieure-etat',             0),
    (16, 'Outre-mer',                                                  'outre-mer',                          0),
    (17, 'Cohésion des territoires',                                   'cohesion-territoires',               0),
    (18, 'Transformation et fonction publiques',                       'transformation-fonction-publiques',  0),
    (19, 'Économie numérique',                                         'economie-numerique',                 0),
    (20, 'Anciens combattants, mémoire et liens avec la Nation',       'anciens-combattants-memoire',        0),
    (21, 'Direction de l''action du Gouvernement',                      'direction-action-gouvernement',      0),
    (22, 'Pouvoirs publics',                                           'pouvoirs-publics',                   0),
    (23, 'Conseil et contrôle de l''État',                              'conseil-controle-etat',              0)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    minimum_percentage = EXCLUDED.minimum_percentage;

-- Reset de la séquence après insertion avec IDs explicites
SELECT setval('ministeres_id_seq', 23);

-- Ajout colonne pole_id si elle n'existe pas encore
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ministeres' AND column_name = 'pole_id') THEN
    ALTER TABLE ministeres ADD COLUMN pole_id INTEGER REFERENCES poles(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ministeres_pole_id ON ministeres (pole_id);

-- Rattachement des ministères à leur pôle
UPDATE ministeres SET pole_id = 1 WHERE slug IN ('enseignement-scolaire', 'recherche-enseignement-superieur', 'culture');
UPDATE ministeres SET pole_id = 2 WHERE slug IN ('sante', 'travail-emploi', 'cohesion-territoires');
UPDATE ministeres SET pole_id = 3 WHERE slug IN ('defense', 'securites', 'justice');
UPDATE ministeres SET pole_id = 4 WHERE slug IN ('economie', 'economie-numerique', 'transformation-fonction-publiques');
UPDATE ministeres SET pole_id = 5 WHERE slug IN ('ecologie-mobilite-durables', 'logement', 'transports', 'agriculture-alimentation-foret');
UPDATE ministeres SET pole_id = 6 WHERE slug IN ('action-exterieure-etat', 'outre-mer');
UPDATE ministeres SET pole_id = 7 WHERE slug IN ('sport-jeunesse-vie-associative', 'anciens-combattants-memoire');
UPDATE ministeres SET pole_id = 8 WHERE slug IN ('direction-action-gouvernement', 'pouvoirs-publics', 'conseil-controle-etat');

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
