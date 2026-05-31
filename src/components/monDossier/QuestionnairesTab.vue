<script setup>
import QuestionnaireResultsDialog from "@/components/QuestionnaireResultsDialog.vue"
import { useQuestionnaire } from "@/composables/useQuestionnaire"
import { useUrlPanels } from "@/composables/useUrlPanels"
import { useSelfStore } from "@/stores/self"
import { computed, reactive, ref } from "vue"

const selfStore = useSelfStore()

const openPanels = useUrlPanels("qPanels")

const QUESTIONS = [
  'Pendant que vous êtes occupé à lire un document',
  'Devant la télévision ou au cinéma',
  "Assis inactif dans un lieu public (salle d'attente, théâtre, …)",
  "Passager, depuis au moins une heure sans interruptions, d'une voiture ou d'un transport en commun (train, bus, avion, …)",
  'Allongé pour une sieste, lorsque les circonstances le permettent',
  'En position assise au cours d\'une conversation (ou au téléphone) avec un proche',
  'Tranquillement assis à table à la fin d\'un repas sans alcool',
  "Au volant d'une voiture immobilisée depuis quelques minutes dans un embouteillage",
]

const ANSWER_OPTIONS = [
  { value: 0, label: 'Jamais' },
  { value: 1, label: 'Faible chance' },
  { value: 2, label: 'Modérée' },
  { value: 3, label: 'Forte chance' },
]

const STOP_BANG_QUESTIONS = [
  { letter: 'S', title: 'Ronflement', text: 'Ronflez-vous bruyamment (plus fort que la voix ou suffisamment pour être entendu à travers une porte fermée) ?' },
  { letter: 'T', title: 'Fatigue', text: 'Vous sentez-vous souvent fatigué, épuisé ou somnolent pendant la journée ?' },
  { letter: 'O', title: 'Apnées observées', text: 'Quelqu\'un vous a-t-il déjà observé cesser de respirer ou s\'étouffer pendant votre sommeil ?' },
  { letter: 'P', title: 'Tension artérielle', text: 'Avez-vous ou êtes-vous traité pour de l\'hypertension artérielle ?' },
  { letter: 'B', title: 'IMC', text: 'Votre indice de masse corporelle (IMC) est-il supérieur à 35 kg/m² ?' },
  { letter: 'A', title: 'Âge', text: 'Avez-vous plus de 50 ans ?' },
  { letter: 'N', title: 'Tour de cou', text: 'Votre tour de cou est-il supérieur à 40 cm ?' },
  { letter: 'G', title: 'Sexe', text: 'Êtes-vous de sexe masculin ?' },
]

const YES_NO_OPTIONS = [
  { value: 1, label: 'Oui' },
  { value: 0, label: 'Non' },
]

