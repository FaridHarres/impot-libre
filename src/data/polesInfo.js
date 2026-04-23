/**
 * Fiches pédagogiques des 17 pôles thématiques — LFI 2024
 * Source : LOI n° 2023-1322 du 29 décembre 2023
 * Données vérifiées sur budget.gouv.fr et rapports du Sénat
 */
const polesInfo = {
  1: {
    nom: 'Enseignement scolaire',
    emoji: '🎓',
    budgetTotal: 63.6,
    sourceUrl: 'https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2024/le-projet-de-loi-de-finances-et-les-documents-annexes-pour-2024/budget-general-2024/enseignement-scolaire',
    descriptionCourte: 'Finance les écoles, collèges, lycées et les 860 000 enseignants.',
    missions: ['Enseignement scolaire'],
  },
  2: {
    nom: 'Recherche et enseignement supérieur',
    emoji: '🔬',
    budgetTotal: 31.8,
    sourceUrl: 'https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2024/le-projet-de-loi-de-finances-et-les-documents-annexes-pour-2024/budget-general-2024/recherche-et-enseignement-superieur',
    descriptionCourte: 'Finance les universités, la recherche scientifique et la vie étudiante.',
    missions: ['Recherche et enseignement supérieur'],
  },
  3: {
    nom: 'Défense',
    emoji: '🛡️',
    budgetTotal: 56.8,
    sourceUrl: 'https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2024/le-projet-de-loi-de-finances-et-les-documents-annexes-pour-2024/budget-general-2024/defense',
    descriptionCourte: 'Finance les armées, les équipements militaires et les opérations extérieures.',
    missions: ['Défense'],
  },
  4: {
    nom: 'Sécurités et justice',
    emoji: '⚖️',
    budgetTotal: 36.3,
    sourceUrl: 'https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2024/le-projet-de-loi-de-finances-et-les-documents-annexes-pour-2024/budget-general-2024/securites',
    descriptionCourte: 'Finance la police, la gendarmerie, la sécurité civile et le système judiciaire.',
    missions: ['Sécurités', 'Justice'],
  },
  5: {
    nom: 'Santé',
    emoji: '🏥',
    budgetTotal: 2.3,
    sourceUrl: 'https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2024/le-projet-de-loi-de-finances-et-les-documents-annexes-pour-2024/budget-general-2024/sante',
    descriptionCourte: 'Finance la prévention sanitaire et la protection maladie (budget État).',
    missions: ['Santé'],
    note: 'Budget État uniquement. L\'assurance maladie (~254 Md€) relève de la Sécurité sociale, hors budget de l\'État.',
  },
  6: {
    nom: 'Solidarité et insertion',
    emoji: '🤝',
    budgetTotal: 30.8,
    sourceUrl: 'https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2024/le-projet-de-loi-de-finances-et-les-documents-annexes-pour-2024/budget-general-2024/solidarite-insertion-et-egalite-des-chances',
    descriptionCourte: 'Finance le RSA, l\'AAH, le handicap, la dépendance et l\'égalité femmes-hommes.',
    missions: ['Solidarité, insertion et égalité des chances'],
  },
  7: {
    nom: 'Travail et emploi',
    emoji: '💼',
    budgetTotal: 22.4,
    sourceUrl: 'https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2024/le-projet-de-loi-de-finances-et-les-documents-annexes-pour-2024/budget-general-2024/travail-et-emploi',
    descriptionCourte: 'Finance France Travail, l\'apprentissage, la formation professionnelle et l\'emploi.',
    missions: ['Travail et emploi'],
  },
  8: {
    nom: 'Logement et territoires',
    emoji: '🏠',
    budgetTotal: 19.4,
    sourceUrl: 'https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2024/le-projet-de-loi-de-finances-et-les-documents-annexes-pour-2024/budget-general-2024/cohesion-des-territoires',
    descriptionCourte: 'Finance le logement social, les APL, la politique de la ville et l\'aménagement du territoire.',
    missions: ['Cohésion des territoires'],
  },
  9: {
    nom: 'Écologie et agriculture',
    emoji: '🌱',
    budgetTotal: 26.9,
    sourceUrl: 'https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2024/le-projet-de-loi-de-finances-et-les-documents-annexes-pour-2024/budget-general-2024/ecologie-developpement-et-mobilite-durables',
    descriptionCourte: 'Finance la transition écologique, les transports, l\'énergie et l\'agriculture durable.',
    missions: ['Écologie, développement et mobilité durables', 'Agriculture, alimentation, forêt et affaires rurales'],
  },
  10: {
    nom: 'Économie et finances publiques',
    emoji: '💰',
    budgetTotal: 16.3,
    sourceUrl: 'https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2024/le-projet-de-loi-de-finances-et-les-documents-annexes-pour-2024/budget-general-2024/economie',
    descriptionCourte: 'Finance la gestion fiscale, les douanes, le soutien aux entreprises et la fonction publique.',
    missions: ['Économie', 'Gestion des finances publiques', 'Transformation et fonction publiques'],
  },
  11: {
    nom: 'Culture et médias',
    emoji: '🎭',
    budgetTotal: 8.6,
    sourceUrl: 'https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2024/le-projet-de-loi-de-finances-et-les-documents-annexes-pour-2024/budget-general-2024/culture',
    descriptionCourte: 'Finance le patrimoine, la création artistique, l\'audiovisuel public et les médias.',
    missions: ['Culture', 'Médias, livre et industries culturelles', 'Audiovisuel public'],
  },
  12: {
    nom: 'Action internationale',
    emoji: '🌍',
    budgetTotal: 9.4,
    sourceUrl: 'https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2024/le-projet-de-loi-de-finances-et-les-documents-annexes-pour-2024/budget-general-2024/action-exterieure-de-letat',
    descriptionCourte: 'Finance la diplomatie française et l\'aide publique au développement.',
    missions: ['Action extérieure de l\'État', 'Aide publique au développement'],
  },
  13: {
    nom: 'Outre-mer',
    emoji: '🏝️',
    budgetTotal: 2.76,
    sourceUrl: 'https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2024/le-projet-de-loi-de-finances-et-les-documents-annexes-pour-2024/budget-general-2024/outre-mer',
    descriptionCourte: 'Finance l\'emploi, les conditions de vie et le développement des territoires ultramarins.',
    missions: ['Outre-mer'],
  },
  14: {
    nom: 'Immigration et intégration',
    emoji: '🛂',
    budgetTotal: 2.16,
    sourceUrl: 'https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2024/le-projet-de-loi-de-finances-et-les-documents-annexes-pour-2024/budget-general-2024/immigration-asile-et-integration',
    descriptionCourte: 'Finance l\'asile, l\'hébergement des demandeurs, l\'intégration et l\'accès à la nationalité.',
    missions: ['Immigration, asile et intégration'],
  },
  15: {
    nom: 'Investissement et innovation',
    emoji: '🚀',
    budgetTotal: 7.3,
    sourceUrl: 'https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2024/le-projet-de-loi-de-finances-et-les-documents-annexes-pour-2024/budget-general-2024/investir-pour-la-france-de-2030',
    descriptionCourte: 'Finance France 2030 : nucléaire, hydrogène, véhicule électrique, spatial, santé, numérique.',
    missions: ['Investir pour la France de 2030'],
  },
  16: {
    nom: 'Sport, jeunesse et mémoire nationale',
    emoji: '🏅',
    budgetTotal: 3.7,
    sourceUrl: 'https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2024/le-projet-de-loi-de-finances-et-les-documents-annexes-pour-2024/budget-general-2024/sport-jeunesse-et-vie-associative',
    descriptionCourte: 'Finance le sport, la vie associative, la jeunesse et la mémoire nationale.',
    missions: ['Sport, jeunesse et vie associative', 'Anciens combattants, mémoire et liens avec la Nation'],
  },
  17: {
    nom: 'Institutions et gouvernance',
    emoji: '🏛️',
    budgetTotal: 11.8,
    sourceUrl: 'https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2024/le-projet-de-loi-de-finances-et-les-documents-annexes-pour-2024/budget-general-2024/direction-de-laction-du-gouvernement',
    descriptionCourte: 'Finance le Parlement, les services du Premier ministre, les préfectures et les collectivités.',
    missions: ['Direction de l\'action du Gouvernement', 'Pouvoirs publics', 'Conseil et contrôle de l\'État', 'Administration générale et territoriale de l\'État', 'Relations avec les collectivités territoriales'],
  },
};

