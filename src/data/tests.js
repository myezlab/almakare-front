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

import { mdiBatteryLow, mdiBrain, mdiClipboardPulseOutline, mdiEmoticonSadOutline, mdiHeartPulse, mdiLungs, mdiSleepOff, mdiSteering } from "@mdi/js"

const SLEEPINESS_OPTIONS = [
  { value: 0, label: 'Jamais' },
  { value: 1, label: 'Faible chance' },
  { value: 2, label: 'Modérée' },
  { value: 3, label: 'Forte chance' }
]

const FATIGUE_OPTIONS = [
  { value: 0, label: 'Pas du tout' },
  { value: 1, label: 'Un peu' },
  { value: 2, label: 'Moyennement' },
  { value: 3, label: 'Beaucoup' },
  { value: 4, label: 'Extrêmement' }
]

const YES_NO_OPTIONS = [
  { value: 1, label: 'Oui' },
  { value: 0, label: 'Non' }
]

// ISI severity scale used for the three sleep-difficulty sub-items (1a/1b/1c).
const ISI_SEVERITY_OPTIONS = [
  { value: 0, label: 'Aucune' },
  { value: 1, label: 'Légère' },
  { value: 2, label: 'Moyenne' },
  { value: 3, label: 'Élevée' },
  { value: 4, label: 'Extrême' }
]

