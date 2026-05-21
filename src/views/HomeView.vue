<script setup>
import organizedIllustration from '@/assets/illustrations/organized.svg'
import wakeUpIllustration from '@/assets/illustrations/wake-up.svg'
import logoText from '@/assets/img/logo-text-white.svg'
import logo from '@/assets/img/logo.svg'
import HomeFooter from '@/components/HomeFooter.vue'
import { useSelfStore } from '@/stores/self'
import {
  mdiAccountCheckOutline,
  mdiArrowDown,
  mdiArrowRight,
  mdiCalendarClockOutline,
  mdiChartLineVariant,
  mdiChartTimelineVariant,
  mdiClipboardPulseOutline,
  mdiHospitalBuilding,
  mdiLockCheckOutline,
  mdiShieldCheckOutline,
  mdiSleep
} from '@mdi/js'
import { useRouter } from 'vue-router'

const router = useRouter()
const selfStore = useSelfStore()

function goToSignUp() {
  router.push({ name: 'Login', query: { mode: 'signup' } })
}

function goToLogin() {
  router.push({ name: 'Login' })
}

function scrollToFeatures() {
  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
}

const stats = [
  { value: '2,5M', label: 'Personnes concernées en France' },
  { value: '80%', label: 'Des cas non diagnostiqués' },
  { value: '24/7', label: 'Accès à votre suivi' },
]

const features = [
  {
    icon: mdiSleep,
    title: 'Agenda du sommeil',
    description: 'Notez vos nuits, votre énergie au réveil et identifiez les schémas qui impactent votre sommeil.',
    color: '#5B7DB1',
  },
  {
    icon: mdiClipboardPulseOutline,
    title: "Test d'Epworth",
    description: "Évaluez votre somnolence diurne avec le questionnaire de référence, à compléter en 2 minutes.",
    color: '#7FB3D5',
  },
  {
    icon: mdiCalendarClockOutline,
    title: 'Rendez-vous en ligne',
    description: 'Réservez vos consultations avec des spécialistes du sommeil de votre centre, en quelques clics.',
    color: '#4FC3F7',
  },
  {
    icon: mdiHospitalBuilding,
    title: "Parcours d'hospitalisation",
    description: 'Suivez chaque étape de votre hospitalisation, de la préparation au compte rendu post-examen.',
    color: '#1976D2',
  },
  {
    icon: mdiChartLineVariant,
    title: 'Tableau de bord',
    description: 'Visualisez votre IAH, votre IMC et vos indicateurs de santé du sommeil au même endroit.',
    color: '#3949AB',
  },
  {
    icon: mdiShieldCheckOutline,
    title: 'Données sécurisées',
    description: 'Vos données de santé sont hébergées et protégées selon les normes françaises en vigueur.',
    color: '#5E35B1',
  },
]

const steps = [
  {
    icon: mdiAccountCheckOutline,
    title: 'Créez votre compte',
    description: 'Inscription gratuite en moins d\'une minute, sans engagement.',
  },
  {
    icon: mdiClipboardPulseOutline,
    title: 'Complétez votre profil',
    description: "Renseignez vos données médicales pour un suivi personnalisé adapté à votre situation.",
  },
  {
    icon: mdiChartTimelineVariant,
    title: 'Démarrez votre suivi',
    description: 'Accédez à vos outils, prenez rendez-vous et suivez votre progression au quotidien.',
  },
]
</script>

