<script setup>
import {
  mdiAccountGroup,
  mdiAirFilter,
  mdiAlert,
  mdiCarEmergency,
  mdiChevronLeft,
  mdiClipboardTextOutline,
  mdiHeadLightbulb,
  mdiHeartPulse,
  mdiSleep,
  mdiSleepOff,
  mdiStethoscope,
} from '@mdi/js'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const symptomsNight = [
  'Ronflements forts (présents chez 95 % des apnéiques)',
  'Pauses respiratoires observées par un proche',
  "Réveils en sursaut avec sensation d'étouffement",
  'Sommeil agité, micro-éveils fréquents',
  "Besoin d'uriner plusieurs fois par nuit",
]

const symptomsDay = [
  'Fatigue au réveil, plus fatigué(e) le matin que le soir',
  'Somnolence excessive (au volant, en réunion, devant la TV)',
  'Maux de tête le matin',
  'Difficultés de concentration / mémoire',
  "Irritabilité, troubles de l'humeur",
]

const checkedNight = ref([])
const checkedDay = ref([])
const totalChecked = computed(() => checkedNight.value.length + checkedDay.value.length)

const risks = [
  { icon: mdiHeartPulse, text: 'Risque cardiovasculaire augmenté (hypertension, arythmie)' },
  { icon: mdiCarEmergency, text: "Risque d'accident de la route multiplié par 2,5" },
  { icon: mdiHeadLightbulb, text: 'Mémoire, concentration et humeur dégradées' },
  { icon: mdiSleepOff, text: "Fatigue chronique qui s'installe progressivement" },
  { icon: mdiAccountGroup, text: 'Impact sur la vie de couple et sociale' },
]

const timelineSteps = [
  {
    icon: mdiStethoscope,
    color: 'primary',
    title: 'Consultation médecin traitant',
    desc: 'Décrivez vos symptômes. Parlez des ronflements, de la fatigue, de la somnolence.',
  },
  {
    icon: mdiSleep,
    color: 'info',
    title: 'Enregistrement du sommeil',
    desc: 'Polygraphie à domicile (capteurs posés le soir, retirés le matin) ou polysomnographie en clinique du sommeil. Pas douloureux.',
  },
  {
    icon: mdiClipboardTextOutline,
    color: 'warning',
    title: "Résultat : l'indice IAH",
    desc: "L'IAH mesure le nombre d'apnées par heure. Normal < 5. Modéré : 15–30. Sévère : > 30.",
  },
  {
    icon: mdiAirFilter,
    color: 'success',
    title: 'Traitement adapté',
    desc: 'PPC (masque), orthèse dentaire, ou perte de poids selon la sévérité.',
  },
]

const ppcFaq = [
  {
    title: 'Est-ce inconfortable ?',
    text: "L'adaptation prend quelques jours à quelques semaines. La plupart des patients s'y habituent. 1 personne sur 2 abandonne le traitement — ne soyez pas dans ce groupe, changez de masque plutôt qu'arrêter.",
  },
  {
    title: 'Ça fait du bruit ?',
    text: 'Les machines modernes sont très silencieuses. Le conjoint dort souvent mieux aussi — plus de ronflements.',
  },
  {
    title: 'Je dois le porter toute ma vie ?',
    text: 'Oui, dans la plupart des cas. Mais les bénéfices sont immédiats : dès les premières nuits pour beaucoup de patients.',
  },
  {
    title: 'Est-ce remboursé ?',
    text: "Oui, à 60 % par la Sécu (100 % si complications graves). La mutuelle complète. Condition : utiliser l'appareil au moins 4h par nuit.",
  },
]

const riskFactorsHigh = ['Obésité / surpoids', 'Homme de 40–60 ans', 'Tour de cou > 40 cm']
const riskFactorsMedium = ['Alcool fréquent', 'Tabac', 'Sédentarité', 'Ménopause']
const riskFactorsLow = ['Antécédents familiaux', 'Anomalies ORL ou dentaires']