const HAMILTON_QUESTIONS = [
  {
    title: 'Humeur dépressive',
    text: "Tristesse, sentiment d'être sans espoir, impuissant, ne valant rien",
    options: [
      { value: 0, label: 'Absente' },
      { value: 1, label: "Signalée à l'interrogatoire" },
      { value: 2, label: 'Exprimée spontanément' },
      { value: 3, label: 'Manifeste dans le comportement non-verbal' },
      { value: 4, label: 'Ne communique pratiquement que ces sentiments' },
    ],
  },
  {
    title: 'Sentiments de culpabilité',
    text: 'Auto-accusations, ruminations, idées de péché',
    options: [
      { value: 0, label: 'Absents' },
      { value: 1, label: 'Reproches envers soi-même' },
      { value: 2, label: 'Idées de culpabilité, ruminations' },
      { value: 3, label: 'Sentiment de punition mérité' },
      { value: 4, label: 'Hallucinations de culpabilité' },
    ],
  },
  {
    title: 'Idées de suicide',
    text: 'Idées noires, désir de mort, tentatives',
    options: [
      { value: 0, label: 'Absentes' },
      { value: 1, label: 'A le sentiment que la vie ne vaut pas la peine' },
      { value: 2, label: 'Souhaite être mort' },
      { value: 3, label: 'Idées ou gestes suicidaires' },
      { value: 4, label: 'Tentatives de suicide' },
    ],
  },
  {
    title: 'Insomnie du début de nuit',
    text: "Difficulté à s'endormir",
    options: [
      { value: 0, label: 'Aucune' },
      { value: 1, label: "Difficulté occasionnelle (> 30 min)" },
      { value: 2, label: 'Difficulté chaque soir' },
    ],
  },
  {
    title: 'Insomnie du milieu de nuit',
    text: 'Sommeil agité ou réveils nocturnes',
    options: [
      { value: 0, label: 'Aucune' },
      { value: 1, label: 'Sommeil agité, perturbé' },
      { value: 2, label: 'Réveils nocturnes, lever du lit' },
    ],
  },
  {
    title: 'Insomnie du matin',
    text: 'Réveil précoce',
    options: [
      { value: 0, label: 'Aucune' },
      { value: 1, label: 'Réveil tôt mais se rendort' },
      { value: 2, label: 'Réveil définitif précoce' },
    ],
  },
  {
    title: 'Travail et activités',
    text: "Perte d'intérêt, fatigue, difficulté à travailler",
    options: [
      { value: 0, label: 'Aucune difficulté' },
      { value: 1, label: "Idées d'incapacité" },
      { value: 2, label: 'Perte d\'intérêt' },
      { value: 3, label: 'Diminution du temps consacré ou productivité' },
      { value: 4, label: 'A arrêté son travail à cause de la maladie' },
    ],
  },
  {
    title: 'Ralentissement',
    text: 'Lenteur de la pensée, du langage, des mouvements',
    options: [
      { value: 0, label: 'Langage et pensée normaux' },
      { value: 1, label: 'Léger ralentissement à l\'entretien' },
      { value: 2, label: 'Ralentissement manifeste' },
      { value: 3, label: 'Entretien difficile' },
      { value: 4, label: 'Stupeur complète' },
    ],
  },
  {
    title: 'Agitation',
    text: 'Nervosité, incapacité à rester en place',
    options: [
      { value: 0, label: 'Aucune' },
      { value: 1, label: 'Crispation, mouvements des doigts' },
      { value: 2, label: 'Joue avec ses mains, ses cheveux, etc.' },
      { value: 3, label: 'Bouge, ne peut rester assis' },
      { value: 4, label: 'Se tord les mains, se ronge les ongles, s\'arrache les cheveux' },
    ],
  },
  {
    title: 'Anxiété psychique',
    text: 'Tension intérieure, inquiétude, irritabilité',
    options: [
      { value: 0, label: 'Aucune' },
      { value: 1, label: 'Tension et irritabilité subjectives' },
      { value: 2, label: 'Se fait du souci pour des problèmes mineurs' },
      { value: 3, label: 'Attitude inquiète, manifeste dans le visage et le langage' },
      { value: 4, label: 'Peurs exprimées spontanément' },
    ],
  },
  {
    title: 'Anxiété somatique',
    text: "Symptômes physiques d'anxiété (palpitations, sueurs, etc.)",
    options: [
      { value: 0, label: 'Absente' },
      { value: 1, label: 'Discrète' },
      { value: 2, label: 'Moyenne' },
      { value: 3, label: 'Forte' },
      { value: 4, label: 'Frappant le sujet d\'incapacité' },
    ],
  },
  {
    title: 'Symptômes somatiques gastro-intestinaux',
    text: "Perte d'appétit, lourdeur abdominale",
    options: [
      { value: 0, label: 'Absents' },
      { value: 1, label: 'Perte d\'appétit, mais mange sans qu\'on insiste' },
      { value: 2, label: 'A des difficultés à manger, nécessite laxatifs ou autres traitements' },
    ],
  },
  {
    title: 'Symptômes somatiques généraux',
    text: 'Fatigue, lourdeur des membres, courbatures',
    options: [
      { value: 0, label: 'Absents' },
      { value: 1, label: 'Lourdeurs des membres, fatigabilité' },
      { value: 2, label: 'Symptômes manifestes' },
    ],
  },
  {
    title: 'Symptômes génitaux',
    text: 'Baisse de la libido, troubles menstruels',
    options: [
      { value: 0, label: 'Absents' },
      { value: 1, label: 'Légers' },
      { value: 2, label: 'Importants' },
    ],
  },
  {
    title: 'Hypocondrie',
    text: 'Préoccupations corporelles',
    options: [
      { value: 0, label: 'Absente' },
      { value: 1, label: 'Préoccupations corporelles' },
      { value: 2, label: 'Préoccupations de santé' },
      { value: 3, label: 'Plaintes fréquentes, demandes d\'aide' },
      { value: 4, label: 'Idées délirantes hypocondriaques' },
    ],
  },
  {
    title: 'Perte de poids',
    text: 'Évaluée selon les données du sujet',
    options: [
      { value: 0, label: 'Pas de perte de poids' },
      { value: 1, label: 'Perte de poids probable liée à la maladie' },
      { value: 2, label: 'Perte de poids certaine' },
    ],
  },
  {
    title: 'Prise de conscience',
    text: 'Reconnaissance de la maladie',
    options: [
      { value: 0, label: 'Reconnaît être déprimé et malade' },
      { value: 1, label: 'Reconnaît la maladie mais l\'attribue à des causes externes' },
      { value: 2, label: 'Nie être malade' },
    ],
  },
]