<template>
  <div class="landing-wrapper" :class="{ 'is-mobile': $vuetify.display.mobile }">
    <!-- =============== TOP BAR =============== -->
    <header class="top-bar">
      <div class="top-bar-inner d-flex align-center justify-space-between px-6 px-md-10 py-4">
        <div class="d-flex align-center" style="cursor: pointer;" @click="$router.push('/')">
          <img :src="logo" alt="almakare" class="top-logo" width="auto" :height="$vuetify.display.mobile ? 40 : 48" />
        </div>
        <div class="d-flex align-center ga-2">
          <v-btn v-if="!selfStore.item.id" variant="text" color="primary" rounded="lg" class="text-none"
            :size="$vuetify.display.mobile ? 'small' : 'default'" @click="goToLogin">
            Se connecter
          </v-btn>
          <v-btn v-if="!selfStore.item.id" color="primary" variant="flat" rounded="lg" class="text-none"
            :size="$vuetify.display.mobile ? 'small' : 'default'" @click="goToSignUp">
            S'inscrire
          </v-btn>
          <v-btn v-else color="primary" variant="flat" rounded="lg" class="text-none"
            :size="$vuetify.display.mobile ? 'small' : 'default'" @click="router.push({ name: 'Accueil' })">
            Mon tableau de bord
          </v-btn>
        </div>
      </div>
    </header>

    <!-- =============== HERO =============== -->
    <section class="hero background-image">
      <v-container class="hero-container" :class="$vuetify.display.mobile ? 'px-4 py-8' : 'px-8 py-16'">
        <v-row align="center" justify="center" no-gutters>
          <v-col cols="12" md="6" :class="$vuetify.display.mobile ? 'text-center mb-8' : 'pe-md-8'">

            <h1 class="hero-title" :class="$vuetify.display.mobile ? 'text-headline-medium' : 'text-display-small'">
              Reprenez le contrôle de vos nuits, <span class="hero-highlight">à votre rythme</span>.
            </h1>
            <p class="hero-subtitle text-medium-emphasis mt-4"
              :class="$vuetify.display.mobile ? 'text-body-medium' : 'text-body-large'">
              Almakare accompagne les patients atteints d'apnée du sommeil à chaque étape :
              suivi quotidien, consultations spécialisées, parcours hospitalier et données regroupées en un seul
              endroit.
            </p>

            <div class="hero-cta-group mt-8" :class="$vuetify.display.mobile ? 'justify-center' : ''">
              <v-btn color="primary" rounded="lg" flat :size="$vuetify.display.mobile ? 'large' : 'x-large'"
                class="text-none font-weight-bold hero-cta" :append-icon="mdiArrowRight" @click="goToSignUp">
                Créer mon compte gratuit
              </v-btn>
              <v-btn variant="text" color="primary" rounded="lg" :size="$vuetify.display.mobile ? 'large' : 'x-large'"
                class="text-none ml-md-2 mt-3 mt-md-0" :append-icon="mdiArrowDown" @click="scrollToFeatures">
                Découvrir
              </v-btn>
            </div>

            <div class="hero-trust mt-6" :class="$vuetify.display.mobile ? 'justify-center' : ''">
              <div class="trust-item">
                <v-icon :icon="mdiLockCheckOutline" size="18" color="primary" class="mr-1" />
                <span class="text-body-small text-medium-emphasis">Données chiffrées</span>
              </div>
              <div class="trust-item">
                <v-icon :icon="mdiShieldCheckOutline" size="18" color="primary" class="mr-1" />
                <span class="text-body-small text-medium-emphasis">Conforme RGPD</span>
              </div>
            </div>
          </v-col>

          <v-col cols="12" md="6" class="d-flex justify-center">
            <div class="hero-illustration-wrap">
              <div class="hero-blob"></div>
              <img :src="wakeUpIllustration" alt="" class="hero-illustration" />
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- =============== STATS BAND =============== -->
    <section class="stats-band">
      <v-container :class="$vuetify.display.mobile ? 'px-4 py-8' : 'px-8 py-10'">
        <v-row no-gutters>
          <v-col v-for="(s, i) in stats" :key="i" cols="12" sm="4" class="text-center px-2 py-3">
            <div class="stat-value">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- =============== FEATURES =============== -->
    <section id="features" class="features-section">
      <v-container :class="$vuetify.display.mobile ? 'px-4 py-12' : 'px-8 py-16'">
        <div class="section-head text-center mb-10">
          <div class="section-eyebrow">Vos outils au quotidien</div>
          <h2 class="section-title" :class="$vuetify.display.mobile ? 'text-headline-small' : 'text-headline-medium'">
            Tout ce qu'il vous faut pour <span class="hero-highlight">mieux dormir</span>
          </h2>
          <p class="section-lead text-medium-emphasis mt-3"
            :class="$vuetify.display.mobile ? 'text-body-medium' : 'text-body-large'">
            Une suite d'outils pensée avec des spécialistes du sommeil, simple à utiliser
            depuis votre téléphone ou votre ordinateur.
          </p>
        </div>

        <v-row>
          <v-col v-for="(f, i) in features" :key="i" cols="12" sm="6" md="4">
            <v-card class="feature-card h-100 pa-6" rounded="xl" elevation="0">
              <div class="feature-icon-wrap mb-4" :style="{ background: `${f.color}1a`, color: f.color }">
                <v-icon :icon="f.icon" size="28" :color="f.color" />
              </div>
              <div class="text-title-medium font-weight-bold mb-2">{{ f.title }}</div>
              <div class="text-body-medium text-medium-emphasis">{{ f.description }}</div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- =============== HIGHLIGHT BAND =============== -->
    <section class="highlight-section">
      <v-container :class="$vuetify.display.mobile ? 'px-4 py-12' : 'px-8 py-16'">
        <v-row align="center">
          <v-col cols="12" md="6" :class="$vuetify.display.mobile ? 'order-2 text-center' : ''">
            <div class="section-eyebrow">Un parcours coordonné</div>
            <h2 class="section-title mt-2"
              :class="$vuetify.display.mobile ? 'text-headline-small' : 'text-headline-medium'">
              Du dépistage à l'appareillage,<br />vous n'êtes plus seul.
            </h2>
            <p class="text-medium-emphasis mt-4"
              :class="$vuetify.display.mobile ? 'text-body-medium' : 'text-body-large'">
              Almakare connecte votre suivi quotidien à votre équipe médicale.
              Les médecins du sommeil, ORL et techniciens partagent les bonnes informations,
              au bon moment, pour des décisions plus rapides et plus sûres.
            </p>
            <ul class="bullet-list mt-5" :class="$vuetify.display.mobile ? 'd-inline-block text-start' : ''">
              <li><v-icon :icon="mdiAccountCheckOutline" size="18" color="primary" class="mr-2" />
                Visualisez les disponibilités de votre équipe</li>
              <li><v-icon :icon="mdiCalendarClockOutline" size="18" color="primary" class="mr-2" />
                Réservez un créneau sans appel téléphonique</li>
              <li><v-icon :icon="mdiHospitalBuilding" size="18" color="primary" class="mr-2" />
                Préparez votre nuit d'enregistrement sereinement</li>
            </ul>
          </v-col>
          <v-col cols="12" md="6"
            :class="$vuetify.display.mobile ? 'order-1 mb-6 text-center' : 'd-flex justify-center'">
            <img :src="organizedIllustration" alt="" class="highlight-illustration" />
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- =============== HOW IT WORKS =============== -->
    <section class="how-section">
      <v-container :class="$vuetify.display.mobile ? 'px-4 py-12' : 'px-8 py-16'">
        <div class="section-head text-center mb-10">
          <div class="section-eyebrow">En 3 étapes</div>
          <h2 class="section-title" :class="$vuetify.display.mobile ? 'text-headline-small' : 'text-headline-medium'">
            Démarrez en moins de 5 minutes
          </h2>
        </div>

        <v-row justify="center">
          <v-col v-for="(step, i) in steps" :key="i" cols="12" md="4">
            <div class="step-card">
              <div class="step-number">{{ String(i + 1).padStart(2, '0') }}</div>
              <div class="step-icon-wrap">
                <v-icon :icon="step.icon" size="32" color="primary" />
              </div>
              <div class="text-title-medium font-weight-bold mt-3 mb-2">{{ step.title }}</div>
              <div class="text-body-medium text-medium-emphasis">{{ step.description }}</div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- =============== TESTIMONIAL =============== -->
    <section class="testimonial-section">
      <v-container :class="$vuetify.display.mobile ? 'px-4 py-12' : 'px-8 py-16'">
        <v-row justify="center">
          <v-col cols="12" md="8" lg="7">
            <v-card class="testimonial-card pa-8 pa-md-10" rounded="xl" elevation="0">
              <div class="testimonial-quote">«</div>
              <p class="testimonial-text" :class="$vuetify.display.mobile ? 'text-body-large' : 'text-headline-small'">
                Avant Almakare, je notais mes nuits dans un carnet et j'oubliais la moitié pour ma consultation.
                Maintenant tout est dans un même endroit, et mon pneumologue voit en un coup d'œil
                comment je progresse.
              </p>
              <div class="d-flex align-center mt-6">
                <v-avatar size="48" color="primary" variant="tonal" class="mr-3">
                  <span class="font-weight-bold">MC</span>
                </v-avatar>
                <div>
                  <div class="font-weight-bold">Marie C.</div>
                  <div class="text-body-small text-medium-emphasis">Patiente suivie depuis 8 mois</div>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- =============== FINAL CTA =============== -->
    <section class="final-cta">
      <v-container :class="$vuetify.display.mobile ? 'px-4 py-12' : 'px-8 py-16'">
        <v-row justify="center">
          <v-col cols="12" md="10" lg="9">
            <v-card class="cta-card pa-8 pa-md-12 text-center" rounded="xl" elevation="0" theme="dark">
              <img :src="logoText" alt="almakare" :height="$vuetify.display.mobile ? 40 : 56" class="mb-4" />
              <h2 class="cta-title" :class="$vuetify.display.mobile ? 'text-headline-small' : 'text-headline-medium'">
                Prêt à mieux dormir ?
              </h2>
              <p class="cta-subtitle text-medium-emphasis mt-3"
                :class="$vuetify.display.mobile ? 'text-body-medium' : 'text-body-large'">
                Rejoignez les patients qui prennent leur santé du sommeil en main.
                Création de compte gratuite, sans carte bancaire.
              </p>
              <div class="cta-button-wrap mt-8">
                <v-btn color="primary" rounded="lg" flat :size="$vuetify.display.mobile ? 'large' : 'x-large'"
                  class="text-none font-weight-bold cta-button" :append-icon="mdiArrowRight" @click="goToSignUp">
                  Créer mon compte gratuit
                </v-btn>
              </div>
              <div class="mt-4 text-body-small text-medium-emphasis">
                Déjà un compte ?
                <a class="cta-link" @click="goToLogin">Se connecter</a>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <HomeFooter />
  </div>
