-- =============================================================
-- Migration : Correction des intitulés officiels LFI 2024
-- Source : LOI n° 2023-1322 du 29 décembre 2023
-- À exécuter sur la base de données existante
-- =============================================================
-- RÈGLE : UPDATE uniquement, jamais de DELETE ni INSERT
-- Les IDs ne sont JAMAIS modifiés
-- =============================================================

BEGIN;

-- ─── Vérification préalable : compter les allocations_detail existantes ───
-- (à vérifier après migration pour s'assurer qu'aucune donnée n'est perdue)
DO $$
DECLARE
  count_before INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_before FROM allocations_detail;
  RAISE NOTICE 'Nombre allocations_detail AVANT migration : %', count_before;
END $$;

-- ─── Mise à jour des intitulés des ministères (missions budgétaires LFI 2024) ───

-- ID 1 : "Éducation nationale" → "Enseignement scolaire"
UPDATE ministeres SET name = 'Enseignement scolaire', slug = 'enseignement-scolaire'
WHERE id = 1;

-- ID 4 : "Santé et Prévention" → "Santé"
UPDATE ministeres SET name = 'Santé', slug = 'sante'
WHERE id = 4;

-- ID 5 : "Intérieur" → "Sécurités"
UPDATE ministeres SET name = 'Sécurités', slug = 'securites'
WHERE id = 5;

-- ID 7 : "Travail et Emploi" → "Travail et emploi" (casse officielle)
UPDATE ministeres SET name = 'Travail et emploi'
WHERE id = 7;

-- ID 8 : "Transition écologique" → "Écologie, développement et mobilité durables"
UPDATE ministeres SET name = 'Écologie, développement et mobilité durables', slug = 'ecologie-mobilite-durables'
WHERE id = 8;

-- ID 9 : "Enseignement supérieur et Recherche" → "Recherche et enseignement supérieur"
UPDATE ministeres SET name = 'Recherche et enseignement supérieur', slug = 'recherche-enseignement-superieur'
WHERE id = 9;

-- ID 10 : "Agriculture et Souveraineté alimentaire" → "Agriculture, alimentation, forêt et affaires rurales"
UPDATE ministeres SET name = 'Agriculture, alimentation, forêt et affaires rurales', slug = 'agriculture-alimentation-foret'
WHERE id = 10;

-- ID 14 : "Sport" → "Sport, jeunesse et vie associative"
UPDATE ministeres SET name = 'Sport, jeunesse et vie associative', slug = 'sport-jeunesse-vie-associative'
WHERE id = 14;

-- ID 15 : "Europe et Affaires étrangères" → "Action extérieure de l'État"
UPDATE ministeres SET name = 'Action extérieure de l''État', slug = 'action-exterieure-etat'
WHERE id = 15;

-- ID 17 : "Cohésion des territoires" → intitulé confirmé, OK
-- (pas de changement nécessaire)

-- ID 18 : "Fonction publique" → "Transformation et fonction publiques"
UPDATE ministeres SET name = 'Transformation et fonction publiques', slug = 'transformation-fonction-publiques'
WHERE id = 18;

-- ID 19 : "Numérique" → "Économie numérique" (renommé, pas supprimé)
-- Reste rattaché au pôle 4 (Économie & Finances)
-- Aucune allocation n'est perdue
UPDATE ministeres SET name = 'Économie numérique', slug = 'economie-numerique'
WHERE id = 19;

-- ID 20 : "Anciens combattants" → "Anciens combattants, mémoire et liens avec la Nation"
UPDATE ministeres SET name = 'Anciens combattants, mémoire et liens avec la Nation', slug = 'anciens-combattants-memoire'
WHERE id = 20;

-- ID 2 : "Économie et Finances" → "Économie" (intitulé mission LFI)
UPDATE ministeres SET name = 'Économie', slug = 'economie'
WHERE id = 2;

-- ─── Vérification post-migration ───

-- Vérifier que toutes les allocations_detail sont intactes
DO $$
DECLARE
  count_after INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_after FROM allocations_detail;
  RAISE NOTICE 'Nombre allocations_detail APRÈS migration : %', count_after;
END $$;

-- Vérifier que tous les ministères ont un pole_id
DO $$
DECLARE
  orphans INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphans FROM ministeres WHERE pole_id IS NULL;
  IF orphans > 0 THEN
    RAISE WARNING '⚠️  % ministère(s) sans pôle rattaché !', orphans;
  ELSE
    RAISE NOTICE '✅ Tous les ministères sont rattachés à un pôle.';
  END IF;
END $$;

-- Afficher le résultat final
SELECT m.id, m.name, m.slug, p.name AS pole
FROM ministeres m
LEFT JOIN poles p ON p.id = m.pole_id
ORDER BY m.id;

COMMIT;
