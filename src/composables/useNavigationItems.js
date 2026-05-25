import { useSelfStore } from "@/stores/self"
import { mdiChartLine, mdiFolderOutline } from "@mdi/js"
import { computed } from "vue"

export function useNavigationItems() {
  const selfStore = useSelfStore()

  const profileRoute = computed(() => ({ name: "MonDossier" }))

  const items = computed(() => {
    if (!selfStore.item.id) return []
    return [
      { id: 'dashboard', text: 'Mon tableau de bord', icon: mdiChartLine, iconActive: mdiChartLine, to: { name: "Dashboard" } },
      { id: 'mon-dossier', text: 'Mon dossier', icon: mdiFolderOutline, iconActive: mdiFolderOutline, to: { name: "MonDossier" } },
    ]
  })

  return {
    items,
    profileRoute,
  }
}
