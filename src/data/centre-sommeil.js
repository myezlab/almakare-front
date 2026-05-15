import {
  mdiAccountClockOutline,
  mdiBookOpenOutline,
  mdiCashMultiple,
  mdiChartBoxOutline,
  mdiCloudCheckOutline,
  mdiFileDocumentOutline,
  mdiHeadCogOutline,
  mdiLifebuoy,
  mdiMessageTextOutline,
  mdiMonitorDashboard,
  mdiPlaylistCheck,
  mdiVideoOutline,
} from '@mdi/js'

export const ALMAKARE_SERVICES = [
  {
    id: 'patient-journey',
    name: 'Parcours patient digital',
    description: 'Suivi numérique du parcours d\'hospitalisation, étape par étape.',
    details:
      'Un parcours guidé qui structure chaque étape du patient, du premier contact à la sortie d\'hospitalisation. Les patients reçoivent automatiquement les bonnes informations au bon moment, et l\'équipe suit l\'avancement en temps réel.',
    features: [
      'Étapes personnalisables par type de pathologie',
      'Notifications automatiques aux patients',
      'Vue d\'ensemble de tous les parcours actifs',
      'Relances automatiques en cas d\'inactivité',
    ],
    icon: mdiPlaylistCheck,
    price: 180,
  },
  {
    id: 'polysomnography',
    name: 'Polysomnographie connectée',
    description: 'Programmation et collecte des enregistrements nocturnes.',
    details:
      'Pilotez vos polysomnographies à distance : planification, appairage de l\'appareil, récupération automatique des tracés et pré-analyse par algorithme. Le médecin garde la main sur l\'interprétation finale.',
    features: [
      'Compatible avec les principaux appareils du marché',
      'Pré-scoring automatique des stades de sommeil',
      'Annotations partagées en équipe',
      'Export PDF du rapport clinique',
    ],
    icon: mdiHeadCogOutline,
    price: 240,
  },
  {
    id: 'teleconsultation',
    name: 'Téléconsultation sécurisée',
    description: 'Consultations vidéo conformes RGPD avec vos patients.',
    details:
      'Réalisez vos consultations à distance avec une qualité vidéo HD et un chiffrement de bout en bout. Les rendez-vous sont synchronisés avec votre agenda et l\'historique du patient.',
    features: [
      'Vidéo HD chiffrée de bout en bout',
      'Salle d\'attente virtuelle',
      'Partage d\'ordonnance en fin de consultation',
      'Conforme aux exigences HDS et RGPD',
    ],
    icon: mdiVideoOutline,
    price: 120,
  },
  {
    id: 'sleep-diary',
    name: 'Agenda du sommeil',
    description: 'Carnet de sommeil rempli par les patients, consultable en temps réel.',
    details:
      'Un agenda du sommeil mobile pour vos patients, qui se synchronise en continu avec leur dossier. Vous visualisez immédiatement les tendances et les nuits problématiques.',
    features: [
      'Saisie rapide en moins d\'une minute',
      'Graphiques de tendance sur 1, 3 et 6 mois',
      'Rappels personnalisables pour le patient',
      'Export du carnet en PDF pour le dossier',
    ],
    icon: mdiBookOpenOutline,
    price: 60,
  },
  {
    id: 'epworth',
    name: 'Test d\'Epworth en ligne',
    description: 'Évaluation de la somnolence diurne, scorée automatiquement.',
    details:
      'Le questionnaire d\'Epworth, version numérique. Le score est calculé automatiquement et les résultats sont archivés dans le dossier patient pour comparaison dans le temps.',
    features: [
      'Score calculé et interprété automatiquement',
      'Historique des passages comparé visuellement',
      'Envoi du test par lien sécurisé',
      'Intégré au dossier médical',
    ],
    icon: mdiAccountClockOutline,
    price: 40,
  },
  {
    id: 'analytics',
    name: 'Statistiques & rapports',
    description: 'Tableaux de bord d\'activité et indicateurs cliniques.',
    details:
      'Suivez l\'activité de votre centre : nombre de patients, délais moyens de prise en charge, taux d\'observance, indicateurs cliniques agrégés. Les rapports mensuels sont générés automatiquement.',
    features: [
      'Tableaux de bord temps réel',
      'Rapport d\'activité mensuel automatique',
      'Indicateurs cliniques agrégés et anonymisés',
      'Export Excel et PDF',
    ],
    icon: mdiChartBoxOutline,
    price: 90,
  },
  {
    id: 'secure-messaging',
    name: 'Messagerie sécurisée',
    description: 'Échanges chiffrés entre l\'équipe et les patients.',
    details:
      'Une messagerie de santé conforme aux exigences HDS, pour échanger avec vos patients et au sein de l\'équipe sans passer par des canaux non sécurisés.',
    features: [
      'Chiffrement de bout en bout',
      'Conversations de groupe pour l\'équipe',
      'Partage de pièces jointes (PDF, images)',
      'Notifications push sur mobile',
    ],
    icon: mdiMessageTextOutline,
    price: 70,
  },
  {
    id: 'billing',
    name: 'Facturation intégrée',
    description: 'Édition, suivi et relances des factures patients.',
    details:
      'Générez vos factures depuis le dossier patient, suivez les paiements et automatisez les relances. Compatible avec votre logiciel comptable via export SEPA.',
    features: [
      'Édition automatique des factures et devis',
      'Suivi des paiements et relances',
      'Export comptable SEPA / Excel',
      'TVA et taux personnalisables',
    ],
    icon: mdiCashMultiple,
    price: 110,
  },
  {
    id: 'documents',
    name: 'Gestion documentaire',
    description: 'Téléversement, classement et signature des documents administratifs.',
    details:
      'Centralisez tous les documents du patient : consentements, comptes-rendus, ordonnances, courriers. Signature électronique conforme eIDAS pour les documents qui le nécessitent.',
    features: [
      'Classement automatique par type de document',
      'Signature électronique eIDAS',
      'Recherche plein texte dans les documents',
      'Conservation 20 ans conforme à la loi',
    ],
    icon: mdiFileDocumentOutline,
    price: 50,
  },
]

