-- =============================================================
-- Migration : Ajout des pôles thématiques
-- À exécuter sur la base de données existante
-- =============================================================

BEGIN;

-- Créer la table poles si elle n'existe pas
CREATE TABLE IF NOT EXISTS poles (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,
    slug                VARCHAR(100) UNIQUE NOT NULL,
    emoji               VARCHAR(10),
    minimum_percentage  INTEGER NOT NULL DEFAULT 3
);

-- Seed des 8 pôles
INSERT INTO poles (id, name, slug, emoji, minimum_percentage) VALUES
    (1, 'Éducation & Savoir',         'education-savoir',        '🎓', 3),
    (2, 'Santé & Solidarité',         'sante-solidarite',        '🏥', 3),
    (3, 'Sécurité & Justice',         'securite-justice',        '🛡️', 3),
    (4, 'Économie & Finances',        'economie-finances',       '💰', 3),
    (5, 'Environnement & Territoire', 'environnement-territoire','🌱', 3),
    (6, 'International & Europe',     'international-europe',    '🌍', 3),
    (7, 'Sport & Vie citoyenne',      'sport-citoyenne',         '🏃', 3),
    (8, 'Institutions & État',        'institutions-etat',       '🏛️', 3)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    emoji = EXCLUDED.emoji,
    minimum_percentage = EXCLUDED.minimum_percentage;

SELECT setval('poles_id_seq', 8);

-- Ajouter pole_id aux ministères
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ministeres' AND column_name = 'pole_id') THEN
    ALTER TABLE ministeres ADD COLUMN pole_id INTEGER REFERENCES poles(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ministeres_pole_id ON ministeres (pole_id);

-- Ajouter les 3 nouveaux ministères du pôle Institutions & État
INSERT INTO ministeres (id, name, slug, minimum_percentage) VALUES
    (21, 'Services du Premier ministre', 'premier-ministre', 0),
    (22, 'Parlement',                    'parlement',        0),
    (23, 'Conseil d''État',              'conseil-etat',     0)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    minimum_percentage = EXCLUDED.minimum_percentage;

SELECT setval('ministeres_id_seq', 23);

-- Passer tous les minimums ministère à 0 (gestion au niveau pôle)
UPDATE ministeres SET minimum_percentage = 0;

-- Rattacher chaque ministère à son pôle
UPDATE ministeres SET pole_id = 1 WHERE slug IN ('education-nationale', 'enseignement-superieur', 'culture');
UPDATE ministeres SET pole_id = 2 WHERE slug IN ('sante-prevention', 'travail-emploi', 'cohesion-territoires');
UPDATE ministeres SET pole_id = 3 WHERE slug IN ('defense', 'interieur', 'justice');
UPDATE ministeres SET pole_id = 4 WHERE slug IN ('economie-finances', 'numerique', 'fonction-publique');
UPDATE ministeres SET pole_id = 5 WHERE slug IN ('transition-ecologique', 'logement', 'transports', 'agriculture');
UPDATE ministeres SET pole_id = 6 WHERE slug IN ('affaires-etrangeres', 'outre-mer');
UPDATE ministeres SET pole_id = 7 WHERE slug IN ('sport', 'anciens-combattants');
UPDATE ministeres SET pole_id = 8 WHERE slug IN ('premier-ministre', 'parlement', 'conseil-etat');

COMMIT;
