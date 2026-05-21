import {
  mdiAccountClockOutline,
  mdiBookOpenOutline,
  mdiCashMultiple,
  mdiChartBoxOutline,
  mdiClipboardPulseOutline,
  mdiCloudCheckOutline,
  mdiFileDocumentOutline,
  mdiHeadCogOutline,
  mdiLifebuoy,
  mdiMessageTextOutline,
  mdiMonitorDashboard,
  mdiPlaylistCheck,
  mdiToolboxOutline,
  mdiVideoOutline,
} from '@mdi/js'

export const MACHINE_TYPES = [
  { value: 'lit', label: 'Lit' },
  { value: 'polysomnographe', label: 'Polysomnographe' },
  { value: 'polysomnographe-video', label: 'Polysomnographe avec vidéo' },
  { value: 'polysomnographe-neuro', label: 'Polysomnographe à viser neuro' },
  { value: 'polysomnographe-neuro-video', label: 'Polysomnographe à viser neuro avec vidéo' },
  { value: 'eeg', label: 'Système EEG' },
  { value: 'polygraphe', label: 'Polygraphe' },
  { value: 'gaz-du-sang', label: 'Gaz du sang' },
  { value: 'efr', label: 'EFR' },
]

export const BILLING_TYPES = [
  { value: 'hourly', label: 'À l\'heure' },
  { value: 'fixed', label: 'Forfaitaire' },
  { value: 'machine', label: 'Selon la machine' },
  { value: 'none', label: 'Non facturable' },
]

export const ACTE_COLORS = [
  '#1976D2', // blue
  '#2E7D32', // green
  '#F57C00', // orange
  '#C62828', // red
  '#6A1B9A', // purple
  '#00838F', // teal
  '#EF6C00', // deep orange
  '#5D4037', // brown
  '#37474F', // blue-grey
  '#AD1457', // pink
]

export const ACTE_ICON = mdiClipboardPulseOutline

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
      'Suivez l\'activité de votre organisation : nombre de patients, délais moyens de prise en charge, taux d\'observance, indicateurs cliniques agrégés. Les rapports mensuels sont générés automatiquement.',
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
      'Toutes les données de votre organisation sont hébergées en France sur une infrastructure certifiée Hébergeur de Données de Santé (HDS). Sauvegardes chiffrées quotidiennes, conservées 30 jours, sans surcoût.',
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