const sources = {
  symptoms: [
    { label: 'Ameli.fr', url: 'https://www.ameli.fr/assure/sante/themes/apnee-du-sommeil/symptomes-diagnostic-evolution' },
  ],
  reassurance: [
    { label: 'RNPC/SFRMS', url: 'https://www.rnpc.fr/journee-mondiale-du-sommeil-2024-lapnee-du-sommeil-un-facteur-de-risque-cardiovasculaire-encore-meconnu/' },
    { label: 'Santé publique France', url: 'https://www.santepubliquefrance.fr/sommeil/donnees' },
    { label: 'Carenity', url: 'https://www.carenity.com/infos-maladie/apnee-du-sommeil/chiffres-cles-et-prevalence-768' },
  ],
  risks: [
    { label: 'Ameli.fr', url: 'https://www.ameli.fr/assure/sante/themes/apnee-du-sommeil/symptomes-diagnostic-evolution' },
    { label: 'INSERM', url: 'https://www.inserm.fr/dossier/apnee-sommeil/' },
    { label: 'Alliance Apnées', url: 'https://www.allianceapnees.org/temoignage/' },
    { label: 'SomniPlanet', url: 'https://www.somniplanet.com/nos-solutions/vivre-avec-son-traitement/' },
  ],
  pathway: [
    { label: 'ResMed', url: 'https://www.resmed.fr/patients/apnee-du-sommeil/depistage-et-diagnostic/' },
    { label: 'CH Le Mans', url: 'https://www.ch-lemans.fr/prevention/lapnee-du-sommeil/' },
    { label: 'MédecinDirect', url: 'https://www.medecindirect.fr/maladies/apnee-du-sommeil' },
  ],
  ppc: [
    { label: 'Santé Respiratoire France', url: 'https://sante-respiratoire.com/diagnostic-dapnees-du-sommeil-ce-que-jaurais-aime-que-lon-me-dise/' },
    { label: 'Alliance Apnées', url: 'https://www.allianceapnees.org/diagnostic-et-traitement-de-lapnee-du-sommeil-quel-accompagnement/' },
    { label: 'Philips', url: 'https://www.philips.fr/c-e/hs/apnee-du-sommeil/temoignages.html' },
    { label: 'April.fr', url: 'https://www.april.fr/complementaire-sante/guide/appareil-apnee-du-sommeil' },
  ],
  riskFactors: [
    { label: 'SFRMS', url: 'https://www.sfrms-sommeil.org/archives/communique-saos-le-bon-traitement-pour-le-bon-patient/' },
    { label: 'ResMed', url: 'https://www.syndrome-apnee-sommeil.fr/rencontres/temoignages-patients/' },
  ],
  emergency: [
    { label: 'Ameli.fr', url: 'https://www.ameli.fr/assure/sante/themes/apnee-du-sommeil/symptomes-diagnostic-evolution' },
  ],
}
</script>

