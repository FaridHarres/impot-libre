-- =============================================================
-- Migration : Refonte 17 pôles — LFI 2024
-- Validée par le propriétaire le 23/04/2026
-- =============================================================
-- RÈGLES :
-- - Aucune suppression de données
-- - Archives créées avant modification
-- - structure_version pour séparer ancien/nouveau
-- =============================================================

BEGIN;

-- ─────────────────────────────────────────────────
-- ÉTAPE 1 — Archivage + structure_version
-- ─────────────────────────────────────────────────

-- 1a. Archiver les allocations existantes
CREATE TABLE IF NOT EXISTS allocations_archive AS SELECT * FROM allocations;
CREATE TABLE IF NOT EXISTS allocations_detail_archive AS SELECT * FROM allocations_detail;

-- Vérification
DO $$
DECLARE
  orig_alloc INT; arch_alloc INT;
  orig_det INT; arch_det INT;
BEGIN
  SELECT COUNT(*) INTO orig_alloc FROM allocations;
  SELECT COUNT(*) INTO arch_alloc FROM allocations_archive;
  SELECT COUNT(*) INTO orig_det FROM allocations_detail;
  SELECT COUNT(*) INTO arch_det FROM allocations_detail_archive;
  RAISE NOTICE 'Archive allocations: % → % (doit être égal)', orig_alloc, arch_alloc;
  RAISE NOTICE 'Archive detail: % → % (doit être égal)', orig_det, arch_det;
  IF orig_alloc != arch_alloc OR orig_det != arch_det THEN
    RAISE EXCEPTION 'ARCHIVE INCOMPLÈTE — MIGRATION ANNULÉE';
  END IF;
END $$;

-- 1b. Ajouter structure_version sur allocations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'allocations' AND column_name = 'structure_version') THEN
    ALTER TABLE allocations ADD COLUMN structure_version INTEGER NOT NULL DEFAULT 1;
  END IF;
END $$;

-- Toutes les anciennes allocations = version 1
UPDATE allocations SET structure_version = 1 WHERE structure_version IS NULL;

RAISE NOTICE '✅ Étape 1 terminée — Archives créées, structure_version ajoutée';

-- ─────────────────────────────────────────────────
-- ÉTAPE 2 — Mise à jour de la table poles (8 → 17)
-- ─────────────────────────────────────────────────

-- 2a. Mettre à jour les 8 pôles existants
UPDATE poles SET name = 'Enseignement scolaire',                slug = 'enseignement-scolaire',                emoji = '🎓' WHERE id = 1;
UPDATE poles SET name = 'Recherche et enseignement supérieur',  slug = 'recherche-enseignement-superieur',      emoji = '🔬' WHERE id = 2;
UPDATE poles SET name = 'Défense',                              slug = 'defense',                               emoji = '🛡️' WHERE id = 3;
UPDATE poles SET name = 'Sécurités et justice',                 slug = 'securites-justice',                     emoji = '⚖️' WHERE id = 4;
UPDATE poles SET name = 'Santé',                                slug = 'sante',                                 emoji = '🏥' WHERE id = 5;
UPDATE poles SET name = 'Solidarité et insertion',              slug = 'solidarite-insertion',                  emoji = '🤝' WHERE id = 6;
UPDATE poles SET name = 'Travail et emploi',                    slug = 'travail-emploi',                        emoji = '💼' WHERE id = 7;
UPDATE poles SET name = 'Logement et territoires',              slug = 'logement-territoires',                  emoji = '🏠' WHERE id = 8;

