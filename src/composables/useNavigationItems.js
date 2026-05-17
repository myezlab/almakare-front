import { useOrganisationStore } from "@/stores/organisation"
import { useSelfStore } from "@/stores/self"
import {
  mdiAccountMultipleOutline,
  mdiCalendarClockOutline,
  mdiDomain,
  mdiOfficeBuildingOutline,
  mdiViewDashboardOutline
} from "@mdi/js"
import { computed } from "vue"

export function useNavigationItems() {
  const selfStore = useSelfStore()
  const organisationStore = useOrganisationStore()

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
        push({ id: 'calendar', text: 'Calendrier', icon: mdiCalendarClockOutline, to: { name: "Calendar" } })
      } else if (role === 'coordinator') {
        if (establishment === 'organisation') {
          const establishments = organisationStore.item?.establishments || []
          push({
            id: 'organisation',
            text: 'Organisation',
            icon: mdiOfficeBuildingOutline,
            to: { name: "Organisation" },
            children: establishments.map((e) => ({
              id: `establishment-${e.id}`,
              text: e.name,
              icon: mdiDomain,
              logoUrl: e.logoUrl,
              to: { name: "Establishment", params: { id: e.id } },
            })),
          })
        }
      }
    }
    return list
  })

  return {
    items,
    profileRoute,
  }
}