// ---- Severity scales -------------------------------------------------------
function epworthColor(score) {
  if (score == null) return 'primary'
  if (score <= 10) return 'success'
  if (score <= 15) return 'warning'
  return 'error'
}
function epworthLabel(score) {
  if (score == null) return ''
  if (score <= 10) return 'Somnolence normale'
  if (score <= 15) return 'Somnolence modérée'
  return 'Somnolence sévère'
}

function stopBangColor(score) {
  if (score == null) return 'primary'
  if (score <= 2) return 'success'
  if (score <= 4) return 'warning'
  return 'error'
}
function stopBangLabel(score) {
  if (score == null) return ''
  if (score <= 2) return 'Risque faible'
  if (score <= 4) return 'Risque intermédiaire'
  return 'Risque élevé'
}

function hamiltonColor(score) {
  if (score == null) return 'primary'
  if (score <= 7) return 'success'
  if (score <= 17) return 'warning'
  return 'error'
}
function hamiltonLabel(score) {
  if (score == null) return ''
  if (score <= 7) return 'Pas de dépression'
  if (score <= 13) return 'Dépression légère'
  if (score <= 18) return 'Dépression modérée'
  if (score <= 22) return 'Dépression sévère'
  return 'Dépression très sévère'
}

// ---- Questionnaires --------------------------------------------------------
const epworth = reactive(
  useQuestionnaire({
    count: 8,
    answersKey: 'epworthAnswers',
    scoreKey: 'epworthScore',
    historyKey: 'epworthHistory',
    colorFor: epworthColor,
    labelFor: epworthLabel,
  }),
)

const stopBang = reactive(
  useQuestionnaire({
    count: 8,
    answersKey: 'stopBangAnswers',
    scoreKey: 'stopBangScore',
    historyKey: 'stopBangHistory',
    colorFor: stopBangColor,
    labelFor: stopBangLabel,
  }),
)

const hamilton = reactive(
  useQuestionnaire({
    count: 17,
    answersKey: 'hamiltonAnswers',
    scoreKey: 'hamiltonScore',
    historyKey: 'hamiltonHistory',
    colorFor: hamiltonColor,
    labelFor: hamiltonLabel,
  }),
)

// ---- History dialog --------------------------------------------------------
const META = {
  epworth: { instance: epworth, title: "Test d'Epworth", maxScore: 24 },
  stopBang: { instance: stopBang, title: 'Test STOP-BANG', maxScore: 8 },
  hamilton: { instance: hamilton, title: 'Échelle de Hamilton (HAM-D)', maxScore: 52 },
}

const activeKey = ref(null)
const historyOpen = computed({
  get: () => activeKey.value !== null,
  set: (val) => {
    if (!val) activeKey.value = null
  },
})
const activeMeta = computed(() => (activeKey.value ? META[activeKey.value] : null))
const activeTitle = computed(() => activeMeta.value?.title || '')
const activeMaxScore = computed(() => activeMeta.value?.maxScore || 0)
const activeHistory = computed(() => (activeMeta.value ? activeMeta.value.instance.history : []))
const activeColorFor = computed(() => (activeMeta.value ? activeMeta.value.instance.colorFor : () => 'primary'))
const activeLabelFor = computed(() => (activeMeta.value ? activeMeta.value.instance.labelFor : () => ''))

function openResults(key) {
  activeKey.value = key
}

