import { useSelfStore } from "@/stores/self"
import {
  mdiBellOutline,
  mdiViewDashboardOutline
} from "@mdi/js"
import { computed } from "vue"
import { useI18n } from "vue-i18n"

export function useNavigationItems() {
  const { t } = useI18n()
  const selfStore = useSelfStore()

  const items = computed(() => {
    if (selfStore.item.isAdmin) {
      return [
        { id: 'dashboard', text: t("HOME"), icon: mdiViewDashboardOutline, to: { name: "Dashboard" } },
        { id: 'notifications', text: t("NOTIFICATIONS"), icon: mdiBellOutline  , to: { name: "Notifications" } },
      ]
    } else if (selfStore.item.id) {
      return [
        { id: 'dashboard', text: t("HOME"), icon: mdiViewDashboardOutline, to: { name: "Dashboard" } },
        { id: 'notifications', text: t("NOTIFICATIONS"), icon: mdiBellOutline  , to: { name: "Notifications" } },
      ]
    }
    return []
  })

  return {
    items,
  }
}
