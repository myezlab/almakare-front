// Catalog of scored questionnaires a doctor can request before a consultation.
//
// A consultation's `requestedItems` (in activities.json) references a test by
// its `key`; ActivitesTab then shows one card per requested test, each opening
// TestDialog. Each test stores its raw answers under `answersKey` and its total
// under `scoreKey` on the patient record (selfStore).
//
// Question shape read by TestDialog:
//   { text, caption?, options? }   // options override the test default
// Options shape: { value: Number, label: String }
// `thresholds` map a total score to a colour + label; evaluated in order, an
// entry with `upTo: null` is the catch-all for the highest band.

import { mdiBrain, mdiClipboardPulseOutline, mdiLungs } from "@mdi/js"

const SLEEPINESS_OPTIONS = [
  { value: 0, label: 'Jamais' },
  { value: 1, label: 'Faible chance' },
  { value: 2, label: 'Modérée' },
  { value: 3, label: 'Forte chance' }
]

const YES_NO_OPTIONS = [
  { value: 1, label: 'Oui' },
  { value: 0, label: 'Non' }
]

export const TESTS = [
  {
    key: 'epworth',
    title: "Test d'Epworth",
    icon: mdiClipboardPulseOutline,
    todo: 'Évaluez votre niveau de somnolence en quelques minutes.',
    description:
      'Évaluez votre tendance à vous endormir dans différentes situations de la vie quotidienne. ' +
      'Pour chaque question, indiquez la probabilité que vous vous endormiez.',
    answersKey: 'epworthAnswers',
    scoreKey: 'epworthScore',
    maxScore: 24,
    options: SLEEPINESS_OPTIONS,
    questions: [
      { text: 'Pendant que vous êtes occupé à lire un document' },
      { text: 'Devant la télévision ou au cinéma' },
      { text: "Assis inactif dans un lieu public (salle d'attente, théâtre, …)" },
      { text: "Passager, depuis au moins une heure sans interruptions, d'une voiture ou d'un transport en commun (train, bus, avion, …)" },
      { text: 'Allongé pour une sieste, lorsque les circonstances le permettent' },
      { text: 'En position assise au cours d\'une conversation (ou au téléphone) avec un proche' },
      { text: 'Tranquillement assis à table à la fin d\'un repas sans alcool' },
      { text: "Au volant d'une voiture immobilisée depuis quelques minutes dans un embouteillage" }
    ],
    thresholds: [
      { upTo: 10, color: 'success', label: 'Somnolence normale' },
      { upTo: 15, color: 'warning', label: 'Somnolence modérée' },
      { upTo: null, color: 'error', label: 'Somnolence sévère' }
    ]
  },
  {
    key: 'stopBang',
    title: 'Test STOP-BANG',
    icon: mdiLungs,
    todo: "Dépistez votre risque d'apnées du sommeil en 8 questions.",
    description:
      "Dépistage du syndrome d'apnées obstructives du sommeil. Répondez par Oui ou Non " +
      'à chacune des 8 questions pour évaluer votre risque.',
    answersKey: 'stopBangAnswers',
    scoreKey: 'stopBangScore',
    maxScore: 8,
    options: YES_NO_OPTIONS,
    questions: [
      { caption: 'Ronflement', text: 'Ronflez-vous bruyamment (plus fort que la voix ou suffisamment pour être entendu à travers une porte fermée) ?' },
      { caption: 'Fatigue', text: 'Vous sentez-vous souvent fatigué, épuisé ou somnolent pendant la journée ?' },
      { caption: 'Apnées observées', text: 'Quelqu\'un vous a-t-il déjà observé cesser de respirer ou s\'étouffer pendant votre sommeil ?' },
      { caption: 'Tension artérielle', text: 'Avez-vous ou êtes-vous traité pour de l\'hypertension artérielle ?' },
      { caption: 'IMC', text: 'Votre indice de masse corporelle (IMC) est-il supérieur à 35 kg/m² ?' },
      { caption: 'Âge', text: 'Avez-vous plus de 50 ans ?' },
      { caption: 'Tour de cou', text: 'Votre tour de cou est-il supérieur à 40 cm ?' },
      { caption: 'Sexe', text: 'Êtes-vous de sexe masculin ?' }
    ],
    thresholds: [
      { upTo: 2, color: 'success', label: 'Risque faible' },
      { upTo: 4, color: 'warning', label: 'Risque intermédiaire' },
      { upTo: null, color: 'error', label: 'Risque élevé' }
    ]
  },
  {
    key: 'hamilton',
    title: 'Échelle de Hamilton (HAM-D)',
    icon: mdiBrain,
    todo: "Évaluez votre état dépressif sur 17 items.",
    description:
      "Évaluation de la sévérité d'un état dépressif sur 17 items. Pour chaque question, " +
      "choisissez la proposition qui correspond le mieux à votre état au cours de la semaine écoulée.",
    answersKey: 'hamiltonAnswers',
    scoreKey: 'hamiltonScore',
    maxScore: 52,
    showOptionValue: false,
    questions: [
      {
        text: 'Humeur dépressive',
        caption: "Tristesse, sentiment d'être sans espoir, impuissant, ne valant rien",
        options: [
          { value: 0, label: 'Absente' },
          { value: 1, label: "Signalée à l'interrogatoire" },
          { value: 2, label: 'Exprimée spontanément' },
          { value: 3, label: 'Manifeste dans le comportement non-verbal' },
          { value: 4, label: 'Ne communique pratiquement que ces sentiments' }
        ]
      },
      {
        text: 'Sentiments de culpabilité',
        caption: 'Auto-accusations, ruminations, idées de péché',
        options: [
          { value: 0, label: 'Absents' },
          { value: 1, label: 'Reproches envers soi-même' },
          { value: 2, label: 'Idées de culpabilité, ruminations' },
          { value: 3, label: 'Sentiment de punition mérité' },
          { value: 4, label: 'Hallucinations de culpabilité' }
        ]
      },
      {
        text: 'Idées de suicide',
        caption: 'Idées noires, désir de mort, tentatives',
        options: [
          { value: 0, label: 'Absentes' },
          { value: 1, label: 'A le sentiment que la vie ne vaut pas la peine' },
          { value: 2, label: 'Souhaite être mort' },
          { value: 3, label: 'Idées ou gestes suicidaires' },
          { value: 4, label: 'Tentatives de suicide' }
        ]
      },
      {
        text: 'Insomnie du début de nuit',
        caption: "Difficulté à s'endormir",
        options: [
          { value: 0, label: 'Aucune' },
          { value: 1, label: 'Difficulté occasionnelle (> 30 min)' },
          { value: 2, label: 'Difficulté chaque soir' }
        ]
      },
      {
        text: 'Insomnie du milieu de nuit',
        caption: 'Sommeil agité ou réveils nocturnes',
        options: [
          { value: 0, label: 'Aucune' },
          { value: 1, label: 'Sommeil agité, perturbé' },
          { value: 2, label: 'Réveils nocturnes, lever du lit' }
        ]
      },
      {
        text: 'Insomnie du matin',
        caption: 'Réveil précoce',
        options: [
          { value: 0, label: 'Aucune' },
          { value: 1, label: 'Réveil tôt mais se rendort' },
          { value: 2, label: 'Réveil définitif précoce' }
        ]
      },
      {
        text: 'Travail et activités',
        caption: "Perte d'intérêt, fatigue, difficulté à travailler",
        options: [
          { value: 0, label: 'Aucune difficulté' },
          { value: 1, label: "Idées d'incapacité" },
          { value: 2, label: 'Perte d\'intérêt' },
          { value: 3, label: 'Diminution du temps consacré ou productivité' },
          { value: 4, label: 'A arrêté son travail à cause de la maladie' }
        ]
      },
      {
        text: 'Ralentissement',
        caption: 'Lenteur de la pensée, du langage, des mouvements',
        options: [
          { value: 0, label: 'Langage et pensée normaux' },
          { value: 1, label: 'Léger ralentissement à l\'entretien' },
          { value: 2, label: 'Ralentissement manifeste' },
          { value: 3, label: 'Entretien difficile' },
          { value: 4, label: 'Stupeur complète' }
        ]
      },
      {
        text: 'Agitation',
        caption: 'Nervosité, incapacité à rester en place',
        options: [
          { value: 0, label: 'Aucune' },
          { value: 1, label: 'Crispation, mouvements des doigts' },
          { value: 2, label: 'Joue avec ses mains, ses cheveux, etc.' },
          { value: 3, label: 'Bouge, ne peut rester assis' },
          { value: 4, label: 'Se tord les mains, se ronge les ongles, s\'arrache les cheveux' }
        ]
      },
      {
        text: 'Anxiété psychique',
        caption: 'Tension intérieure, inquiétude, irritabilité',
        options: [
          { value: 0, label: 'Aucune' },
          { value: 1, label: 'Tension et irritabilité subjectives' },
          { value: 2, label: 'Se fait du souci pour des problèmes mineurs' },
          { value: 3, label: 'Attitude inquiète, manifeste dans le visage et le langage' },
          { value: 4, label: 'Peurs exprimées spontanément' }
        ]
      },
      {
        text: 'Anxiété somatique',
        caption: "Symptômes physiques d'anxiété (palpitations, sueurs, etc.)",
        options: [
          { value: 0, label: 'Absente' },
          { value: 1, label: 'Discrète' },
          { value: 2, label: 'Moyenne' },
          { value: 3, label: 'Forte' },
          { value: 4, label: 'Frappant le sujet d\'incapacité' }
        ]
      },
      {
        text: 'Symptômes somatiques gastro-intestinaux',
        caption: "Perte d'appétit, lourdeur abdominale",
        options: [
          { value: 0, label: 'Absents' },
          { value: 1, label: 'Perte d\'appétit, mais mange sans qu\'on insiste' },
          { value: 2, label: 'A des difficultés à manger, nécessite laxatifs ou autres traitements' }
        ]
      },
      {
        text: 'Symptômes somatiques généraux',
        caption: 'Fatigue, lourdeur des membres, courbatures',
        options: [
          { value: 0, label: 'Absents' },
          { value: 1, label: 'Lourdeurs des membres, fatigabilité' },
          { value: 2, label: 'Symptômes manifestes' }
        ]
      },
      {
        text: 'Symptômes génitaux',
        caption: 'Baisse de la libido, troubles menstruels',
        options: [
          { value: 0, label: 'Absents' },
          { value: 1, label: 'Légers' },
          { value: 2, label: 'Importants' }
        ]
      },
      {
        text: 'Hypocondrie',
        caption: 'Préoccupations corporelles',
        options: [
          { value: 0, label: 'Absente' },
          { value: 1, label: 'Préoccupations corporelles' },
          { value: 2, label: 'Préoccupations de santé' },
          { value: 3, label: 'Plaintes fréquentes, demandes d\'aide' },
          { value: 4, label: 'Idées délirantes hypocondriaques' }
        ]
      },
      {
        text: 'Perte de poids',
        caption: 'Évaluée selon les données du sujet',
        options: [
          { value: 0, label: 'Pas de perte de poids' },
          { value: 1, label: 'Perte de poids probable liée à la maladie' },
          { value: 2, label: 'Perte de poids certaine' }
        ]
      },
      {
        text: 'Prise de conscience',
        caption: 'Reconnaissance de la maladie',
        options: [
          { value: 0, label: 'Reconnaît être déprimé et malade' },
          { value: 1, label: 'Reconnaît la maladie mais l\'attribue à des causes externes' },
          { value: 2, label: 'Nie être malade' }
        ]
      }
    ],
    thresholds: [
      { upTo: 7, color: 'success', label: 'Pas de dépression' },
      { upTo: 13, color: 'warning', label: 'Dépression légère' },
      { upTo: 18, color: 'warning', label: 'Dépression modérée' },
      { upTo: 22, color: 'error', label: 'Dépression sévère' },
      { upTo: null, color: 'error', label: 'Dépression très sévère' }
    ]
  }
]

export const TESTS_BY_KEY = TESTS.reduce((acc, test) => {
  acc[test.key] = test
  return acc
}, {})

// Map a total score to its colour + label band for a given test.
export function evaluateTest(test, score) {
  if (!test || score == null) return { color: 'primary', label: '' }
  return (
    test.thresholds.find((t) => t.upTo == null || score <= t.upTo) || { color: 'primary', label: '' }
  )
}
