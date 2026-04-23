BEGIN;

-- ÉTAPE 1 — Archivage
CREATE TABLE IF NOT EXISTS allocations_archive AS SELECT * FROM allocations;
CREATE TABLE IF NOT EXISTS allocations_detail_archive AS SELECT * FROM allocations_detail;

DO $$
DECLARE orig_alloc INT; arch_alloc INT; orig_det INT; arch_det INT;
BEGIN
  SELECT COUNT(*) INTO orig_alloc FROM allocations;
  SELECT COUNT(*) INTO arch_alloc FROM allocations_archive;
  SELECT COUNT(*) INTO orig_det FROM allocations_detail;
  SELECT COUNT(*) INTO arch_det FROM allocations_detail_archive;
  RAISE NOTICE 'Archive allocations: % -> %', orig_alloc, arch_alloc;
  RAISE NOTICE 'Archive detail: % -> %', orig_det, arch_det;
  IF orig_alloc != arch_alloc OR orig_det != arch_det THEN
    RAISE EXCEPTION 'ARCHIVE INCOMPLETE';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'allocations' AND column_name = 'structure_version') THEN
    ALTER TABLE allocations ADD COLUMN structure_version INTEGER NOT NULL DEFAULT 1;
  END IF;
END $$;

UPDATE allocations SET structure_version = 1 WHERE structure_version IS NULL;

-- ÉTAPE 2 — 17 pôles
UPDATE poles SET name = 'Enseignement scolaire',               slug = 'enseignement-scolaire',           emoji = '🎓' WHERE id = 1;
UPDATE poles SET name = 'Recherche et enseignement supérieur',  slug = 'recherche-enseignement-superieur', emoji = '🔬' WHERE id = 2;
UPDATE poles SET name = 'Défense',                             slug = 'defense',                          emoji = '🛡️' WHERE id = 3;
UPDATE poles SET name = 'Sécurités et justice',                slug = 'securites-justice',                emoji = '⚖️' WHERE id = 4;
UPDATE poles SET name = 'Santé',                               slug = 'sante',                            emoji = '🏥' WHERE id = 5;
UPDATE poles SET name = 'Solidarité et insertion',             slug = 'solidarite-insertion',             emoji = '🤝' WHERE id = 6;
UPDATE poles SET name = 'Travail et emploi',                   slug = 'travail-emploi',                   emoji = '💼' WHERE id = 7;
UPDATE poles SET name = 'Logement et territoires',             slug = 'logement-territoires',             emoji = '🏠' WHERE id = 8;

INSERT INTO poles (id, name, slug, emoji, minimum_percentage) VALUES
    ( 9, 'Écologie et agriculture',              'ecologie-agriculture',          '🌱', 1),
    (10, 'Économie et finances publiques',        'economie-finances-publiques',   '💰', 1),
    (11, 'Culture et médias',                     'culture-medias',                '🎭', 1),
    (12, 'Action internationale',                 'action-internationale',         '🌍', 1),
    (13, 'Outre-mer',                             'outre-mer-pole',               '🏝️', 1),
    (14, 'Immigration et intégration',            'immigration-integration',       '🛂', 1),
    (15, 'Investissement et innovation',          'investissement-innovation',     '🚀', 1),
    (16, 'Sport, jeunesse et mémoire nationale',  'sport-jeunesse-memoire',        '🏅', 1),
    (17, 'Institutions et gouvernance',           'institutions-gouvernance',      '🏛️', 1)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, slug = EXCLUDED.slug, emoji = EXCLUDED.emoji, minimum_percentage = EXCLUDED.minimum_percentage;

SELECT setval('poles_id_seq', 17);
UPDATE poles SET minimum_percentage = 1;

DO $$
DECLARE cnt INT;
BEGIN
  SELECT COUNT(*) INTO cnt FROM poles;
  IF cnt != 17 THEN RAISE EXCEPTION 'POLES: % au lieu de 17', cnt; END IF;
  RAISE NOTICE 'OK: 17 poles';
END $$;