-- 2b. Insérer les 9 nouveaux pôles
INSERT INTO poles (id, name, slug, emoji, minimum_percentage) VALUES
    ( 9, 'Écologie et agriculture',               'ecologie-agriculture',               '🌱', 1),
    (10, 'Économie et finances publiques',         'economie-finances-publiques',        '💰', 1),
    (11, 'Culture et médias',                      'culture-medias',                     '🎭', 1),
    (12, 'Action internationale',                  'action-internationale',              '🌍', 1),
    (13, 'Outre-mer',                              'outre-mer',                          '🏝️', 1),
    (14, 'Immigration et intégration',             'immigration-integration',            '🛂', 1),
    (15, 'Investissement et innovation',           'investissement-innovation',          '🚀', 1),
    (16, 'Sport, jeunesse et mémoire nationale',   'sport-jeunesse-memoire',             '🏅', 1),
    (17, 'Institutions et gouvernance',            'institutions-gouvernance',           '🏛️', 1)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    emoji = EXCLUDED.emoji,
    minimum_percentage = EXCLUDED.minimum_percentage;

SELECT setval('poles_id_seq', 17);

-- Passer minimum_percentage à 1% pour les anciens pôles aussi (17 pôles × 3% = 51% déjà pris, trop)
UPDATE poles SET minimum_percentage = 1;

-- Vérification
DO $$
DECLARE cnt INT;
BEGIN
  SELECT COUNT(*) INTO cnt FROM poles;
  RAISE NOTICE 'Nombre de pôles: % (doit être 17)', cnt;
  IF cnt != 17 THEN
    RAISE EXCEPTION 'NOMBRE DE PÔLES INCORRECT — MIGRATION ANNULÉE';
  END IF;
END $$;

RAISE NOTICE '✅ Étape 2 terminée — 17 pôles en base';

-- ─────────────────────────────────────────────────
-- ÉTAPE 3 — Réaffectation des ministères aux pôles
-- ─────────────────────────────────────────────────

-- D'abord, ajouter les ministères manquants pour les nouveaux pôles
-- (missions qui n'avaient pas d'entrée dédiée)

-- Vérifier la plus haute ID existante
DO $$
DECLARE max_id INT;
BEGIN
  SELECT MAX(id) INTO max_id FROM ministeres;
  RAISE NOTICE 'Plus haute ID ministère actuelle: %', max_id;
END $$;

-- Insérer les missions manquantes (IDs 24+)
INSERT INTO ministeres (id, name, slug, minimum_percentage) VALUES
    (24, 'Immigration, asile et intégration',                      'immigration-asile-integration',       0),
    (25, 'Investir pour la France de 2030',                        'investir-france-2030',                0),
    (26, 'Administration générale et territoriale de l''État',      'administration-generale-territoriale', 0),
    (27, 'Relations avec les collectivités territoriales',          'relations-collectivites',             0),
    (28, 'Médias, livre et industries culturelles',                'medias-livre-industries-culturelles',  0),
    (29, 'Audiovisuel public',                                     'audiovisuel-public',                  0)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    minimum_percentage = EXCLUDED.minimum_percentage;

SELECT setval('ministeres_id_seq', 29);

-- Maintenant réaffecter TOUS les ministères à leur nouveau pôle
-- Pôle 1 : Enseignement scolaire
UPDATE ministeres SET pole_id = 1 WHERE id = 1;  -- Enseignement scolaire

-- Pôle 2 : Recherche et enseignement supérieur
UPDATE ministeres SET pole_id = 2 WHERE id = 9;  -- Recherche et enseignement supérieur

-- Pôle 3 : Défense
UPDATE ministeres SET pole_id = 3 WHERE id = 3;  -- Défense

-- Pôle 4 : Sécurités et justice
UPDATE ministeres SET pole_id = 4 WHERE id IN (5, 6);  -- Sécurités + Justice

-- Pôle 5 : Santé
UPDATE ministeres SET pole_id = 5 WHERE id = 4;  -- Santé

-- Pôle 6 : Solidarité et insertion
UPDATE ministeres SET pole_id = 6 WHERE id IN (
    SELECT id FROM ministeres WHERE slug IN ('solidarite-insertion-egalite', 'sante')
);
-- Plus précisément par IDs connus :
-- La mission "Solidarité, insertion et égalité des chances" n'a pas d'entrée dédiée
-- Elle était couverte par les anciens ministères du pôle 2
-- Utilisons les IDs existants correspondants

