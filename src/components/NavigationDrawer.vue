<script setup>
import logoInitials from "@/assets/img/logo-initials.svg"
import logo from "@/assets/img/logo.svg"
import { useNavigationItems } from "@/composables/useNavigationItems"
import { useReadState } from "@/composables/useReadState"
import notificationsData from "@/data/notifications.json"
import { mdiChevronLeft, mdiChevronRight } from "@mdi/js"
import { computed, ref, watch } from "vue"
import { useRoute } from "vue-router"

const MINI_STORAGE_KEY = "mini"

const mini = ref(localStorage.getItem(MINI_STORAGE_KEY) === "true")
const { items } = useNavigationItems()
const { isNotificationRead } = useReadState()
const route = useRoute()

// Number of unread notifications, surfaced as a badge on the Notifications nav item.
const unreadCount = computed(
  () => notificationsData.filter((n) => !isNotificationRead(n)).length,
)

const active = computed(() => items.value.length > 0)

const activeRouteName = computed(() => route.name)

// The Chat tab in Mon dossier is a full-screen conversation on mobile: hide the
// floating bottom nav so it doesn't overlap the message composer.
const hideBottomNav = computed(
  () => route.name === "MonDossier" && route.query.tab === "chat",
)

watch(mini, (val) => {
  localStorage.setItem(MINI_STORAGE_KEY, val)
})
</script>

<template>
  <!-- Mobile: Floating Bottom Navigation -->
  <div v-if="$vuetify.display.mobile && active && !hideBottomNav" class="bottom-nav-wrap">
    <nav class="bottom-nav">
      <button v-for="(item, index) in items" :key="index" class="nav-item"
        :class="{ active: activeRouteName === item.to.name }" :aria-label="item.text" @click="$router.push(item.to)">
        <span class="nav-pill">
          <v-badge :model-value="item.to.name === 'Notifications' && unreadCount > 0" :content="unreadCount"
            color="error" offset-x="-2" offset-y="-2">
            <v-img :src="item.img" width="24" height="24" transition="fade-transition"
              :class="{ 'rounded-circle': item.rounded }" :cover="item.cover">
              <template v-slot:placeholder>
                <v-icon size="22">{{ activeRouteName === item.to.name ? (item.iconActive || item.icon) : item.icon
                }}</v-icon>
              </template>
            </v-img>
          </v-badge>
          <span class="nav-label">{{ item.shortText || item.text }}</span>
        </span>
      </button>
    </nav>
  </div>

  <!-- Desktop: Navigation Drawer -->
  <v-navigation-drawer v-else-if="!$vuetify.display.mobile && active" permanent class="card-shadow" :rail="mini"
    :rail-width="mini ? 64 : 100" style="border-right:0px">
    <v-row justify="center" class="mt-6 mb-4 px-2 cursor-pointer"
      @click="$router.push(items[0]?.to || { name: 'Dashboard' })">
      <v-img alt="Logo" class="shrink rounded-xs" :src="mini ? logoInitials : logo" transition="scale-transition"
        max-width="100%" width="100%" :max-height="mini ? 45 : 100" />
    </v-row>

    <v-list nav :selected="[activeRouteName]">
      <template v-for="item in items" :key="item.id">
        <v-list-item :value="item.to.name" color="primary" :to="item.to" :title="!mini ? item.text : ''"
          class="rounded-15">
          <template v-slot:prepend>
            <v-badge :model-value="item.to.name === 'Notifications' && unreadCount > 0" :content="unreadCount"
              color="error" offset-x="6" offset-y="6">
              <v-img :src="item.img" :width="mini ? 33 : 45" :height="mini ? 33 : 45" class="my-1 "
                transition="fade-transition">
                <template v-slot:placeholder>
                  <v-row class="fill-height ma-0" align="center" justify="center">
                    <v-icon>{{ activeRouteName === item.to.name ? (item.iconActive || item.icon) :
                      item.icon
                    }}</v-icon>
                  </v-row>
                </template>
              </v-img>
            </v-badge>
          </template>
          <v-tooltip activator="parent" location="start" :disabled="!mini">{{ item.text }}</v-tooltip>
        </v-list-item>
      </template>
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

.nav-child-item {
  margin-left: 24px;
  min-height: 40px;
  font-size: 13px;
}
</style>