-- ÉTAPE 3 — Nouveaux ministères
INSERT INTO ministeres (id, name, slug, minimum_percentage) VALUES
    (24, 'Immigration, asile et intégration',                  'immigration-asile-integration',        0),
    (25, 'Investir pour la France de 2030',                    'investir-france-2030',                 0),
    (26, 'Administration générale et territoriale de l''État',  'administration-generale-territoriale',  0),
    (27, 'Relations avec les collectivités territoriales',      'relations-collectivites',              0),
    (28, 'Médias, livre et industries culturelles',            'medias-livre-industries-culturelles',   0),
    (29, 'Audiovisuel public',                                 'audiovisuel-public',                   0),
    (30, 'Solidarité, insertion et égalité des chances',       'solidarite-insertion-egalite',          0)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, minimum_percentage = EXCLUDED.minimum_percentage;

SELECT setval('ministeres_id_seq', 30);

-- Réaffectation complète
UPDATE ministeres SET pole_id = 1  WHERE id = 1;
UPDATE ministeres SET pole_id = 2  WHERE id = 9;
UPDATE ministeres SET pole_id = 3  WHERE id = 3;
UPDATE ministeres SET pole_id = 4  WHERE id = 5;
UPDATE ministeres SET pole_id = 4  WHERE id = 6;
UPDATE ministeres SET pole_id = 5  WHERE id = 4;
UPDATE ministeres SET pole_id = 6  WHERE id = 30;
UPDATE ministeres SET pole_id = 7  WHERE id = 7;
UPDATE ministeres SET pole_id = 8  WHERE id = 11;
UPDATE ministeres SET pole_id = 8  WHERE id = 17;
UPDATE ministeres SET pole_id = 9  WHERE id = 8;
UPDATE ministeres SET pole_id = 9  WHERE id = 10;
UPDATE ministeres SET pole_id = 9  WHERE id = 12;
UPDATE ministeres SET pole_id = 10 WHERE id = 2;
UPDATE ministeres SET pole_id = 10 WHERE id = 18;
UPDATE ministeres SET pole_id = 10 WHERE id = 19;
UPDATE ministeres SET pole_id = 11 WHERE id = 13;
UPDATE ministeres SET pole_id = 11 WHERE id = 28;
UPDATE ministeres SET pole_id = 11 WHERE id = 29;
UPDATE ministeres SET pole_id = 12 WHERE id = 15;
UPDATE ministeres SET pole_id = 13 WHERE id = 16;
UPDATE ministeres SET pole_id = 14 WHERE id = 24;
UPDATE ministeres SET pole_id = 15 WHERE id = 25;
UPDATE ministeres SET pole_id = 16 WHERE id = 14;
UPDATE ministeres SET pole_id = 16 WHERE id = 20;
UPDATE ministeres SET pole_id = 17 WHERE id = 21;
UPDATE ministeres SET pole_id = 17 WHERE id = 22;
UPDATE ministeres SET pole_id = 17 WHERE id = 23;
UPDATE ministeres SET pole_id = 17 WHERE id = 26;
UPDATE ministeres SET pole_id = 17 WHERE id = 27;

-- Vérifications finales
DO $$
DECLARE orphans INT; empty_poles INT;
BEGIN
  SELECT COUNT(*) INTO orphans FROM ministeres WHERE pole_id IS NULL;
  IF orphans > 0 THEN RAISE EXCEPTION '% ministere(s) sans pole', orphans; END IF;
  SELECT COUNT(*) INTO empty_poles FROM poles p WHERE NOT EXISTS (SELECT 1 FROM ministeres m WHERE m.pole_id = p.id);
  IF empty_poles > 0 THEN RAISE EXCEPTION '% pole(s) sans ministere', empty_poles; END IF;
  RAISE NOTICE 'OK: tous les ministeres ont un pole, tous les poles ont des ministeres';
END $$;

SELECT p.id AS pole_id, p.emoji, p.name AS pole_name, m.id AS ministere_id, m.name AS ministere_name
FROM poles p LEFT JOIN ministeres m ON m.pole_id = p.id ORDER BY p.id, m.id;

COMMIT;
