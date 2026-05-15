export const LOG_ACTIONS = {
  MEMBER_INVITED: 'MEMBER_INVITED',
  MEMBER_REMOVED: 'MEMBER_REMOVED',
  MEMBER_UPDATED: 'MEMBER_UPDATED',
  CENTRE_UPDATED: 'CENTRE_UPDATED',
  CENTRE_SERVICE_ADDED: 'CENTRE_SERVICE_ADDED',
  CENTRE_SERVICE_REMOVED: 'CENTRE_SERVICE_REMOVED',
}

export const LOG_FIELDS = {
  FIRST_NAME: 'FIRST_NAME',
  LAST_NAME: 'LAST_NAME',
  ROLES: 'ROLES',
  PERMISSIONS: 'PERMISSIONS',
  EMAIL: 'EMAIL',
  CENTRE_NAME: 'CENTRE_NAME',
  CENTRE_DESCRIPTION: 'CENTRE_DESCRIPTION',
  CENTRE_CREATED_AT: 'CENTRE_CREATED_AT',
  CENTRE_LOGO: 'CENTRE_LOGO',
}

const ACTION_LABELS = {
  [LOG_ACTIONS.MEMBER_INVITED]: ({ name } = {}) => `Invitation envoyée à "${name || ''}"`,
  [LOG_ACTIONS.MEMBER_REMOVED]: ({ name } = {}) => `Membre retiré "${name || ''}"`,
  [LOG_ACTIONS.MEMBER_UPDATED]: ({ name } = {}) => `Membre mis à jour "${name || ''}"`,
  [LOG_ACTIONS.CENTRE_UPDATED]: () => 'Détails du centre mis à jour',
  [LOG_ACTIONS.CENTRE_SERVICE_ADDED]: ({ name } = {}) => `Service activé "${name || ''}"`,
  [LOG_ACTIONS.CENTRE_SERVICE_REMOVED]: ({ name } = {}) => `Service désactivé "${name || ''}"`,
}

const FIELD_LABELS = {
  [LOG_FIELDS.FIRST_NAME]: 'Prénom',
  [LOG_FIELDS.LAST_NAME]: 'Nom',
  [LOG_FIELDS.ROLES]: 'Rôles',
  [LOG_FIELDS.PERMISSIONS]: 'Permissions',
  [LOG_FIELDS.EMAIL]: 'Email',
  [LOG_FIELDS.CENTRE_NAME]: 'Nom',
  [LOG_FIELDS.CENTRE_DESCRIPTION]: 'Description',
  [LOG_FIELDS.CENTRE_CREATED_AT]: 'Date de création',
  [LOG_FIELDS.CENTRE_LOGO]: 'Logo',
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