-- Reprenons de manière claire par ministère ID :
-- ID 1  : Enseignement scolaire         → Pôle 1
-- ID 2  : Économie                       → Pôle 10
-- ID 3  : Défense                        → Pôle 3
-- ID 4  : Santé                          → Pôle 5
-- ID 5  : Sécurités                      → Pôle 4
-- ID 6  : Justice                        → Pôle 4
-- ID 7  : Travail et emploi              → Pôle 7
-- ID 8  : Écologie, dév. et mobilité     → Pôle 9
-- ID 9  : Recherche et ens. supérieur    → Pôle 2
-- ID 10 : Agriculture, alim., forêt      → Pôle 9
-- ID 11 : Logement                       → Pôle 8
-- ID 12 : Transports                     → Pôle 9
-- ID 13 : Culture                        → Pôle 11
-- ID 14 : Sport, jeunesse, vie asso.     → Pôle 16
-- ID 15 : Action ext. de l'État          → Pôle 12
-- ID 16 : Outre-mer                      → Pôle 13
-- ID 17 : Cohésion des territoires       → Pôle 8
-- ID 18 : Transf. et fonction publiques  → Pôle 10
-- ID 19 : Économie numérique             → Pôle 10
-- ID 20 : Anciens combattants, mémoire   → Pôle 16
-- ID 21 : Direction action Gouvernement  → Pôle 17
-- ID 22 : Pouvoirs publics               → Pôle 17
-- ID 23 : Conseil et contrôle de l'État  → Pôle 17
-- ID 24 : Immigration, asile, intégration→ Pôle 14
-- ID 25 : Investir France 2030           → Pôle 15
-- ID 26 : Admin. gén. et territoriale    → Pôle 17
-- ID 27 : Relations collectivités terr.  → Pôle 17
-- ID 28 : Médias, livre, ind. culturelles→ Pôle 11
-- ID 29 : Audiovisuel public             → Pôle 11

UPDATE ministeres SET pole_id = 1  WHERE id = 1;
UPDATE ministeres SET pole_id = 2  WHERE id = 9;
UPDATE ministeres SET pole_id = 3  WHERE id = 3;
UPDATE ministeres SET pole_id = 4  WHERE id IN (5, 6);
UPDATE ministeres SET pole_id = 5  WHERE id = 4;
UPDATE ministeres SET pole_id = 6  WHERE id = 7;  -- Note: Solidarité = Travail dans l'ancienne structure...

-- CORRECTION : Il n'y a pas de ministère dédié "Solidarité, insertion et égalité des chances"
-- dans l'ancienne base. C'est une mission budgétaire qui était couverte par le pôle 2.
-- On va ajouter cette mission comme nouveau ministère.

INSERT INTO ministeres (id, name, slug, minimum_percentage) VALUES
    (30, 'Solidarité, insertion et égalité des chances', 'solidarite-insertion-egalite', 0)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;

SELECT setval('ministeres_id_seq', 30);

