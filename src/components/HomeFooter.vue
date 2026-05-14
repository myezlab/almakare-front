<script setup>
import logo from '@/assets/img/logo.svg'
import { useDisplay } from 'vuetify'

const { mobile } = useDisplay()

const year = new Date().getFullYear()

const links = [
  { label: 'À propos', href: '#' },
  { label: 'Mentions légales', href: '#' },
  { label: 'Confidentialité', href: '#' },
  { label: 'Conditions d\'utilisation', href: '#' },
  { label: 'Contact', href: '#' },
]
</script>

<template>
  <footer class="home-footer">
    <v-container class="py-8" :class="mobile ? 'px-4' : 'px-8'">
      <div class="d-flex flex-column align-center text-center">
        <img :src="logo" alt="almakare" :height="mobile ? 40 : 48" class="mb-3" />
        <p class="text-body-small text-medium-emphasis mb-4" style="max-width: 480px;">
          La plateforme dédiée à la prise en charge de l'apnée du sommeil
        </p>

        <div class="footer-links d-flex flex-wrap justify-center mb-4">
          <a v-for="link in links" :key="link.label" :href="link.href" class="footer-link text-body-small">
            {{ link.label }}
          </a>
        </div>

        <p class="text-caption text-medium-emphasis mb-0">
          © {{ year }} almakare. Tous droits réservés.
        </p>
      </div>
    </v-container>
  </footer>
</template>

<style scoped>
.home-footer {
  width: 100%;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
}

.footer-links {
  gap: 8px 20px;
}

.footer-link {
  color: rgba(0, 0, 0, 0.7);
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: #123B6D;
}
</style>
