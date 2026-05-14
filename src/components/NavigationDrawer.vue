<script setup>
import logoInitials from "@/assets/img/logo-initials.svg"
import logo from "@/assets/img/logo.svg"
import { useNavigationItems } from "@/composables/useNavigationItems"
import { useSelfStore } from "@/stores/self"
import { mdiAccountOutline, mdiChevronLeft, mdiChevronRight, mdiCircle } from "@mdi/js"
import { computed, defineAsyncComponent, ref, watch } from "vue"
import { useRoute } from "vue-router"

const WelcomeNameDialog = defineAsyncComponent(() =>
  import("@/components/WelcomeNameDialog.vue")
)

const MINI_STORAGE_KEY = "mini"

const selfStore = useSelfStore()
const mini = ref(localStorage.getItem(MINI_STORAGE_KEY) === "true")
const { items, profileRoute } = useNavigationItems()
const route = useRoute()

const active = computed(() => items.value.length > 0)

const activeRouteName = computed(() => route.name)

const isProfileActive = computed(() =>
  activeRouteName.value === 'Profile' || activeRouteName.value === 'ProfileProfessional',
)

const needsName = computed(() => {
  const { id, firstName, lastName } = selfStore.item
  return !!id && (!firstName?.trim() || !lastName?.trim())
})

const hasUnreadMessages = computed(() => {
  const { lastMessageAt, messagesViewedAt } = selfStore.item
  if (!lastMessageAt) return false
  if (!messagesViewedAt) return true
  return lastMessageAt.toMillis() > messagesViewedAt.toMillis()
})

watch(mini, (val) => {
  localStorage.setItem(MINI_STORAGE_KEY, val)
})
</script>

<template>
  <WelcomeNameDialog v-if="needsName" />

  <!-- Mobile: Floating Bottom Navigation -->
  <div v-if="$vuetify.display.mobile && active" class="bottom-nav-wrap">
    <nav class="bottom-nav">
      <button v-for="(item, index) in items" :key="index" class="nav-item"
        :class="{ active: activeRouteName === item.to.name }" :aria-label="item.text" @click="$router.push(item.to)">
        <span class="nav-pill">
          <v-badge dot color="primary" location="top right" offset-x="2" offset-y="2"
            :model-value="item.id === 'messages' && hasUnreadMessages">
            <v-img :src="item.img" width="24" height="24" transition="fade-transition"
              :class="{ 'rounded-circle': item.rounded }" :cover="item.cover">
              <template v-slot:placeholder>
                <v-icon size="22">{{ item.icon }}</v-icon>
              </template>
            </v-img>
          </v-badge>
          <span class="nav-label">{{ item.text }}</span>
        </span>
      </button>
      <button class="nav-item" :class="{ active: isProfileActive }" aria-label="Profil"
        @click="$router.push(profileRoute)">
        <span class="nav-pill">
          <v-icon size="22" :icon="mdiAccountOutline"></v-icon>
          <span class="nav-label">Profil</span>
        </span>
      </button>
    </nav>
  </div>

  <!-- Desktop: Navigation Drawer -->
  <v-navigation-drawer v-else permanent class="card-shadow" :rail="mini" :rail-width="mini ? 64 : 100"
    style="border-right:0px">
    <v-row justify="center" class="mt-6 mb-4 px-2 cursor-pointer"
      @click="$router.push(items[0]?.to || { name: 'DashboardPatient' })">
      <v-img alt="Logo" class="shrink rounded-xs" :src="mini ? logoInitials : logo" transition="scale-transition"
        max-width="100%" width="100%" :max-height="mini ? 45 : 100" />
    </v-row>

    <v-list nav :selected="[activeRouteName]">
      <v-list-item v-for="item in items" :key="item.text" :value="item.to.name" color="primary" :to="item.to"
        :title="!mini ? item.text : ''" class="rounded-15">
        <template v-slot:prepend>
          <v-badge dot location="top right" color="primary" offset-x="0" offset-y="4"
            :model-value="item.id === 'messages' && hasUnreadMessages && mini">
            <v-img :src="item.img" :width="mini ? 33 : 45" :height="mini ? 33 : 45" class="my-1 "
              transition="fade-transition">
              <template v-slot:placeholder>
                <v-row class="fill-height ma-0" align="center" justify="center">
                  <v-icon>{{ item.icon }}</v-icon>
                </v-row>
              </template>
            </v-img>
          </v-badge>
        </template>
        <template v-slot:append v-if="item.id === 'messages' && hasUnreadMessages && !mini">
          <v-icon :icon="mdiCircle" size="12" class="mr-2" color="primary"></v-icon>
        </template>
        <v-tooltip activator="parent" location="start" :disabled="!mini">{{ item.text }}</v-tooltip>
      </v-list-item>
    </v-list>

    <v-list density="compact" nav :selected="[activeRouteName]" style="position: absolute; bottom: 70px; width: 100%">
      <v-list-item :value="profileRoute.name" color="primary" :to="profileRoute" class="rounded-15">
        <template v-slot:title v-if="!mini">
          {{ selfStore.item.fullName }}
        </template>
        <template v-slot:subtitle v-if="!mini">
          {{ selfStore.item.email }}
        </template>
        <template v-slot:prepend>
          <v-img :src="selfStore.item.avatarUrl" :width="mini ? 33 : 50" :height="mini ? 33 : 50"
            class="rounded-circle my-1 mr-3" cover transition="fade-transition">
            <template v-slot:placeholder>
              <v-row class="fill-height ma-0" align="center" justify="center">
                <v-icon color="#7a7a7a" :icon="mdiAccountOutline"></v-icon>
              </v-row>
            </template>
            <v-tooltip activator="parent" location="start" :disabled="!mini">Profil</v-tooltip>
          </v-img>
        </template>
      </v-list-item>
    </v-list>

    <v-row justify="center" @click="mini = !mini" style="position: absolute; bottom: 20px; left: 8px">
      <v-tooltip right :disabled="!mini">
        <template v-slot:activator="{ props }">
          <v-btn :icon="mini ? mdiChevronRight : mdiChevronLeft" flat v-bind="props" rounded="lg"></v-btn>
        </template>
        <span>Développer le menu</span>
      </v-tooltip>
    </v-row>
  </v-navigation-drawer>
</template>

<style scoped>
.bottom-nav-wrap {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  justify-content: center;
  padding: 12px 16px max(20px, env(safe-area-inset-bottom));
  pointer-events: none;
}

.bottom-nav {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 32px;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.65);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.10),
    0 1px 4px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  pointer-events: all;
  max-width: 420px;
  width: 100%;
}

.nav-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.nav-item:active {
  transform: scale(0.88);
}

.nav-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 8px;
  border-radius: 26px;
  width: 100%;
  color: rgba(0, 0, 0, 0.35);
  transition:
    background 0.28s cubic-bezier(0.34, 1.56, 0.64, 1),
    color 0.2s ease;
}

.nav-item.active .nav-pill {
  background: rgba(var(--v-theme-primary), 0.13);
  color: rgb(var(--v-theme-primary));
}

.nav-item:not(.active):hover .nav-pill {
  background: rgba(0, 0, 0, 0.05);
  color: rgba(0, 0, 0, 0.55);
}

.nav-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.1px;
  white-space: nowrap;
  line-height: 1;
}

.nav-item.active .nav-label {
  font-weight: 600;
}
</style>