// Save the completed questionnaire, reveal the results dialog, then clear the
// form so it can be filled again.
function saveQuestionnaire(key) {
  const { instance } = META[key]
  instance.save()
  instance.reset()
  openResults(key)
}
</script>

<template>
  <v-row>
    <v-col cols="12">
      <v-card class="card-shadow" :class="{ 'rounded-15': !$vuetify.display.mobile }">
        <v-expansion-panels v-model="openPanels" multiple variant="accordion" flat class="pa-2">
          <v-expansion-panel value="epworth" rounded="lg">
            <v-expansion-panel-title>
              <div class="d-flex align-center ga-3 flex-grow-1">
                <span class="panel-title">Test d'Epworth</span>
                <v-chip v-if="epworth.latest && !$vuetify.display.mobile" :color="epworth.latestColor"
                  variant="tonal" size="small" class="ml-2">
                  {{ epworth.latestLabel }}
                </v-chip>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="text-body-medium text-medium-emphasis mb-4 pt-2">
                Évaluez votre tendance à vous endormir dans différentes situations de la vie quotidienne.
                Pour chaque question, indiquez la probabilité que vous vous endormiez.
              </div>

              <div v-if="selfStore.item.id">
                <v-card v-for="(question, i) in QUESTIONS" :key="i" class="mb-3 py-4" flat rounded="lg">
                  <div class="text-body-medium font-weight-medium mb-3">
                    <span class="text-medium-emphasis mr-1">{{ i + 1 }}.</span>
                    {{ question }}
                  </div>
                  <div class="d-flex flex-wrap ga-2">
                    <v-btn v-for="option in ANSWER_OPTIONS" :key="option.value"
                      :color="epworth.answers[i] === option.value ? 'primary' : undefined" variant="flat" rounded="lg"
                      size="small" class="text-none" :class="{ 'border-light': epworth.answers[i] !== option.value }"
                      @click="epworth.select(i, option.value)">
                      {{ option.label }}
                    </v-btn>
                  </div>
                </v-card>

                <div class="text-center text-body-medium text-medium-emphasis mt-4">
                  {{ epworth.answeredCount }} / 8
                </div>

                <div class="d-flex flex-wrap align-center ga-2 mt-4">
                  <v-btn color="primary" variant="flat" rounded="lg" class="text-none"
                    :disabled="!epworth.complete" @click="saveQuestionnaire('epworth')">
                    Enregistrer
                  </v-btn>
                  <v-spacer />
                  <v-btn variant="tonal" rounded="lg" class="text-none" :disabled="!epworth.history.length"
                    @click="openResults('epworth')">
                    Résultats
                  </v-btn>
                </div>
              </div>

              <div v-else>
                <v-card v-for="i in 8" :key="i" class="mb-3 pa-4" variant="outlined" rounded="lg">
                  <v-skeleton-loader type="text" class="mb-3" />
                  <div class="d-flex ga-2">
                    <v-skeleton-loader v-for="j in 4" :key="j" type="chip" />
                  </div>
                </v-card>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel value="stopBang" rounded="lg">
            <v-expansion-panel-title>
              <div class="d-flex align-center ga-3 flex-grow-1">
                <span class="panel-title">Test STOP-BANG</span>
                <v-chip v-if="stopBang.latest && !$vuetify.display.mobile" :color="stopBang.latestColor"
                  variant="tonal" size="small" class="ml-2">
                  {{ stopBang.latestLabel }}
                </v-chip>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="text-body-medium text-medium-emphasis mb-4 pt-2">
                Dépistage du syndrome d'apnées obstructives du sommeil. Répondez par Oui ou Non
                à chacune des 8 questions pour évaluer votre risque.
              </div>

              <div v-if="selfStore.item.id">
                <v-card v-for="(question, i) in STOP_BANG_QUESTIONS" :key="i" class="mb-3 py-4" flat rounded="lg">
                  <div class="text-body-medium font-weight-medium mb-3">
                    <span class="text-medium-emphasis mr-1">{{ i + 1 }}.</span>
                    {{ question.text }}
                  </div>
                  <div class="d-flex flex-wrap ga-2">
                    <v-btn v-for="option in YES_NO_OPTIONS" :key="option.value"
                      :color="stopBang.answers[i] === option.value ? 'primary' : undefined" variant="flat" rounded="lg"
                      size="small" class="text-none"
                      :class="{ 'border-light': stopBang.answers[i] !== option.value }"
                      @click="stopBang.select(i, option.value)">
                      {{ option.label }}
                    </v-btn>
                  </div>
                </v-card>

                <div class="text-center text-body-medium text-medium-emphasis mt-4">
                  {{ stopBang.answeredCount }} / 8
                </div>

                <div class="d-flex flex-wrap align-center ga-2 mt-4">
                  <v-btn color="primary" variant="flat" rounded="lg" class="text-none"
                    :disabled="!stopBang.complete" @click="saveQuestionnaire('stopBang')">
                    Enregistrer
                  </v-btn>
                  <v-spacer />
                  <v-btn variant="tonal" rounded="lg" class="text-none" :disabled="!stopBang.history.length"
                    @click="openResults('stopBang')">
                    Résultats
                  </v-btn>
                </div>
              </div>

              <div v-else>
                <v-card v-for="i in 8" :key="i" class="mb-3 pa-4" variant="outlined" rounded="lg">
                  <v-skeleton-loader type="text" class="mb-3" />
                  <div class="d-flex ga-2">
                    <v-skeleton-loader v-for="j in 2" :key="j" type="chip" />
                  </div>
                </v-card>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel value="hamilton" rounded="lg">
            <v-expansion-panel-title>
              <div class="d-flex align-center ga-3 flex-grow-1">
                <span class="panel-title">Échelle de Hamilton (HAM-D)</span>
                <v-chip v-if="hamilton.latest && !$vuetify.display.mobile" :color="hamilton.latestColor"
                  variant="tonal" size="small" class="ml-2">
                  {{ hamilton.latestLabel }}
                </v-chip>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="text-body-medium text-medium-emphasis mb-4 pt-2">
                Évaluation de la sévérité d'un état dépressif sur 17 items. Pour chaque question,
                choisissez la proposition qui correspond le mieux à votre état au cours de la
                semaine écoulée.
              </div>

              <div v-if="selfStore.item.id">
                <v-card v-for="(question, i) in HAMILTON_QUESTIONS" :key="i" class="mb-3 py-4" flat rounded="lg">
                  <div class="text-body-medium font-weight-medium mb-1">
                    <span class="text-medium-emphasis mr-1">{{ i + 1 }}.</span>
                    {{ question.title }}
                  </div>
                  <div class="text-body-small text-medium-emphasis mb-3">{{ question.text }}</div>
                  <div class="d-flex flex-wrap ga-2">
                    <v-btn v-for="option in question.options" :key="option.value"
                      :color="hamilton.answers[i] === option.value ? 'primary' : undefined" variant="flat" rounded="lg"
                      size="small" class="text-none"
                      :class="{ 'border-light': hamilton.answers[i] !== option.value }"
                      @click="hamilton.select(i, option.value)">
                      {{ option.label }}
                    </v-btn>
                  </div>
                </v-card>

                <div class="text-center text-body-medium text-medium-emphasis mt-4">
                  {{ hamilton.answeredCount }} / 17
                </div>

                <div class="d-flex flex-wrap align-center ga-2 mt-4">
                  <v-btn color="primary" variant="flat" rounded="lg" class="text-none"
                    :disabled="!hamilton.complete" @click="saveQuestionnaire('hamilton')">
                    Enregistrer
                  </v-btn>
                  <v-spacer />
                  <v-btn variant="tonal" rounded="lg" class="text-none" :disabled="!hamilton.history.length"
                    @click="openResults('hamilton')">
                    Résultats
                  </v-btn>
                </div>
              </div>

              <div v-else>
                <v-card v-for="i in 17" :key="i" class="mb-3 pa-4" variant="outlined" rounded="lg">
                  <v-skeleton-loader type="text" class="mb-3" />
                  <div class="d-flex ga-2">
                    <v-skeleton-loader v-for="j in 3" :key="j" type="chip" />
                  </div>
                </v-card>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card>
    </v-col>
  </v-row>

  <QuestionnaireResultsDialog v-model="historyOpen" :title="activeTitle" :max-score="activeMaxScore"
    :history="activeHistory" :color-for="activeColorFor" :label-for="activeLabelFor" />
</template>

<style scoped>
.letter-spacing {
  letter-spacing: 0.08em;
}
</style>
