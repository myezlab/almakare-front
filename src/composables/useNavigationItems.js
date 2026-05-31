import { useSelfStore } from "@/stores/self"
import { mdiBell, mdiBellOutline, mdiChartLine, mdiFolder, mdiFolderOutline } from "@mdi/js"
import { computed } from "vue"

export function useNavigationItems() {
  const selfStore = useSelfStore()

  const profileRoute = computed(() => ({ name: "MonDossier" }))

  const items = computed(() => {
    if (!selfStore.item.id) return []
    return [
      { id: 'dashboard', text: 'Mon tableau de bord', shortText: 'Tableau de bord', icon: mdiChartLine, iconActive: mdiChartLine, to: { name: "Dashboard" } },
      { id: 'mon-dossier', text: 'Mon dossier', icon: mdiFolderOutline, iconActive: mdiFolder, to: { name: "MonDossier" } },
      { id: 'notifications', text: 'Notifications', icon: mdiBellOutline, iconActive: mdiBell, to: { name: "Notifications" } },
    ]
  })

  return {
    items,
    profileRoute,
  }
}