export const ORGANISATION_SEED = {
  id: 'organisation-001',
  logoUrl: '',
  name: 'Organisation',
  description:
    'Notre organisation accompagne les patients dans le diagnostic et la prise en charge des troubles du sommeil : apnées, insomnies, hypersomnies, parasomnies.',
  createdAt: '2024-09-01',
  selectedServiceIds: [
    'patient-journey',
    'polysomnography',
    'sleep-diary',
    'epworth',
    'analytics',
    'secure-messaging',
  ],
  actes: [
    {
      id: 'acte-consult-1',
      label: 'Première consultation du sommeil',
      description: 'Premier rendez-vous d\'évaluation. Le médecin recueille vos antécédents, vos plaintes liées au sommeil et propose une orientation diagnostique adaptée. Pensez à apporter votre carnet de sommeil si vous en tenez un.',
      internalCode: 'WAIT_CONSULT_1',
      externalCode: 'CSL',
      visibleOnOnlineAgenda: true,
      sendPlanningEmail: true,
      price: 30,
      agendaColor: '#1976D2',
      billingType: 'hourly',
      billableByDoctor: true,
      machineTypes: [],
      billAssociatedGhs: false,
      linkedActeId: '',
      concurrentAppointments: 1,
      averageDurationMinutes: 45,
      visible: true,
      order: 1,
      specificDirectory: '',
      isFirstVisit: true,
    },
    {
      id: 'acte-consult-bilan',
      label: 'Bilan initial approfondi',
      description: 'Première consultation longue avec bilan complet. Inclut l\'analyse détaillée de vos symptômes, un examen clinique ciblé et la prescription d\'examens complémentaires si nécessaire.',
      internalCode: 'WAIT_CONSULT_BILAN',
      externalCode: 'CSL+',
      visibleOnOnlineAgenda: true,
      sendPlanningEmail: true,
      price: 60,
      agendaColor: '#00838F',
      billingType: 'hourly',
      billableByDoctor: true,
      machineTypes: [],
      billAssociatedGhs: false,
      linkedActeId: '',
      concurrentAppointments: 1,
      averageDurationMinutes: 60,
      visible: true,
      order: 2,
      specificDirectory: '',
      isFirstVisit: true,
    },
    {
      id: 'acte-consult-diagnostic',
      label: 'Première consultation orientée diagnostic',
      description: 'Consultation initiale rapide pour orientation diagnostique. Idéale si vous avez déjà des résultats d\'examens du sommeil à faire interpréter ou un dossier transmis par un autre médecin.',
      internalCode: 'WAIT_CONSULT_DIAG',
      externalCode: 'CSLD',
      visibleOnOnlineAgenda: true,
      sendPlanningEmail: true,
      price: 40,
      agendaColor: '#F57C00',
      billingType: 'hourly',
      billableByDoctor: true,
      machineTypes: [],
      billAssociatedGhs: false,
      linkedActeId: '',
      concurrentAppointments: 1,
      averageDurationMinutes: 40,
      visible: true,
      order: 3,
      specificDirectory: '',
      isFirstVisit: true,
    },
    {
      id: 'acte-consult-2',
      label: 'Consultation de suivi du sommeil',
      description: 'Consultation de suivi après diagnostic ou en cours de traitement. Permet d\'ajuster la prise en charge, contrôler l\'observance et adapter le traitement.',
      internalCode: 'WAIT_CONSULT_2',
      externalCode: 'APV',
      visibleOnOnlineAgenda: true,
      sendPlanningEmail: true,
      price: 30,
      agendaColor: '#2E7D32',
      billingType: 'hourly',
      billableByDoctor: true,
      machineTypes: [],
      billAssociatedGhs: false,
      linkedActeId: '',
      concurrentAppointments: 1,
      averageDurationMinutes: 25,
      visible: true,
      order: 4,
      specificDirectory: '',
      isFirstVisit: false,
    },
    {
      id: 'acte-polysomno',
      label: 'Enregistrement polysomnographique',
      description: 'Enregistrement nocturne complet du sommeil (EEG, respiration, mouvements). Réalisé sur une nuit complète au centre du sommeil.',
      internalCode: 'PSG_NUIT',
      externalCode: 'PSG',
      visibleOnOnlineAgenda: false,
      sendPlanningEmail: true,
      price: 420,
      agendaColor: '#6A1B9A',
      billingType: 'fixed',
      billableByDoctor: false,
      machineTypes: ['polysomnographe', 'polysomnographe-video'],
      billAssociatedGhs: true,
      linkedActeId: '',
      concurrentAppointments: 2,
      averageDurationMinutes: 720,
      visible: true,
      order: 5,
      specificDirectory: 'PSG',
      isFirstVisit: false,
    },
  ],
  establishments: [
    {
      id: 'etablissement-paris',
      name: 'Centre du sommeil — Paris',
      location: 'Paris, France',
      address: '15 boulevard de l\'Hôpital, 75013 Paris',
      coordinates: { lat: 48.8389, lng: 2.3637 },
      description: 'Centre de référence pour les troubles du sommeil au cœur de Paris. Équipe pluridisciplinaire et plateau technique complet pour le diagnostic et la prise en charge des apnées, insomnies et hypersomnies.',
      logoUrl: '',
      devices: [
        {
          id: 'device-nox-a1',
          name: 'Polysomnographe Nox A1',
          acquiredAt: '2023-05-12',
          bookings: [
            { id: 'b-nox-1', startDate: '2026-05-18', endDate: '2026-05-21', label: 'M. Durand' },
            { id: 'b-nox-2', startDate: '2026-05-25', endDate: '2026-05-28', label: 'Mme Lefèvre' },
            { id: 'b-nox-3', startDate: '2026-06-02', endDate: '2026-06-04', label: 'M. Bernard' },
            { id: 'b-nox-4', startDate: '2026-06-10', endDate: '2026-06-12', label: 'Mme Chevalier' },
          ],
        },
        {
          id: 'device-polygraphe',
          name: 'Polygraphe ventilatoire SOMNOtouch',
          acquiredAt: '2024-01-20',
          bookings: [
            { id: 'b-poly-1', startDate: '2026-05-19', endDate: '2026-05-20', label: 'Mme Martin' },
            { id: 'b-poly-2', startDate: '2026-06-08', endDate: '2026-06-10', label: 'Maintenance constructeur' },
          ],
        },
        {
          id: 'device-actimetre',
          name: 'Actimètre Philips Respironics',
          acquiredAt: '2024-10-05',
          bookings: [
            { id: 'b-act-1', startDate: '2026-05-22', endDate: '2026-05-29', label: 'M. Petit' },
          ],
        },
        {
          id: 'device-cpap',
          name: 'CPAP ResMed AirSense 11',
          acquiredAt: '2022-08-30',
          bookings: [
            { id: 'b-cpap-1', startDate: '2026-05-18', endDate: '2026-06-15', label: 'M. Roux — essai 30 j' },
          ],
        },
      ],
    },
    {
      id: 'etablissement-lyon',
      name: 'Centre du sommeil — Lyon',
      location: 'Lyon, France',
      address: '32 rue Garibaldi, 69006 Lyon',
      coordinates: { lat: 45.7640, lng: 4.8523 },
      description: 'Centre du sommeil implanté dans le quartier de la Part-Dieu. Spécialisé dans la prise en charge des troubles respiratoires du sommeil et des pathologies ORL associées.',
      logoUrl: '',
      devices: [],
    },
  ],
}