// ISI "Pas du tout … Extrêmement" scale (interference, visibility, worry).
const ISI_DEGREE_OPTIONS = [
  { value: 0, label: 'Pas du tout' },
  { value: 1, label: 'Un peu' },
  { value: 2, label: 'Moyennement' },
  { value: 3, label: 'Beaucoup' },
  { value: 4, label: 'Extrêmement' }
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
    key: 'boss',
    title: 'Échelle BOSS (somnolence au volant)',
    icon: mdiSteering,
    todo: "Évaluez votre risque d'accident lié à la somnolence au volant.",
    description:
      'Bordeaux Sleepiness Scale (BOSS). Ce court questionnaire de 4 items évalue spécifiquement ' +
      "votre risque d'accident de la route lié à la somnolence au volant. Un score total supérieur " +
      'ou égal à 3 indique un risque élevé.',
    answersKey: 'bossAnswers',
    scoreKey: 'bossScore',
    maxScore: 8,
    showOptionValue: false,
    questions: [
      {
        text: 'Vous êtes :',
        options: [
          { value: 0, label: 'Une femme' },
          { value: 1, label: 'Un homme' }
        ]
      },
      {
        text: 'Combien de kilomètres parcourez-vous au volant par an ?',
        options: [
          { value: 0, label: 'Moins de 10 000 km' },
          { value: 1, label: '10 000 km ou plus' }
        ]
      },
      {
        text: "Au volant d'une voiture immobilisée depuis quelques minutes dans un embouteillage, quelle est la probabilité que vous vous endormiez ?",
        options: SLEEPINESS_OPTIONS
      },
      {
        text: 'Au cours des 12 derniers mois, à quelle fréquence avez-vous ressenti une somnolence sévère au volant (lutte pour rester éveillé) ?',
        options: [
          { value: 0, label: 'Jamais' },
          { value: 1, label: 'Rarement (1 à 2 fois)' },
          { value: 2, label: 'Parfois (plusieurs fois)' },
          { value: 3, label: 'Souvent' }
        ]
      }
    ],
    thresholds: [
      { upTo: 2, color: 'success', label: 'Risque faible' },
      { upTo: null, color: 'error', label: 'Risque élevé' }
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
  },
  {
    key: 'beck',
    title: 'Inventaire de dépression de Beck (BDI-13)',
    icon: mdiEmoticonSadOutline,
    todo: 'Auto-évaluez votre état dépressif sur 13 items.',
    description:
      "Auto-questionnaire abrégé de Beck (13 items). Pour chaque chapitre, choisissez la " +
      'proposition qui correspond le mieux à votre état actuel.',
    answersKey: 'beckAnswers',
    scoreKey: 'beckScore',
    maxScore: 39,
    showOptionValue: false,
    questions: [
      {
        text: 'Tristesse',
        options: [
          { value: 0, label: 'Je ne me sens pas triste' },
          { value: 1, label: 'Je me sens cafardeux ou triste' },
          { value: 2, label: "Je me sens tout le temps cafardeux ou triste et je n'arrive pas à en sortir" },
          { value: 3, label: 'Je suis si triste et si malheureux que je ne peux pas le supporter' }
        ]
      },
      {
        text: 'Pessimisme',
        options: [
          { value: 0, label: "Je ne suis pas particulièrement découragé ni pessimiste au sujet de l'avenir" },
          { value: 1, label: "J'ai un sentiment de découragement au sujet de l'avenir" },
          { value: 2, label: "Pour mon avenir, je n'ai aucun motif d'espérer" },
          { value: 3, label: "Je sens qu'il n'y a aucun espoir pour mon avenir et que la situation ne peut s'améliorer" }
        ]
      },
      {
        text: "Sentiment d'échec",
        options: [
          { value: 0, label: "Je n'ai aucun sentiment d'échec de ma vie" },
          { value: 1, label: "J'ai l'impression que j'ai échoué dans ma vie plus que la plupart des gens" },
          { value: 2, label: "Quand je regarde ma vie passée, tout ce que j'y découvre n'est qu'échecs" },
          { value: 3, label: "J'ai un sentiment d'échec complet dans toute ma vie personnelle" }
        ]
      },
      {
        text: 'Insatisfaction',
        options: [
          { value: 0, label: 'Je ne me sens pas particulièrement insatisfait' },
          { value: 1, label: 'Je ne sais pas profiter agréablement des circonstances' },
          { value: 2, label: 'Je ne tire plus aucune satisfaction de quoi que ce soit' },
          { value: 3, label: 'Je suis mécontent de tout' }
        ]
      },
      {
        text: 'Culpabilité',
        options: [
          { value: 0, label: 'Je ne me sens pas coupable' },
          { value: 1, label: 'Je me sens mauvais ou indigne une bonne partie du temps' },
          { value: 2, label: 'Je me sens coupable' },
          { value: 3, label: "Je me juge très mauvais et j'ai l'impression que je ne vaux rien" }
        ]
      },
      {
        text: 'Déception de soi',
        options: [
          { value: 0, label: 'Je ne suis pas déçu par moi-même' },
          { value: 1, label: 'Je suis déçu par moi-même' },
          { value: 2, label: 'Je me dégoûte moi-même' },
          { value: 3, label: 'Je me hais' }
        ]
      },
      {
        text: 'Idées suicidaires',
        options: [
          { value: 0, label: 'Je ne pense pas à me faire du mal' },
          { value: 1, label: 'Je pense que la mort me libérerait' },
          { value: 2, label: "J'ai des plans précis pour me suicider" },
          { value: 3, label: 'Si je le pouvais, je me tuerais' }
        ]
      },
      {
        text: 'Retrait social',
        options: [
          { value: 0, label: "Je n'ai pas perdu l'intérêt pour les autres gens" },
          { value: 1, label: "Maintenant, je m'intéresse moins aux autres gens qu'autrefois" },
          { value: 2, label: "J'ai perdu tout l'intérêt que je portais aux autres gens et j'ai peu de sentiments pour eux" },
          { value: 3, label: "J'ai perdu tout intérêt pour les autres et ils m'indiffèrent totalement" }
        ]
      },
      {
        text: 'Indécision',
        options: [
          { value: 0, label: 'Je suis capable de me décider aussi facilement que de coutume' },
          { value: 1, label: "J'essaie de ne pas avoir à prendre de décision" },
          { value: 2, label: "J'ai de grandes difficultés à prendre des décisions" },
          { value: 3, label: 'Je ne suis plus capable de prendre la moindre décision' }
        ]
      },
      {
        text: 'Image de soi',
        options: [
          { value: 0, label: "Je n'ai pas le sentiment d'être plus laid qu'avant" },
          { value: 1, label: "J'ai peur de paraître vieux ou disgracieux" },
          { value: 2, label: "J'ai l'impression qu'il y a un changement permanent dans mon apparence physique qui me fait paraître disgracieux" },
          { value: 3, label: "J'ai l'impression d'être laid et repoussant" }
        ]
      },
      {
        text: 'Difficulté au travail',
        options: [
          { value: 0, label: "Je travaille aussi facilement qu'auparavant" },
          { value: 1, label: 'Il me faut faire un effort supplémentaire pour commencer à faire quelque chose' },
          { value: 2, label: 'Il faut que je fasse un très grand effort pour faire quoi que ce soit' },
          { value: 3, label: 'Je suis incapable de faire le moindre travail' }
        ]
      },
      {
        text: 'Fatigabilité',
        options: [
          { value: 0, label: "Je ne suis pas plus fatigué que d'habitude" },
          { value: 1, label: "Je suis fatigué plus facilement que d'habitude" },
          { value: 2, label: 'Faire quoi que ce soit me fatigue' },
          { value: 3, label: 'Je suis incapable de faire le moindre travail' }
        ]
      },
      {
        text: 'Appétit',
        options: [
          { value: 0, label: 'Mon appétit est toujours aussi bon' },
          { value: 1, label: "Mon appétit n'est pas aussi bon que d'habitude" },
          { value: 2, label: 'Mon appétit est beaucoup moins bon maintenant' },
          { value: 3, label: "Je n'ai plus du tout d'appétit" }
        ]
      }
    ],
    thresholds: [
      { upTo: 3, color: 'success', label: 'Pas de dépression' },
      { upTo: 7, color: 'warning', label: 'Dépression légère' },
      { upTo: 15, color: 'warning', label: 'Dépression moyenne à modérée' },
      { upTo: null, color: 'error', label: 'Dépression sévère' }
    ]
  },
  {
    key: 'hadAnxiete',
    title: 'Échelle HAD — Anxiété (HAD-A)',
    icon: mdiHeartPulse,
    todo: 'Dépistez un trouble anxieux en 7 questions.',
    description:
      "Sous-échelle d'anxiété de l'échelle HAD (Hospital Anxiety and Depression scale). " +
      'Pour chacune des 7 propositions, choisissez la réponse qui correspond le mieux à ce que ' +
      'vous avez ressenti au cours de la semaine écoulée. Répondez spontanément, sans trop réfléchir.',
    answersKey: 'hadAnxieteAnswers',
    scoreKey: 'hadAnxieteScore',
    maxScore: 21,
    showOptionValue: false,
    questions: [
      {
        text: 'Je me sens tendu(e) ou énervé(e)',
        options: [
          { value: 0, label: 'Jamais' },
          { value: 1, label: 'De temps en temps' },
          { value: 2, label: 'Souvent' },
          { value: 3, label: 'La plupart du temps' }
        ]
      },
      {
        text: "J'ai une sensation de peur comme si quelque chose d'horrible allait m'arriver",
        options: [
          { value: 0, label: 'Pas du tout' },
          { value: 1, label: "Un peu, mais cela ne m'inquiète pas" },
          { value: 2, label: "Oui, mais ce n'est pas trop grave" },
          { value: 3, label: 'Oui, très nettement' }
        ]
      },
      {
        text: 'Je me fais du souci',
        options: [
          { value: 0, label: 'Très occasionnellement' },
          { value: 1, label: 'Occasionnellement' },
          { value: 2, label: 'Assez souvent' },
          { value: 3, label: 'Très souvent' }
        ]
      },
      {
        text: 'Je peux rester tranquillement assis(e) à ne rien faire et me sentir décontracté(e)',
        options: [
          { value: 0, label: 'Oui, quoi qu\'il arrive' },
          { value: 1, label: 'Oui, en général' },
          { value: 2, label: 'Rarement' },
          { value: 3, label: 'Jamais' }
        ]
      },
      {
        text: "J'éprouve des sensations de peur et j'ai l'estomac noué",
        options: [
          { value: 0, label: 'Jamais' },
          { value: 1, label: 'Parfois' },
          { value: 2, label: 'Assez souvent' },
          { value: 3, label: 'Très souvent' }
        ]
      },
      {
        text: "J'ai la bougeotte et n'arrive pas à tenir en place",
        options: [
          { value: 0, label: 'Pas du tout' },
          { value: 1, label: 'Pas tellement' },
          { value: 2, label: 'Un peu' },
          { value: 3, label: "Oui, c'est tout à fait le cas" }
        ]
      },
      {
        text: "J'éprouve des sensations soudaines de panique",
        options: [
          { value: 0, label: 'Jamais' },
          { value: 1, label: 'Pas très souvent' },
          { value: 2, label: 'Assez souvent' },
          { value: 3, label: 'Vraiment très souvent' }
        ]
      }
    ],
    thresholds: [
      { upTo: 7, color: 'success', label: "Absence de symptomatologie anxieuse" },
      { upTo: 10, color: 'warning', label: 'Symptomatologie anxieuse douteuse' },
      { upTo: null, color: 'error', label: 'Anxiété avérée' }
    ]
  },
  {
    key: 'pichot',
    title: 'Échelle de fatigue de Pichot',
    icon: mdiBatteryLow,
    todo: 'Évaluez votre niveau de fatigue en 8 questions.',
    description:
      "Évaluez votre niveau de fatigue. Pour chacune des 8 propositions, indiquez dans quelle " +
      'mesure elle correspond à votre ressenti au cours des derniers jours.',
    answersKey: 'pichotAnswers',
    scoreKey: 'pichotScore',
    maxScore: 32,
    options: FATIGUE_OPTIONS,
    questions: [
      { text: "Je manque d'énergie" },
      { text: 'Tout demande un effort' },
      { text: 'Je me sens faible à certains endroits du corps' },
      { text: 'Je sens mes jambes ou mes bras lourds' },
      { text: 'Je me sens fatigué sans raison' },
      { text: "J'ai besoin de m'allonger pour me reposer" },
      { text: "J'ai du mal à me concentrer" },
      { text: 'Je me sens fatigué, lourd et raide' }
    ],
    thresholds: [
      { upTo: 22, color: 'success', label: 'Fatigue normale' },
      { upTo: null, color: 'error', label: 'Fatigue excessive' }
    ]
  },
  {
    key: 'isi',
    title: "Index de sévérité de l'insomnie (ISI)",
    icon: mdiSleepOff,
    todo: "Évaluez la sévérité de votre insomnie en 7 questions.",
    description:
      "Index de sévérité de l'insomnie (Morin). Ce questionnaire évalue la nature, la sévérité et " +
      "le retentissement de votre insomnie. Répondez en vous référant aux 2 dernières semaines.",
    answersKey: 'isiAnswers',
    scoreKey: 'isiScore',
    maxScore: 28,
    showOptionValue: false,
    questions: [
      {
        text: "Difficultés à vous endormir",
        caption: "Sévérité de vos difficultés de sommeil actuelles (2 dernières semaines)",
        options: ISI_SEVERITY_OPTIONS
      },
      {
        text: "Difficultés à rester endormi(e)",
        caption: "Réveils au cours de la nuit",
        options: ISI_SEVERITY_OPTIONS
      },
      {
        text: "Problème de réveil trop tôt le matin",
        options: ISI_SEVERITY_OPTIONS
      },
      {
        text: "À quel point êtes-vous satisfait(e) de votre sommeil actuel ?",
        options: [
          { value: 0, label: 'Très satisfait' },
          { value: 1, label: 'Satisfait' },
          { value: 2, label: 'Plutôt neutre' },
          { value: 3, label: 'Insatisfait' },
          { value: 4, label: 'Très insatisfait' }
        ]
      },
      {
        text: "À quel point considérez-vous que vos difficultés de sommeil perturbent votre fonctionnement quotidien ?",
        caption: "Fatigue, concentration, mémoire, humeur, etc.",
        options: ISI_DEGREE_OPTIONS
      },
      {
        text: "À quel point pensez-vous que les autres remarquent les conséquences de vos difficultés de sommeil sur votre qualité de vie ?",
        options: ISI_DEGREE_OPTIONS
      },
      {
        text: "À quel point êtes-vous inquiet(ète) ou préoccupé(e) à propos de vos difficultés de sommeil actuelles ?",
        options: ISI_DEGREE_OPTIONS
      }
    ],
    thresholds: [
      { upTo: 7, color: 'success', label: "Absence d'insomnie" },
      { upTo: 14, color: 'warning', label: 'Insomnie infraclinique (légère)' },
      { upTo: 21, color: 'warning', label: 'Insomnie clinique modérée' },
      { upTo: null, color: 'error', label: 'Insomnie clinique sévère' }
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
