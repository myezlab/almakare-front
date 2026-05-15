import { useSelfStore } from "@/stores/self"
import {
  mdiAccountGroupOutline,
  mdiOfficeBuildingOutline,
  mdiStethoscope,
  mdiViewDashboardOutline
} from "@mdi/js"
import { computed } from "vue"

export function useNavigationItems() {
  const selfStore = useSelfStore()

  const dashboardRouteByRole = {
    patient: "DashboardPatient",
    doctor: "DashboardDoctor",
    centre: "CentreSommeil",
  }

  const profileRouteByRole = {
    patient: "Profile",
    doctor: "ProfileProfessional",
    coordinator: "ProfileProfessional",
    technician: "ProfileProfessional",
    centre: "ProfileProfessional",
  }

  const profileRoute = computed(() => ({
    name: profileRouteByRole[selfStore.item.role] || "Profile",
  }))

  const items = computed(() => {
    if (!selfStore.item.id) return []
    const role = selfStore.item.role
    if (role === 'centre') {
      return [
        { id: 'centre', text: 'Centre du sommeil', icon: mdiOfficeBuildingOutline, to: { name: "CentreSommeil" } },
        { id: 'team', text: 'Équipe', icon: mdiAccountGroupOutline, to: { name: "Team" } },
      ]
    }
    const dashboardName = dashboardRouteByRole[role] || "DashboardPatient"
    const list = [
      { id: 'dashboard', text: 'Accueil', icon: mdiViewDashboardOutline, to: { name: dashboardName } }
    ]
    if (role === 'coordinator') {
      list.push({ id: 'team', text: 'Équipe', icon: mdiAccountGroupOutline, to: { name: "Team" } })
      list.push({ id: 'cabinet', text: 'Cabinet médical', icon: mdiStethoscope, to: { name: "CabinetMedical" } })
    }
    return list
  })

  return {
    items,
    profileRoute,
  }
}