export const ORGANISATION_FIELDS = {
  NAME: 'ORGANISATION_NAME',
  DESCRIPTION: 'ORGANISATION_DESCRIPTION',
  CREATED_AT: 'ORGANISATION_CREATED_AT',
  LOGO: 'ORGANISATION_LOGO',
  SERVICES: 'ORGANISATION_SERVICES',
  ESTABLISHMENT_NAME: 'ESTABLISHMENT_NAME',
  ESTABLISHMENT_LOCATION: 'ESTABLISHMENT_LOCATION',
  ESTABLISHMENT_LOGO: 'ESTABLISHMENT_LOGO',
  DEVICE_NAME: 'DEVICE_NAME',
  DEVICE_ACQUIRED_AT: 'DEVICE_ACQUIRED_AT',
  ACTE_LABEL: 'ACTE_LABEL',
  ACTE_INTERNAL_CODE: 'ACTE_INTERNAL_CODE',
  ACTE_EXTERNAL_CODE: 'ACTE_EXTERNAL_CODE',
  ACTE_PRICE: 'ACTE_PRICE',
  ACTE_BILLING_TYPE: 'ACTE_BILLING_TYPE',
  ACTE_MACHINE_TYPES: 'ACTE_MACHINE_TYPES',
  ACTE_DURATION: 'ACTE_DURATION',
  ACTE_ORDER: 'ACTE_ORDER',
  ACTE_VISIBLE: 'ACTE_VISIBLE',
}

export const ORGANISATION_FIELD_LABELS = {
  [ORGANISATION_FIELDS.NAME]: 'Nom',
  [ORGANISATION_FIELDS.DESCRIPTION]: 'Description',
  [ORGANISATION_FIELDS.CREATED_AT]: 'Date de création',
  [ORGANISATION_FIELDS.LOGO]: 'Logo',
  [ORGANISATION_FIELDS.SERVICES]: 'Services',
  [ORGANISATION_FIELDS.ESTABLISHMENT_NAME]: 'Nom de l\'établissement',
  [ORGANISATION_FIELDS.ESTABLISHMENT_LOCATION]: 'Localisation',
  [ORGANISATION_FIELDS.ESTABLISHMENT_LOGO]: 'Logo de l\'établissement',
  [ORGANISATION_FIELDS.DEVICE_NAME]: 'Nom du matériel',
  [ORGANISATION_FIELDS.DEVICE_ACQUIRED_AT]: 'Date d\'acquisition',
  [ORGANISATION_FIELDS.ACTE_LABEL]: 'Libellé',
  [ORGANISATION_FIELDS.ACTE_INTERNAL_CODE]: 'Code interne',
  [ORGANISATION_FIELDS.ACTE_EXTERNAL_CODE]: 'Code externe',
  [ORGANISATION_FIELDS.ACTE_PRICE]: 'Tarif',
  [ORGANISATION_FIELDS.ACTE_BILLING_TYPE]: 'Type de facturation',
  [ORGANISATION_FIELDS.ACTE_MACHINE_TYPES]: 'Types de machine',
  [ORGANISATION_FIELDS.ACTE_DURATION]: 'Durée moyenne',
  [ORGANISATION_FIELDS.ACTE_ORDER]: 'Ordre d\'apparition',
  [ORGANISATION_FIELDS.ACTE_VISIBLE]: 'Visible',
}

export const ORGANISATION_DASHBOARD_ICON = mdiMonitorDashboard
export const DEVICE_ICON = mdiToolboxOutline