/**
 * Missions techniques — hors curseurs
 * Affichées dans la section "Ce qui est déjà engagé"
 */
export const missionsHorsCurseurs = [
  {
    nom: 'Remboursements et dégrèvements',
    montant: 140.2,
    explication: 'Corrections fiscales automatiques dues aux entreprises et particuliers. Pas une dépense — une correction obligatoire.',
    sourceUrl: 'https://www.senat.fr/rap/l23-128-326/l23-128-326_mono.html',
  },
  {
    nom: 'Engagements financiers de l\'État',
    montant: 60.8,
    explication: 'Remboursement des intérêts de la dette publique (51,4 Md€). 2e poste de dépense. Engagement contractuel non arbitrable.',
    sourceUrl: 'https://www.senat.fr/rap/l23-128-313/l23-128-313_mono.html',
  },
  {
    nom: 'Contribution française à l\'Union européenne',
    montant: 21.6,
    explication: 'Prélèvement sur recettes fiscales avant constitution du budget. Engagement treaty-based non arbitrable unilatéralement.',
    sourceUrl: 'https://www.senat.fr/rap/l23-128-22/l23-128-22_mono.html',
  },
  {
    nom: 'Régimes sociaux et de retraite',
    montant: 6.23,
    explication: 'Régimes spéciaux : SNCF (3,46 Md€), RATP (887 M€), mines (920 M€), marins (787 M€). Engagements contractuels.',
    sourceUrl: 'https://www.senat.fr/rap/l23-128-325/l23-128-325_mono.html',
  },
  {
    nom: 'Plan de relance (en extinction)',
    montant: 1.4,
    explication: 'Reliquat du plan de relance post-COVID. En extinction progressive.',
    sourceUrl: 'https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2024',
  },
  {
    nom: 'Crédits non répartis',
    montant: 0.5,
    explication: 'Réserve technique gouvernementale pour dépenses imprévues en cours d\'année.',
    sourceUrl: 'https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2024',
  },
];

export default polesInfo;
