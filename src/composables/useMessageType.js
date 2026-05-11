import { mdiAlertDecagramOutline, mdiAlertOutline, mdiCheckCircleOutline, mdiInformationOutline, mdiTagOffOutline } from "@mdi/js"

export function useMessageType() {
  const TypeOptions = [
    { value: null, label: "NO_STATUS", icon: mdiTagOffOutline, color: "default" },
    { value: "success", label: "SUCCESS", icon: mdiCheckCircleOutline, color: "success" },
    { value: "info", label: "INFO", icon: mdiInformationOutline, color: "info" },
    { value: "warning", label: "WARNING", icon: mdiAlertOutline, color: "warning" },
    { value: "error", label: "URGENT", icon: mdiAlertDecagramOutline, color: "error" },
  ]

  function getTypeOption(value) {
    return TypeOptions.find((o) => o.value === value) || TypeOptions[2]
  }

  return { TypeOptions, getTypeOption }
}