</template>

<style scoped>
.landing-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #fafbfd;
}

/* =============== TOP BAR =============== */
.top-bar {
  position: sticky;
  top: 0;
  z-index: 50;
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: saturate(180%) blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.top-bar-inner {
  max-width: 1200px;
  margin: 0 auto;
}

.top-logo {
  width: auto;
  display: block;
  object-fit: contain;
}

/* =============== HERO =============== */
.hero {
  position: relative;
  overflow: hidden;
}

.hero-container {
  max-width: 1200px;
  position: relative;
  z-index: 1;
}

.hero-title {
  font-family: title !important;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.5px;
  color: #0c2949;
}

.hero-highlight {
  background: linear-gradient(120deg, rgba(127, 179, 213, 0.45), rgba(127, 179, 213, 0));
  padding: 0 4px;
  border-radius: 6px;
}

.hero-subtitle {
  max-width: 540px;
  line-height: 1.55;
}

.hero-cta-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.hero-cta {
  letter-spacing: 0.2px;
  box-shadow: 0 8px 24px rgba(18, 59, 109, 0.18) !important;
}

.hero-trust {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
}

.trust-item {
  display: inline-flex;
  align-items: center;
}

.hero-illustration-wrap {
  position: relative;
  width: 100%;
  max-width: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-illustration {
  position: relative;
  z-index: 1;
  width: 100%;
  max-height: 400px;
  object-fit: contain;
}

.is-mobile .hero-illustration {
  max-height: 320px;
}

.hero-blob {
  position: absolute;
  z-index: 0;
}

.is-mobile .hero-blob {
  inset: 15% 10%;
}

/* =============== STATS =============== */
.stats-band {
  background: linear-gradient(135deg, #123B6D, #1c5089);
  color: white;
}

.stat-value {
  font-family: title !important;
  font-size: 36px;
  font-weight: 800;
  color: white;
  letter-spacing: -0.5px;
}

.is-mobile .stat-value {
  font-size: 28px;
}

.stat-label {
  margin-top: 4px;
  font-size: 13.5px;
  color: rgba(255, 255, 255, 0.78);
  letter-spacing: 0.2px;
}

/* =============== SECTIONS =============== */
.section-head {
  max-width: 720px;
  margin-left: auto;
  margin-right: auto;
}

.section-eyebrow {
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: rgb(var(--v-theme-primary));
  margin-bottom: 8px;
}

.section-title {
  font-family: title !important;
  font-weight: 800;
  line-height: 1.2;
  color: #0c2949;
  letter-spacing: -0.4px;
}

.section-lead {
  line-height: 1.55;
}

/* =============== FEATURES =============== */
.features-section {
  background: white;
}

.feature-card {
  background: #fafbfd;
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 40px rgba(18, 59, 109, 0.08) !important;
  border-color: rgba(18, 59, 109, 0.15);
}

.feature-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* =============== HIGHLIGHT =============== */
.highlight-section {
  background: linear-gradient(180deg, #fafbfd, #f0f4f9);
}

.highlight-illustration {
  max-width: 100%;
  width: 480px;
  height: auto;
  object-fit: contain;
}

.bullet-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.bullet-list li {
  display: flex;
  align-items: center;
  padding: 6px 0;
  color: rgba(0, 0, 0, 0.75);
  font-size: 15px;
}

/* =============== HOW IT WORKS =============== */
.how-section {
  background: white;
}

.step-card {
  position: relative;
  padding: 32px 24px 24px;
  border-radius: 18px;
  background: #fafbfd;
  border: 1px solid rgba(0, 0, 0, 0.04);
  text-align: center;
  height: 100%;
}

.step-number {
  position: absolute;
  top: 12px;
  right: 16px;
  font-family: title;
  font-size: 28px;
  font-weight: 800;
  color: rgba(18, 59, 109, 0.12);
  letter-spacing: -0.5px;
}

.step-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(18, 59, 109, 0.08);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

/* =============== TESTIMONIAL =============== */
.testimonial-section {
  background: linear-gradient(180deg, #f0f4f9, #fafbfd);
}

.testimonial-card {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.04);
  box-shadow: 0 12px 40px rgba(18, 59, 109, 0.06) !important;
  position: relative;
}

.testimonial-quote {
  position: absolute;
  top: 8px;
  left: 24px;
  font-family: title;
  font-size: 100px;
  line-height: 1;
  color: rgba(18, 59, 109, 0.1);
}

.is-mobile .testimonial-quote {
  font-size: 70px;
  top: 0;
  left: 16px;
}

.testimonial-text {
  position: relative;
  font-family: main !important;
  font-weight: 500;
  color: #0c2949;
  line-height: 1.5;
}

/* =============== FINAL CTA =============== */
.final-cta {
  background: white;
}

.cta-card {
  background: linear-gradient(135deg, #123B6D, #1c5089);
  color: white;
  position: relative;
  overflow: hidden;
}

.cta-card::before {
  content: '';
  position: absolute;
  top: -30%;
  right: -10%;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(127, 179, 213, 0.35), transparent 70%);
}

.cta-card::after {
  content: '';
  position: absolute;
  bottom: -40%;
  left: -10%;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(127, 179, 213, 0.25), transparent 70%);
}

.cta-card>* {
  position: relative;
  z-index: 1;
}

.cta-title {
  font-family: title !important;
  font-weight: 800;
  color: white;
  letter-spacing: -0.4px;
}

.cta-subtitle {
  color: rgba(255, 255, 255, 0.85) !important;
  max-width: 540px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.55;
}

.cta-button {
  letter-spacing: 0.2px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18) !important;
  background-color: white !important;
  color: #123B6D !important;
}

.cta-link {
  color: rgba(255, 255, 255, 0.95);
  text-decoration: underline;
  cursor: pointer;
  font-weight: 600;
}

.cta-link:hover {
  color: white;
}
</style>