export const ALMAKARE_FREE_SERVICES = [
  {
    id: 'support',
    name: 'Support 7j/7',
    description: 'Une équipe dédiée vous accompagne par téléphone et email, sans surcoût.',
    details:
      'Notre équipe support, basée en France, est disponible tous les jours pour vous accompagner. Temps de réponse moyen inférieur à 2 heures sur les questions courantes, et ligne d\'urgence dédiée pour les incidents critiques.',
    features: [
      'Support par téléphone, email et chat',
      'Disponible 7j/7, y compris jours fériés',
      'Temps de réponse moyen < 2 h',
      'Ligne d\'urgence dédiée 24/7',
    ],
    icon: mdiLifebuoy,
  },
  {
    id: 'hosting',
    name: 'Hébergement HDS & sauvegardes',
    description: 'Hébergement de données de santé certifié et sauvegardes quotidiennes inclus.',
    details:
      'Toutes les données de votre centre sont hébergées en France sur une infrastructure certifiée Hébergeur de Données de Santé (HDS). Sauvegardes chiffrées quotidiennes, conservées 30 jours, sans surcoût.',
    features: [
      'Hébergement HDS certifié en France',
      'Sauvegardes quotidiennes chiffrées',
      'Conservation des sauvegardes 30 jours',
      'Plan de reprise d\'activité (PRA) inclus',
    ],
    icon: mdiCloudCheckOutline,
  },
]

export const INVOICE_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
  OVERDUE: 'overdue',
}

export const INVOICE_STATUS_LABELS = {
  [INVOICE_STATUS.PAID]: 'Payée',
  [INVOICE_STATUS.PENDING]: 'En attente',
  [INVOICE_STATUS.OVERDUE]: 'En retard',
}

export const ALMAKARE_INVOICES_SEED = [
  {
    id: 'inv-2026-05',
    number: 'AK-2026-005',
    period: '2026-05',
    issuedAt: '2026-05-01',
    dueAt: '2026-05-31',
    amount: 680,
    status: INVOICE_STATUS.PENDING,
  },
  {
    id: 'inv-2026-04',
    number: 'AK-2026-004',
    period: '2026-04',
    issuedAt: '2026-04-01',
    paidAt: '2026-04-08',
    amount: 680,
    status: INVOICE_STATUS.PAID,
  },
  {
    id: 'inv-2026-03',
    number: 'AK-2026-003',
    period: '2026-03',
    issuedAt: '2026-03-01',
    paidAt: '2026-03-05',
    amount: 680,
    status: INVOICE_STATUS.PAID,
  },
  {
    id: 'inv-2026-02',
    number: 'AK-2026-002',
    period: '2026-02',
    issuedAt: '2026-02-01',
    paidAt: '2026-02-09',
    amount: 620,
    status: INVOICE_STATUS.PAID,
  },
  {
    id: 'inv-2026-01',
    number: 'AK-2026-001',
    period: '2026-01',
    issuedAt: '2026-01-01',
    paidAt: '2026-01-11',
    amount: 540,
    status: INVOICE_STATUS.PAID,
  },
  {
    id: 'inv-2025-12',
    number: 'AK-2025-012',
    period: '2025-12',
    issuedAt: '2025-12-01',
    paidAt: '2025-12-06',
    amount: 540,
    status: INVOICE_STATUS.PAID,
  },
]

export const CENTRE_SOMMEIL_SEED = {
  id: 'centre-sommeil-001',
  logoUrl: '',
  name: 'Centre du sommeil',
  description:
    'Notre centre du sommeil accompagne les patients dans le diagnostic et la prise en charge des troubles du sommeil : apnées, insomnies, hypersomnies, parasomnies.',
  createdAt: '2024-09-01',
  selectedServiceIds: [
    'patient-journey',
    'polysomnography',
    'sleep-diary',
    'epworth',
    'analytics',
    'secure-messaging',
  ],
}

export const CENTRE_FIELDS = {
  NAME: 'CENTRE_NAME',
  DESCRIPTION: 'CENTRE_DESCRIPTION',
  CREATED_AT: 'CENTRE_CREATED_AT',
  LOGO: 'CENTRE_LOGO',
  SERVICES: 'CENTRE_SERVICES',
}

export const CENTRE_FIELD_LABELS = {
  [CENTRE_FIELDS.NAME]: 'Nom',
  [CENTRE_FIELDS.DESCRIPTION]: 'Description',
  [CENTRE_FIELDS.CREATED_AT]: 'Date de création',
  [CENTRE_FIELDS.LOGO]: 'Logo',
  [CENTRE_FIELDS.SERVICES]: 'Services',
}

export const CENTRE_DASHBOARD_ICON = mdiMonitorDashboard
