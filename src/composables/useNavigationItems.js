import { useSelfStore } from "@/stores/self"
import { mdiCalendar, mdiCalendarOutline, mdiChat, mdiChatOutline, mdiHome, mdiHomeOutline } from "@mdi/js"
import { computed } from "vue"

export function useNavigationItems() {
  const selfStore = useSelfStore()

  const profileRoute = computed(() => ({ name: "Profile" }))

  const items = computed(() => {
    if (!selfStore.item.id) return []
    return [
      { id: 'accueil', text: 'Accueil', icon: mdiHomeOutline, iconActive: mdiHome, to: { name: "Accueil" } },
      { id: 'appointments', text: 'Agenda', icon: mdiCalendarOutline, iconActive: mdiCalendar, to: { name: "Agenda" } },
      { id: 'messages', text: 'Messages', icon: mdiChatOutline, iconActive: mdiChat, to: { name: "Messages" } },
    ]
  })

  return {
    items,
    profileRoute,
  }
}
