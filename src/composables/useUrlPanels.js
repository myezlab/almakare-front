import { ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"

const parse = (val) => {
  if (!val) return []
  return String(val).split(",").filter(Boolean)
}

const sameContents = (a, b) => {
  if (a.length !== b.length) return false
  const sa = [...a].sort()
  const sb = [...b].sort()
  return sa.every((v, i) => v === sb[i])
}

export function useUrlPanels(key) {
  const route = useRoute()
  const router = useRouter()

  const openPanels = ref(parse(route.query[key]))

  watch(
    () => route.query[key],
    (val) => {
      const next = parse(val)
      if (sameContents(next, openPanels.value)) return
      openPanels.value = next
    },
  )

  watch(
    openPanels,
    (val) => {
      const serialized = (val || []).join(",") || undefined
      const current = route.query[key] || undefined
      if (current === serialized) return
      const nextQuery = { ...route.query }
      if (serialized === undefined) delete nextQuery[key]
      else nextQuery[key] = serialized
      router.replace({ query: nextQuery })
    },
    { deep: true },
  )

  return openPanels
}
