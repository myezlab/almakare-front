import { useSelfStore } from "@/stores/self"
import { mdiChartLine } from "@mdi/js"
import { computed } from "vue"

export function useNavigationItems() {
  const selfStore = useSelfStore()

  const profileRoute = computed(() => ({ name: "DonneesPatient" }))

  const items = computed(() => {
    if (!selfStore.item.id) return []
    return [
      { id: 'dashboard', text: 'Dashboard', icon: mdiChartLine, iconActive: mdiChartLine, to: { name: "Dashboard" } },
    ]
  })

  return {
    items,
    profileRoute,
  }
}
