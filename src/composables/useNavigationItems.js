import { useSelfStore } from "@/stores/self"
import {
  mdiAccountGroupOutline,
  mdiAccountMultipleOutline,
  mdiOfficeBuildingOutline,
  mdiStethoscope,
  mdiViewDashboardOutline
} from "@mdi/js"
import { computed } from "vue"

export function useNavigationItems() {
  const selfStore = useSelfStore()

  const profileRouteByRole = {
    patient: "Profile",
    doctor: "ProfileProfessional",
    coordinator: "ProfileProfessional",
    technician: "ProfileProfessional",
  }

  const userRoles = computed(() => {
    const u = selfStore.item || {}
    if (Array.isArray(u.roles) && u.roles.length > 0) return u.roles
    if (u.role) return [u.role]
    return []
  })

  const profileRoute = computed(() => ({
    name: profileRouteByRole[userRoles.value[0]] || "Profile",
  }))

  const items = computed(() => {
    if (!selfStore.item.id) return []
    const roles = userRoles.value
    const establishment = selfStore.item.establishment
    const list = []
    const seen = new Set()
    const push = (item) => {
      if (seen.has(item.id)) return
      seen.add(item.id)
      list.push(item)
    }

    for (const role of roles) {
      if (role === 'patient') {
        push({ id: 'dashboard-patient', text: 'Accueil', icon: mdiViewDashboardOutline, to: { name: "DashboardPatient" } })
      } else if (role === 'doctor') {
        push({ id: 'patients', text: 'Patients', icon: mdiAccountMultipleOutline, to: { name: "Patients" } })
      } else if (role === 'coordinator') {
        if (establishment === 'centre') {
          push({ id: 'centre', text: 'Centre du sommeil', icon: mdiOfficeBuildingOutline, to: { name: "CentreSommeil" } })
        } else if (establishment === 'cabinet') {
          push({ id: 'cabinet', text: 'Cabinet médical', icon: mdiStethoscope, to: { name: "CabinetMedical" } })
        }
        push({ id: 'team', text: 'Équipe', icon: mdiAccountGroupOutline, to: { name: "Team" } })
      }
    }
    return list
  })

  return {
    items,
    profileRoute,
  }
}
