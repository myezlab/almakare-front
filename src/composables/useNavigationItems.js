import { useSelfStore } from "@/stores/self"
import { mdiCalendar, mdiCalendarOutline, mdiHome, mdiHomeOutline, mdiMessage, mdiMessageOutline } from "@mdi/js"
import { computed } from "vue"

export function useNavigationItems() {
  const selfStore = useSelfStore()

  const profileRoute = computed(() => ({ name: "Profile" }))

  const items = computed(() => {
    if (!selfStore.item.id) return []
    return [
      { id: 'accueil', text: 'Accueil', icon: mdiHomeOutline, iconActive: mdiHome, to: { name: "Accueil" } },
      { id: 'appointments', text: 'Rendez-vous', icon: mdiCalendarOutline, iconActive: mdiCalendar, to: { name: "BookAppointment" } },
      { id: 'messages', text: 'Messages', icon: mdiMessageOutline, iconActive: mdiMessage, to: { name: "Messages" } },
    ]
  })

  return {
    items,
    profileRoute,
  }
}
