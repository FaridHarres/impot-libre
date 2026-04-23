/**
 * Fiches pédagogiques des 8 pôles thématiques.
 *
 * Source principale : Loi de Finances Initiale 2024
 * LOI n° 2023-1322 du 29 décembre 2023
 * https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000048727345
 *
 * Les intitulés de missions budgétaires sont ceux de la LFI 2024 (stables).
 * Les intitulés de ministères suivent la composition gouvernementale en vigueur.
 *
 * IMPORTANT : Budget de l'État uniquement.
 * La Sécurité sociale (ONDAM ~254 Md€) n'est PAS incluse.
 */
const polesInfo = {
  1: {
    nom: 'Éducation & Savoir',
    emoji: '🎓',
    budgetTotal: 99.3,
    evolution: '+4,6 % vs 2023',
    sourceGenerale: 'https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2024',
    descriptionCourte:
      'Finance l\'enseignement scolaire, les universités, la recherche publique et les institutions culturelles.',
    missions: [
      'Enseignement scolaire',
      'Recherche et enseignement supérieur',
      'Culture',
    ],
    postes: [
      {
        libelle: 'Enseignement scolaire',
        montant: 63.6,
        evolution: '+6,5 % (+3,9 Md€)',
        source: 'https://www.senat.fr/rap/l23-128-314/l23-128-314_mono.html',
      },
      {
        libelle: 'Recherche et enseignement supérieur',
        montant: 31.8,
        evolution: '+3,3 %',
        source: 'https://www.senat.fr/rap/l23-128-324/l23-128-324_mono.html',
      },
      {
        libelle: 'Culture',
        montant: 3.9,
        evolution: '+4,9 % (+182 M€)',
        source: 'https://www.senat.fr/rap/l23-128-38/l23-128-38_mono.html',
      },
    ],
    statistiques: [
      '1ère mission de l\'État : 63,6 Md€ pour l\'enseignement scolaire',
      'Revalorisation enseignants : +7,3 % de dépenses de personnel',
      '2,47 Md€ de bourses étudiantes sur critères sociaux (+9 %)',
    ],
  },

  2: {
    nom: 'Santé & Solidarité',
    emoji: '🏥',
    budgetTotal: 75.5,
    evolution: '+6,5 % vs 2023',
    sourceGenerale: 'https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2024',
    descriptionCourte:
      'Finance la solidarité nationale, l\'emploi, le logement social et la santé publique (budget État).',
    missions: [
      'Solidarité, insertion et égalité des chances',
      'Travail et emploi',
      'Cohésion des territoires',
      'Santé',
    ],
    postes: [
      {
        libelle: 'Solidarité, insertion et égalité des chances',
        montant: 30.8,
        evolution: '+4,7 % (+0,9 Md€)',
        source: 'https://www.senat.fr/rap/l23-128-330/l23-128-3301.html',
      },
      {
        libelle: 'Travail et emploi',
        montant: 22.4,
        evolution: '+11 % (+2,4 Md€)',
        source: 'https://www.senat.fr/rap/l23-128-332/l23-128-332_mono.html',
      },
      {
        libelle: 'Cohésion des territoires',
        montant: 19.4,
        evolution: '+7,6 % (+1,5 Md€)',
        source: 'https://www.senat.fr/rap/l23-128-36-1/l23-128-36-10.html',
      },
      {
        libelle: 'Santé',
        montant: 2.3,
        evolution: 'stable',
        source: 'https://www.senat.fr/rap/a23-131-4/a23-131-4_mono.html',
        note: 'Budget État uniquement. L\'ONDAM Sécurité sociale (~254 Md€) est distinct.',
      },
    ],
    statistiques: [
      '13,9 Md€ d\'aides personnelles au logement (APL)',
      'Taux de chômage à 7,2 % — plus bas depuis 40 ans',
      '+300 agents France Travail pour l\'accompagnement RSA',
    ],
  },

  3: {
    nom: 'Sécurité & Justice',
    emoji: '🛡️',
    budgetTotal: 83.6,
    evolution: '+5,3 % vs 2023',
    sourceGenerale: 'https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2024',
    descriptionCourte:
      'Finance les armées, la police nationale, la gendarmerie, la sécurité civile et le système judiciaire.',
    missions: [
      'Défense',
      'Sécurités',
      'Justice',
    ],
    postes: [
      {
        libelle: 'Défense (hors pensions, périmètre LPM)',
        montant: 47.2,
        evolution: '+3,3 Md€ (LPM 2024-2030)',
        source: 'https://www.senat.fr/rap/l23-128-39/l23-128-39_mono.html',
      },
      {
        libelle: 'Sécurités (Police, Gendarmerie, Sécurité civile)',
        montant: 24.2,
        evolution: '+4,8 % (+1,1 Md€)',
        source: 'https://www.senat.fr/rap/l23-128-329-1/l23-128-329-1_mono.html',
      },
      {
        libelle: 'Justice',
        montant: 12.2,
        evolution: '+5,2 %',
        source: 'https://www.senat.fr/rap/l23-128-318/l23-128-318_mono.html',
      },
    ],
    statistiques: [
      '2 184 recrutements : 1 139 policiers + 1 045 gendarmes en 2024',
      '10 000 postes supplémentaires prévus pour la Justice (2023-2027)',
      'Police nationale : 12,9 Md€ — Gendarmerie : 10,4 Md€',
    ],
  },

  4: {
    nom: 'Économie & Finances',
    emoji: '💰',
    budgetTotal: 15.2,
    evolution: '+9,6 % hors effet énergie',
    sourceGenerale: 'https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2024',
    descriptionCourte:
      'Finance la gestion fiscale (DGFiP, Douanes), le soutien aux entreprises et l\'investissement France 2030.',
    missions: [
      'Gestion des finances publiques',
      'Économie',
      'Transformation et fonction publiques',
    ],
    postes: [
      {
        libelle: 'Gestion des finances publiques',
        montant: 10.9,
        evolution: '+3,4 %',
        source: 'https://www.senat.fr/rap/l23-128-315-1/l23-128-315-1_mono.html',
      },
      {
        libelle: 'Économie',
        montant: 4.3,
        evolution: '+9,6 % réel (hors fin aide énergie)',
        source: 'https://www.senat.fr/rap/l23-128-312/l23-128-3122.html',
      },
    ],
    statistiques: [
      '7,7 Md€ pour France 2030 (transitions écologique et numérique)',
      'DGFiP et DGDDI : principales administrations financières de l\'État',
      '+375 M€ de crédits de paiement réels hors effet énergie',
    ],
  },

  5: {
    nom: 'Environnement & Territoire',
    emoji: '🌱',
    budgetTotal: 23.1,
    evolution: '+7 Md€ planification écologique',
    sourceGenerale: 'https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2024',
    descriptionCourte:
      'Finance la transition écologique, les transports, la rénovation énergétique et l\'agriculture.',
    missions: [
      'Écologie, développement et mobilité durables',
      'Agriculture, alimentation, forêt et affaires rurales',
    ],
    postes: [
      {
        libelle: 'Écologie, développement et mobilité durables',
        montant: 16.5,
        evolution: '+7 Md€ planification écologique',
        source: 'https://www.senat.fr/rap/l23-128-311-2/l23-128-311-2_mono.html',
      },
      {
        libelle: 'Agriculture, alimentation, forêt et affaires rurales',
        montant: 3.3,
        evolution: '+37,6 % (+1,5 Md€)',
        source: 'https://www.senat.fr/rap/l23-128-33/l23-128-33_mono.html',
        note: 'Hausse confirmée. Total CP à préciser sur tableaux RAP.',
      },
      {
        libelle: 'Rénovation énergétique (Anah / MaPrimeRénov\')',
        montant: 1.38,
        evolution: '+274 % vs 2023',
        source: 'https://www.budget.gouv.fr/reperes/budget_vert/articles/plf-2024-la-4eme-edition-du-budget-vert',
      },
    ],
    statistiques: [
      '1,38 Md€ pour la rénovation thermique des logements (+274 %)',
      '7 Md€ supplémentaires pour la planification écologique',
      '797 M€ pour le matériel roulant ferroviaire (trains de nuit)',
    ],
  },

  6: {
    nom: 'International & Europe',
    emoji: '🌍',
    budgetTotal: 12.2,
    evolution: '+4 % vs 2023',
    sourceGenerale: 'https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2024',
    descriptionCourte:
      'Finance la diplomatie, l\'aide publique au développement et les territoires d\'outre-mer.',
    missions: [
      'Action extérieure de l\'État',
      'Aide publique au développement',
      'Outre-mer',
    ],
    postes: [
      {
        libelle: 'Aide publique au développement',
        montant: 5.9,
        evolution: 'stable (1er gel depuis 2017)',
        source: 'https://www.senat.fr/rap/l23-128-34/l23-128-34_mono.html',
      },
      {
        libelle: 'Action extérieure de l\'État',
        montant: 3.5,
        evolution: '+6 %',
        source: 'https://www.senat.fr/rap/l23-128-31/l23-128-311.html',
      },
      {
        libelle: 'Outre-mer',
        montant: 2.76,
        evolution: '+4,5 %',
        source: 'https://www.senat.fr/rap/a23-129-4/a23-129-4_mono.html',
      },
    ],
    statistiques: [
      'APD doublée depuis 2017 (de 2,6 à 5,9 Md€), stabilisée en 2024',
      '~105 nouveaux postes diplomatiques (cyber, anticipation)',
      'Objectif : 7,9 Md€ pour l\'action extérieure d\'ici 2027',
    ],
  },

  7: {
    nom: 'Sport & Vie citoyenne',
    emoji: '🏃',
    budgetTotal: 3.0,
    evolution: '-2 % (fin investissements JO)',
    sourceGenerale: 'https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2024',
    descriptionCourte:
      'Finance le sport, la jeunesse, la vie associative, les anciens combattants et la mémoire nationale.',
    missions: [
      'Sport, jeunesse et vie associative',
      'Anciens combattants, mémoire et liens avec la Nation',
    ],
    postes: [
      {
        libelle: 'Sport, jeunesse et vie associative',
        montant: 1.8,
        evolution: '-2 % (fin constructions JO)',
        source: 'https://www.senat.fr/rap/l23-128-331/l23-128-331_mono.html',
      },
      {
        libelle: 'Anciens combattants, mémoire et liens avec la Nation',
        montant: 1.2,
        evolution: 'trajectoire baissière',
        source: 'https://www.senat.fr/rap/l23-128-35/l23-128-350.html',
        note: 'Estimation. Pensions d\'invalidité en baisse, allocation de reconnaissance en hausse.',
      },
    ],
    statistiques: [
      'Programme Sport hors JO : +8,5 % — Jeunesse et vie associative : +7,7 %',
      '42,4 M€ pour le 80e anniversaire de la Libération (+87 %)',
      'JO Paris 2024 : ~6 Md€ de dépenses publiques totales (toutes sources)',
    ],
  },

  8: {
    nom: 'Institutions & État',
    emoji: '🏛️',
    budgetTotal: 1.1,
    evolution: '+9 % vs 2023',
    sourceGenerale: 'https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2024',
    descriptionCourte:
      'Finance les services du Premier ministre, le Parlement et les juridictions administratives.',
    missions: [
      'Direction de l\'action du Gouvernement',
      'Pouvoirs publics',
      'Conseil et contrôle de l\'État',
    ],
    postes: [
      {
        libelle: 'Direction de l\'action du Gouvernement',
        montant: 1.05,
        evolution: '+9 %',
        source: 'https://www.senat.fr/rap/a23-134-9/a23-134-9_mono.html',
      },
    ],
    statistiques: [
      'Le Parlement et le Conseil d\'État ont des dotations constitutionnelles propres (mission « Pouvoirs publics »)',
      'Priorité 2024 : accessibilité des services numériques de l\'État',
      '40 M€ pour l\'INSP (ex-ENA)',
    ],
    note: 'La mission « Pouvoirs publics » (Présidence, Assemblée, Sénat, Conseil constitutionnel) et « Conseil et contrôle de l\'État » sont des dotations séparées dont les montants ne sont pas consolidés ici.',
  },
};

export default polesInfo;