-- Maintenant la réaffectation complète et définitive :
UPDATE ministeres SET pole_id = 1  WHERE id = 1;   -- Enseignement scolaire
UPDATE ministeres SET pole_id = 2  WHERE id = 9;   -- Recherche et ens. supérieur
UPDATE ministeres SET pole_id = 3  WHERE id = 3;   -- Défense
UPDATE ministeres SET pole_id = 4  WHERE id = 5;   -- Sécurités
UPDATE ministeres SET pole_id = 4  WHERE id = 6;   -- Justice
UPDATE ministeres SET pole_id = 5  WHERE id = 4;   -- Santé
UPDATE ministeres SET pole_id = 6  WHERE id = 30;  -- Solidarité, insertion et égalité des chances
UPDATE ministeres SET pole_id = 7  WHERE id = 7;   -- Travail et emploi
UPDATE ministeres SET pole_id = 8  WHERE id = 11;  -- Logement
UPDATE ministeres SET pole_id = 8  WHERE id = 17;  -- Cohésion des territoires
UPDATE ministeres SET pole_id = 9  WHERE id = 8;   -- Écologie, dév. et mobilité durables
UPDATE ministeres SET pole_id = 9  WHERE id = 10;  -- Agriculture, alim., forêt
UPDATE ministeres SET pole_id = 9  WHERE id = 12;  -- Transports
UPDATE ministeres SET pole_id = 10 WHERE id = 2;   -- Économie
UPDATE ministeres SET pole_id = 10 WHERE id = 18;  -- Transformation et fonction publiques
UPDATE ministeres SET pole_id = 10 WHERE id = 19;  -- Économie numérique
UPDATE ministeres SET pole_id = 11 WHERE id = 13;  -- Culture
UPDATE ministeres SET pole_id = 11 WHERE id = 28;  -- Médias, livre et industries culturelles
UPDATE ministeres SET pole_id = 11 WHERE id = 29;  -- Audiovisuel public
UPDATE ministeres SET pole_id = 12 WHERE id = 15;  -- Action extérieure de l'État
UPDATE ministeres SET pole_id = 13 WHERE id = 16;  -- Outre-mer
UPDATE ministeres SET pole_id = 14 WHERE id = 24;  -- Immigration, asile et intégration
UPDATE ministeres SET pole_id = 15 WHERE id = 25;  -- Investir pour la France de 2030
UPDATE ministeres SET pole_id = 16 WHERE id = 14;  -- Sport, jeunesse et vie associative
UPDATE ministeres SET pole_id = 16 WHERE id = 20;  -- Anciens combattants, mémoire
UPDATE ministeres SET pole_id = 17 WHERE id = 21;  -- Direction de l'action du Gouvernement
UPDATE ministeres SET pole_id = 17 WHERE id = 22;  -- Pouvoirs publics
UPDATE ministeres SET pole_id = 17 WHERE id = 23;  -- Conseil et contrôle de l'État
UPDATE ministeres SET pole_id = 17 WHERE id = 26;  -- Administration générale et territoriale
UPDATE ministeres SET pole_id = 17 WHERE id = 27;  -- Relations avec les collectivités territoriales

-- Vérification : aucun ministère orphelin
DO $$
DECLARE orphans INT;
BEGIN
  SELECT COUNT(*) INTO orphans FROM ministeres WHERE pole_id IS NULL;
  IF orphans > 0 THEN
    RAISE EXCEPTION '⚠️ % ministère(s) sans pôle — MIGRATION ANNULÉE', orphans;
  END IF;
  RAISE NOTICE '✅ Tous les ministères ont un pôle rattaché';
END $$;

-- Vérification : chaque pôle a au moins 1 ministère
DO $$
DECLARE empty_poles INT;
BEGIN
  SELECT COUNT(*) INTO empty_poles FROM poles p
  WHERE NOT EXISTS (SELECT 1 FROM ministeres m WHERE m.pole_id = p.id);
  IF empty_poles > 0 THEN
    RAISE EXCEPTION '⚠️ % pôle(s) sans ministère — MIGRATION ANNULÉE', empty_poles;
  END IF;
  RAISE NOTICE '✅ Chaque pôle a au moins 1 ministère';
END $$;

-- Résultat final
SELECT p.id AS pole_id, p.emoji, p.name AS pole_name,
       m.id AS ministere_id, m.name AS ministere_name
FROM poles p
LEFT JOIN ministeres m ON m.pole_id = p.id
ORDER BY p.id, m.id;

RAISE NOTICE '✅✅✅ Migration 17 pôles terminée avec succès';

COMMIT;
