import { useSelfStore } from "@/stores/self"
import {
  mdiBellOutline,
  mdiViewDashboardOutline
} from "@mdi/js"
import { computed } from "vue"

export function useNavigationItems() {
  const selfStore = useSelfStore()

  const dashboardRouteByRole = {
    patient: "DashboardPatient",
    doctor: "DashboardDoctor",
  }

  const items = computed(() => {
    if (!selfStore.item.id) return []
    const dashboardName = dashboardRouteByRole[selfStore.item.role] || "DashboardPatient"
    return [
      { id: 'dashboard', text: 'Accueil', icon: mdiViewDashboardOutline, to: { name: dashboardName } },
      { id: 'notifications', text: 'Notifications', icon: mdiBellOutline, to: { name: "Notifications" } },
    ]
  })

  return {
    items,
  }
}
