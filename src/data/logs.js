export const LOG_ACTIONS = {
  MEMBER_INVITED: 'MEMBER_INVITED',
  MEMBER_REMOVED: 'MEMBER_REMOVED',
  MEMBER_UPDATED: 'MEMBER_UPDATED',
  ORGANISATION_UPDATED: 'ORGANISATION_UPDATED',
  ORGANISATION_SERVICE_ADDED: 'ORGANISATION_SERVICE_ADDED',
  ORGANISATION_SERVICE_REMOVED: 'ORGANISATION_SERVICE_REMOVED',
  ESTABLISHMENT_CREATED: 'ESTABLISHMENT_CREATED',
  ESTABLISHMENT_UPDATED: 'ESTABLISHMENT_UPDATED',
  ESTABLISHMENT_REMOVED: 'ESTABLISHMENT_REMOVED',
  DEVICE_CREATED: 'DEVICE_CREATED',
  DEVICE_REMOVED: 'DEVICE_REMOVED',
  ACTE_CREATED: 'ACTE_CREATED',
  ACTE_UPDATED: 'ACTE_UPDATED',
  ACTE_REMOVED: 'ACTE_REMOVED',
}

export const LOG_FIELDS = {
  FIRST_NAME: 'FIRST_NAME',
  LAST_NAME: 'LAST_NAME',
  ROLES: 'ROLES',
  PERMISSIONS: 'PERMISSIONS',
  EMAIL: 'EMAIL',
  ORGANISATION_NAME: 'ORGANISATION_NAME',
  ORGANISATION_DESCRIPTION: 'ORGANISATION_DESCRIPTION',
  ORGANISATION_CREATED_AT: 'ORGANISATION_CREATED_AT',
  ORGANISATION_LOGO: 'ORGANISATION_LOGO',
  ESTABLISHMENT_NAME: 'ESTABLISHMENT_NAME',
  ESTABLISHMENT_LOCATION: 'ESTABLISHMENT_LOCATION',
  ESTABLISHMENT_LOGO: 'ESTABLISHMENT_LOGO',
}

const ACTION_LABELS = {
  [LOG_ACTIONS.MEMBER_INVITED]: ({ name } = {}) => `Invitation envoyée à "${name || ''}"`,
  [LOG_ACTIONS.MEMBER_REMOVED]: ({ name } = {}) => `Membre retiré "${name || ''}"`,
  [LOG_ACTIONS.MEMBER_UPDATED]: ({ name } = {}) => `Membre mis à jour "${name || ''}"`,
  [LOG_ACTIONS.ORGANISATION_UPDATED]: () => 'Détails de l\'organisation mis à jour',
  [LOG_ACTIONS.ORGANISATION_SERVICE_ADDED]: ({ name } = {}) => `Service activé "${name || ''}"`,
  [LOG_ACTIONS.ORGANISATION_SERVICE_REMOVED]: ({ name } = {}) => `Service désactivé "${name || ''}"`,
  [LOG_ACTIONS.ESTABLISHMENT_CREATED]: ({ name } = {}) => `Établissement créé "${name || ''}"`,
  [LOG_ACTIONS.ESTABLISHMENT_UPDATED]: ({ name } = {}) => `Établissement mis à jour "${name || ''}"`,
  [LOG_ACTIONS.ESTABLISHMENT_REMOVED]: ({ name } = {}) => `Établissement supprimé "${name || ''}"`,
  [LOG_ACTIONS.DEVICE_CREATED]: ({ name } = {}) => `Matériel ajouté "${name || ''}"`,
  [LOG_ACTIONS.DEVICE_REMOVED]: ({ name } = {}) => `Matériel retiré "${name || ''}"`,
  [LOG_ACTIONS.ACTE_CREATED]: ({ name } = {}) => `Acte créé "${name || ''}"`,
  [LOG_ACTIONS.ACTE_UPDATED]: ({ name } = {}) => `Acte mis à jour "${name || ''}"`,
  [LOG_ACTIONS.ACTE_REMOVED]: ({ name } = {}) => `Acte supprimé "${name || ''}"`,
}

const FIELD_LABELS = {
  [LOG_FIELDS.FIRST_NAME]: 'Prénom',
  [LOG_FIELDS.LAST_NAME]: 'Nom',
  [LOG_FIELDS.ROLES]: 'Rôles',
  [LOG_FIELDS.PERMISSIONS]: 'Permissions',
  [LOG_FIELDS.EMAIL]: 'Email',
  [LOG_FIELDS.ORGANISATION_NAME]: 'Nom',
  [LOG_FIELDS.ORGANISATION_DESCRIPTION]: 'Description',
  [LOG_FIELDS.ORGANISATION_CREATED_AT]: 'Date de création',
  [LOG_FIELDS.ORGANISATION_LOGO]: 'Logo',
  [LOG_FIELDS.ESTABLISHMENT_NAME]: 'Nom',
  [LOG_FIELDS.ESTABLISHMENT_LOCATION]: 'Localisation',
  [LOG_FIELDS.ESTABLISHMENT_LOGO]: 'Logo',
}

export const ROLE_LABELS = {
  doctor: 'Médecin',
  coordinator: 'Coordinateur',
  technician: 'Technicien',
}

export function formatLogTitle(log) {
  const builder = ACTION_LABELS[log?.action]
  if (builder) return builder(log.params)
  return log?.title || log?.action || ''
}

export function formatLogField(field) {
  return FIELD_LABELS[field] || field
}

export function formatLogValue(field, value) {
  if (value === undefined || value === null || value === '') return ''
  if (field === LOG_FIELDS.ROLES) {
    return String(value)
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean)
      .map((r) => ROLE_LABELS[r] || r)
      .join(', ')
  }
  return String(value)
}