<template>
  <div>
    <v-row justify="center" class="mb-16 pb-16 pt-6">
      <v-col :cols="$vuetify.display.mobile ? 12 : 9">
        <v-row>

          <!-- Header -->
          <v-col cols="12">
            <div :class="{ 'px-6': $vuetify.display.mobile }">
              <v-btn :prepend-icon="mdiChevronLeft" variant="text" class="text-none mb-3 ml-n2" @click="router.back()">
                Retour
              </v-btn>
              <div class="text-headline-medium font-weight-bold mb-1">Comprendre mon trouble du sommeil</div>
              <div class="text-body-small text-medium-emphasis">Un guide patient — pas à pas, sans jargon médical</div>
            </div>
          </v-col>

          <!-- 1. Checklist symptômes -->
          <v-col cols="12">
            <v-card class="card-shadow pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
                <span class="text-headline-small font-weight-bold">Les signes qui doivent alerter</span>
              </v-card-title>
              <v-card-text class="px-4 pt-3">
                <div class="text-body-small text-medium-emphasis mb-4">Cochez ceux que vous reconnaissez</div>
                <v-row>
                  <v-col cols="12" sm="6">
                    <div class="text-caption font-weight-bold text-medium-emphasis mb-2 text-uppercase">
                      🌙 La nuit
                    </div>
                    <v-checkbox v-for="s in symptomsNight" :key="s" v-model="checkedNight" :value="s" :label="s"
                      density="compact" hide-details color="primary" class="mb-1" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <div class="text-caption font-weight-bold text-medium-emphasis mb-2 text-uppercase">
                      ☀️ Le jour
                    </div>
                    <v-checkbox v-for="s in symptomsDay" :key="s" v-model="checkedDay" :value="s" :label="s"
                      density="compact" hide-details color="primary" class="mb-1" />
                  </v-col>
                </v-row>
                <v-alert :color="totalChecked >= 3 ? 'warning' : 'blue-grey-lighten-5'" variant="tonal" class="mt-4"
                  density="compact" rounded="lg">
                  <span v-if="totalChecked >= 3" class="font-weight-medium">
                    Vous avez coché {{ totalChecked }} symptômes — parlez-en à votre médecin traitant.
                  </span>
                  <span v-else class="text-medium-emphasis">
                    Si vous cochez 3 symptômes ou plus, parlez-en à votre médecin traitant.
                  </span>
                </v-alert>
                <div class="sources-footer">
                  <span class="source-label">Source :</span>
                  <a v-for="src in sources.symptoms" :key="src.url" :href="src.url" target="_blank" rel="noopener"
                    class="source-link">{{ src.label }}</a>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- 2. Chiffres de réassurance -->
          <v-col cols="12">
            <v-card class="card-shadow pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
                <span class="text-headline-small font-weight-bold">Vous n'êtes pas seul(e)</span>
              </v-card-title>
              <v-card-text class="px-4 pt-3">
                <div class="text-body-small text-medium-emphasis mb-4">
                  Ces chiffres montrent à quel point les troubles du sommeil sont répandus
                </div>
                <v-row>
                  <v-col cols="12" sm="4" class="text-center py-3">
                    <div class="text-h4 font-weight-bold text-primary mb-2">3 millions+</div>
                    <div class="text-body-small text-medium-emphasis">de Français concernés par l'apnée du sommeil</div>
                  </v-col>
                  <v-col cols="12" sm="4" class="text-center py-3">
                    <div class="text-h4 font-weight-bold text-warning mb-2">1 sur 3</div>
                    <div class="text-body-small text-medium-emphasis">
                      Français souffre d'insomnie
                      <span class="text-caption d-block mt-1">(Santé publique France, 2024)</span>
                    </div>
                  </v-col>
                  <v-col cols="12" sm="4" class="text-center py-3">
                    <div class="text-h4 font-weight-bold text-success mb-2">80 %</div>
                    <div class="text-body-small text-medium-emphasis">
                      des apnéiques ne sont pas encore diagnostiqués — vous n'avez pas à vous sentir coupable de ne pas
                      avoir consulté plus tôt
                    </div>
                  </v-col>
                </v-row>
                <div class="sources-footer">
                  <span class="source-label">Sources :</span>
                  <template v-for="(src, i) in sources.reassurance" :key="src.url">
                    <a :href="src.url" target="_blank" rel="noopener" class="source-link">{{ src.label }}</a>
                    <span v-if="i < sources.reassurance.length - 1" class="source-sep">·</span>
                  </template>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- 3. Risques -->
          <v-col cols="12">
            <v-card class="card-shadow pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
                <span class="text-headline-small font-weight-bold">Pourquoi agir maintenant ?</span>
              </v-card-title>
              <v-card-text class="px-4 pt-3">
                <div class="text-body-small text-medium-emphasis mb-3">Les conséquences d'un trouble du sommeil non
                  traité</div>
                <v-list lines="one" class="pa-0" bg-color="transparent">
                  <v-list-item v-for="r in risks" :key="r.text" :prepend-icon="r.icon" density="compact" rounded="lg"
                    class="mb-1 px-2">
                    <v-list-item-title class="text-wrap">{{ r.text }}</v-list-item-title>
                  </v-list-item>
                </v-list>
                <v-alert color="success" variant="tonal" class="mt-3" density="compact" rounded="lg">
                  <strong>Bonne nouvelle :</strong> traité, l'apnée du sommeil s'améliore souvent dès les premières
                  nuits.
                </v-alert>
                <div class="sources-footer">
                  <span class="source-label">Sources :</span>
                  <template v-for="(src, i) in sources.risks" :key="src.url">
                    <a :href="src.url" target="_blank" rel="noopener" class="source-link">{{ src.label }}</a>
                    <span v-if="i < sources.risks.length - 1" class="source-sep">·</span>
                  </template>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- 4. Parcours de soin -->
          <v-col cols="12">
            <v-card class="card-shadow pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
                <span class="text-headline-small font-weight-bold">Mon parcours de soin</span>
              </v-card-title>
              <v-card-text class="px-4 pt-3">
                <div class="text-body-small text-medium-emphasis mb-4">Les 4 étapes concrètes, de A à Z</div>
                <v-timeline side="end" density="compact" align="start">
                  <v-timeline-item v-for="(step, i) in timelineSteps" :key="i" :dot-color="step.color" :icon="step.icon"
                    size="small" fill-dot>
                    <div class="text-body-small font-weight-bold mb-1">{{ step.title }}</div>
                    <div class="text-body-small text-medium-emphasis">{{ step.desc }}</div>
                  </v-timeline-item>
                </v-timeline>
                <div class="sources-footer">
                  <span class="source-label">Sources :</span>
                  <template v-for="(src, i) in sources.pathway" :key="src.url">
                    <a :href="src.url" target="_blank" rel="noopener" class="source-link">{{ src.label }}</a>
                    <span v-if="i < sources.pathway.length - 1" class="source-sep">·</span>
                  </template>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- 5. Traitement PPC -->
          <v-col cols="12">
            <v-card class="card-shadow pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
                <span class="text-headline-small font-weight-bold">Le traitement PPC, c'est comment ?</span>
              </v-card-title>
              <div class="px-4 pt-2 pb-1">
                <span class="text-body-small text-medium-emphasis">Vos questions, nos réponses honnêtes</span>
              </div>
              <v-expansion-panels variant="accordion" flat class="mt-2">
                <v-expansion-panel v-for="faq in ppcFaq" :key="faq.title" :title="faq.title" :text="faq.text" />
              </v-expansion-panels>
              <div class="sources-footer px-4 pb-4">
                <span class="source-label">Sources :</span>
                <template v-for="(src, i) in sources.ppc" :key="src.url">
                  <a :href="src.url" target="_blank" rel="noopener" class="source-link">{{ src.label }}</a>
                  <span v-if="i < sources.ppc.length - 1" class="source-sep">·</span>
                </template>
              </div>
            </v-card>
          </v-col>

          <!-- 6. Facteurs de risque -->
          <v-col cols="12">
            <v-card class="card-shadow pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
                <span class="text-headline-small font-weight-bold">Suis-je plus à risque ?</span>
              </v-card-title>
              <v-card-text class="px-4 pt-3">
                <div class="text-body-small text-medium-emphasis mb-4">Les facteurs qui augmentent les probabilités
                </div>

                <div class="text-caption font-weight-bold text-medium-emphasis mb-1 text-uppercase">Facteurs importants
                </div>
                <v-chip-group column class="mb-2">
                  <v-chip v-for="f in riskFactorsHigh" :key="f" color="error" variant="tonal" size="small" label>
                    {{ f }}
                  </v-chip>
                </v-chip-group>

                <div class="text-caption font-weight-bold text-medium-emphasis mb-1 mt-1 text-uppercase">Facteurs
                  aggravants</div>
                <v-chip-group column class="mb-2">
                  <v-chip v-for="f in riskFactorsMedium" :key="f" color="warning" variant="tonal" size="small" label>
                    {{ f }}
                  </v-chip>
                </v-chip-group>

                <div class="text-caption font-weight-bold text-medium-emphasis mb-1 mt-1 text-uppercase">Facteurs
                  prédisposants
                </div>
                <v-chip-group column class="mb-3">
                  <v-chip v-for="f in riskFactorsLow" :key="f" color="info" variant="tonal" size="small" label>
                    {{ f }}
                  </v-chip>
                </v-chip-group>

                <div class="text-body-small text-medium-emphasis font-italic mb-1">
                  Mais l'apnée peut toucher n'importe qui, y compris les jeunes et les sportifs.
                </div>
                <div class="sources-footer">
                  <span class="source-label">Sources :</span>
                  <template v-for="(src, i) in sources.riskFactors" :key="src.url">
                    <a :href="src.url" target="_blank" rel="noopener" class="source-link">{{ src.label }}</a>
                    <span v-if="i < sources.riskFactors.length - 1" class="source-sep">·</span>
                  </template>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- 7. Signal d'alarme -->
          <v-col cols="12">
            <v-alert color="error" variant="tonal" :icon="mdiAlert" prominent
              :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <div class="text-body-small font-weight-bold mb-1">Quand consulter rapidement ?</div>
              <div class="text-body-small mb-2">
                Consultez rapidement si vous souffrez d'hypertension résistante aux médicaments, d'arythmie cardiaque,
                ou si vous avez failli vous endormir au volant.
              </div>
            </v-alert>
          </v-col>

        </v-row>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.card-shadow {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.08) !important;
}

.rounded-15 {
  border-radius: 15px !important;
}

.sources-footer {
  padding-top: 6px;
  text-align: right;
}

.source-label {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.35);
  margin-right: 4px;
}

.source-label--light {
  color: rgba(0, 0, 0, 0.4);
}

.source-link {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.35);
  text-decoration: none;
  transition: color 0.15s;
}

.source-link:hover {
  color: rgba(0, 0, 0, 0.55);
  text-decoration: underline;
}

.source-sep {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.25);
  margin: 0 4px;
}

.source-link--light {
  color: rgba(0, 0, 0, 0.4);
}

.source-link--light:hover {
  color: rgba(0, 0, 0, 0.6);
}

.v-checkbox :deep(.v-label) {
  padding-left: 10px;
}

:deep(.v-card-title) {
  white-space: normal;
}
</style>
