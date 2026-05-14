import { useSelfStore } from "@/stores/self"
import {
  mdiAccountGroupOutline,
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

  const profileRouteByRole = {
    patient: "Profile",
    doctor: "ProfileProfessional",
    coordinator: "ProfileProfessional",
    technician: "ProfileProfessional",
  }

  const profileRoute = computed(() => ({
    name: profileRouteByRole[selfStore.item.role] || "Profile",
  }))

  const items = computed(() => {
    if (!selfStore.item.id) return []
    const role = selfStore.item.role
    const dashboardName = dashboardRouteByRole[role] || "DashboardPatient"
    const list = [
      { id: 'dashboard', text: 'Accueil', icon: mdiViewDashboardOutline, to: { name: dashboardName } },
      { id: 'notifications', text: 'Notifications', icon: mdiBellOutline, to: { name: "Notifications" } },
    ]
    if (role === 'coordinator') {
      list.push({ id: 'team', text: 'Équipe', icon: mdiAccountGroupOutline, to: { name: "Team" } })
    }
    return list
  })

  return {
    items,
    profileRoute,
  }
}
