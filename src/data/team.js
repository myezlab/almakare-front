const FULL_DAY = [{ start: '08:00', end: '12:30' }, { start: '13:30', end: '18:00' }]
const FULL_DAY_SHORT = [{ start: '08:00', end: '12:30' }, { start: '13:30', end: '17:00' }]
const NONE = []

export const WEEKDAY_KEYS = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
]

export const TEAM_SEED = [
  {
    id: 'tm-seed-001',
    firstName: 'Camille',
    lastName: 'Rousseau',
    email: 'camille.rousseau@chu-clinique.fr',
    role: 'doctor',
    specialty: 'Pneumologue',
    description: 'Spécialiste des troubles respiratoires du sommeil, le Dr Rousseau accompagne les patients atteints d\'apnée obstructive depuis plus de 15 ans. Elle privilégie une approche personnalisée centrée sur le confort du patient.',
    invitationStatus: 'accepted',
    establishmentIds: ['etablissement-paris'],
    acteIds: ['acte-consult-1', 'acte-consult-bilan', 'acte-consult-2'],
    locations: [
      {
        id: 'loc-rousseau-cabinet',
        name: 'Cabinet du Dr Rousseau',
        shortLabel: 'Cabinet',
        address: '24 rue de Rivoli, 75004 Paris',
        coordinates: { lat: 48.8559, lng: 2.3597 },
        workingHours: {
          monday: FULL_DAY, tuesday: FULL_DAY,
          wednesday: NONE, thursday: NONE, friday: NONE,
          saturday: NONE, sunday: NONE,
        },
      },
      {
        id: 'loc-rousseau-centre',
        name: 'Centre du sommeil — Paris',
        shortLabel: 'Centre Paris',
        address: '15 boulevard de l\'Hôpital, 75013 Paris',
        coordinates: { lat: 48.8389, lng: 2.3637 },
        workingHours: {
          monday: NONE, tuesday: NONE,
          wednesday: FULL_DAY, thursday: FULL_DAY, friday: FULL_DAY_SHORT,
          saturday: NONE, sunday: NONE,
        },
      },
    ],
  },
  {
    id: 'tm-seed-002',
    firstName: 'Antoine',
    lastName: 'Bernard',
    email: 'antoine.bernard@chu-clinique.fr',
    role: 'doctor',
    specialty: 'Neurologue du sommeil',
    description: 'Neurologue spécialisé dans les troubles du sommeil, le Dr Bernard prend en charge insomnies chroniques, parasomnies et hypersomnies. Il s\'appuie sur des examens polysomnographiques pour établir un diagnostic précis.',
    invitationStatus: 'accepted',
    establishmentIds: ['etablissement-paris', 'etablissement-lyon'],
    acteIds: ['acte-consult-1', 'acte-consult-diagnostic', 'acte-consult-2'],
    locations: [
      {
        id: 'loc-bernard-paris',
        name: 'Cabinet de neurologie du sommeil',
        shortLabel: 'Cabinet Paris',
        address: '12 boulevard Haussmann, 75009 Paris',
        coordinates: { lat: 48.8723, lng: 2.3380 },
        workingHours: {
          monday: FULL_DAY, tuesday: FULL_DAY, wednesday: FULL_DAY,
          thursday: NONE, friday: NONE,
          saturday: NONE, sunday: NONE,
        },
      },
      {
        id: 'loc-bernard-lyon',
        name: 'Centre du sommeil — Lyon',
        shortLabel: 'Centre Lyon',
        address: '32 rue Garibaldi, 69006 Lyon',
        coordinates: { lat: 45.7640, lng: 4.8523 },
        workingHours: {
          monday: NONE, tuesday: NONE, wednesday: NONE,
          thursday: FULL_DAY, friday: FULL_DAY_SHORT,
          saturday: NONE, sunday: NONE,
        },
      },
    ],
  },
  {
    id: 'tm-seed-003',
    firstName: 'Élodie',
    lastName: 'Garnier',
    email: 'elodie.garnier@chu-clinique.fr',
    role: 'doctor',
    specialty: 'ORL',
    description: 'Chirurgienne ORL, le Dr Garnier intervient sur les pathologies des voies aériennes supérieures liées au ronflement et aux apnées du sommeil. Elle propose des solutions chirurgicales et non chirurgicales adaptées.',
    invitationStatus: 'accepted',
    establishmentIds: ['etablissement-lyon'],
    acteIds: ['acte-consult-bilan', 'acte-consult-2'],
    locations: [
      {
        id: 'loc-garnier-cabinet',
        name: 'Cabinet ORL Part-Dieu',
        shortLabel: 'Cabinet',
        address: '47 cours Lafayette, 69003 Lyon',
        coordinates: { lat: 45.7616, lng: 4.8508 },
        workingHours: {
          monday: FULL_DAY, tuesday: FULL_DAY, wednesday: FULL_DAY,
          thursday: FULL_DAY, friday: FULL_DAY_SHORT,
          saturday: NONE, sunday: NONE,
        },
      },
    ],
  },
  {
    id: 'tm-seed-009',
    firstName: 'Nathan',
    lastName: 'Lambert',
    email: 'nathan.lambert@chu-clinique.fr',
    role: 'doctor',
    specialty: 'Cardiologue',
    description: 'Cardiologue, le Dr Lambert s\'intéresse aux liens entre apnée du sommeil et maladies cardiovasculaires. Il assure le suivi des patients à risque pour prévenir les complications associées.',
    invitationStatus: 'accepted',
    establishmentIds: ['etablissement-paris'],
    acteIds: ['acte-consult-diagnostic', 'acte-consult-2'],
    locations: [
      {
        id: 'loc-lambert-cabinet',
        name: 'Cabinet de cardiologie Lambert',
        shortLabel: 'Cabinet',
        address: '8 avenue de la République, 75011 Paris',
        coordinates: { lat: 48.8635, lng: 2.3793 },
        workingHours: {
          monday: FULL_DAY, tuesday: FULL_DAY, wednesday: FULL_DAY,
          thursday: FULL_DAY, friday: FULL_DAY_SHORT,
          saturday: NONE, sunday: NONE,
        },
      },
      {
        id: 'loc-lambert-hopital',
        name: 'Hôpital Saint-Antoine — Service cardio',
        shortLabel: 'Hôpital',
        address: '184 rue du Faubourg Saint-Antoine, 75012 Paris',
        coordinates: { lat: 48.8489, lng: 2.3852 },
        workingHours: {
          monday: NONE, tuesday: NONE, wednesday: NONE,
          thursday: [{ start: '09:00', end: '12:00' }],
          friday: [{ start: '09:00', end: '12:00' }],
          saturday: NONE, sunday: NONE,
        },
      },
    ],
  },
]
