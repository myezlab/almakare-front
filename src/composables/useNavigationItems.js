import { useSelfStore } from "@/stores/self"
import {
  mdiBellOutline,
  mdiViewDashboardOutline
} from "@mdi/js"
import { computed } from "vue"

export function useNavigationItems() {
  const selfStore = useSelfStore()

  const items = computed(() => {
    if (selfStore.item.isAdmin) {
      return [
        { id: 'dashboard', text: 'Accueil', icon: mdiViewDashboardOutline, to: { name: "DashboardPatient" } },
        { id: 'notifications', text: 'Notifications', icon: mdiBellOutline, to: { name: "Notifications" } },
      ]
    } else if (selfStore.item.id) {
      return [
        { id: 'dashboard', text: 'Accueil', icon: mdiViewDashboardOutline, to: { name: "DashboardPatient" } },
        { id: 'notifications', text: 'Notifications', icon: mdiBellOutline, to: { name: "Notifications" } },
      ]
    }
    return []
  })

  return {
    items,
  }
}
