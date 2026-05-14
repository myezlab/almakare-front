export const PERMISSION_CATEGORIES = [
  { id: 'patients', label: 'Patients' },
  { id: 'medical', label: 'Dossier médical' },
  { id: 'hospitalization', label: 'Hospitalisation' },
  { id: 'sleep', label: 'Sommeil' },
  { id: 'team', label: 'Équipe' },
  { id: 'messaging', label: 'Messagerie' },
  { id: 'admin', label: 'Administratif' },
  { id: 'system', label: 'Système' },
]

export const PERMISSIONS = [
  // Patients
  { id: 'patients.view', category: 'patients', label: 'Consulter la liste des patients', description: 'Voir la liste et les fiches des patients suivis.' },
  { id: 'patients.create', category: 'patients', label: 'Ajouter un patient', description: 'Créer une nouvelle fiche patient.' },
  { id: 'patients.edit', category: 'patients', label: 'Modifier une fiche patient', description: 'Mettre à jour les informations d\'un patient.' },
  { id: 'patients.delete', category: 'patients', label: 'Supprimer un patient', description: 'Archiver ou supprimer définitivement un patient.' },
  { id: 'patients.export', category: 'patients', label: 'Exporter les données patients', description: 'Exporter les fiches au format PDF ou CSV.' },

  // Dossier médical
  { id: 'medical.view', category: 'medical', label: 'Consulter le dossier médical', description: 'Accéder aux antécédents et observations cliniques.' },
  { id: 'medical.edit', category: 'medical', label: 'Modifier le dossier médical', description: 'Ajouter des observations et notes cliniques.' },
  { id: 'medical.prescription', category: 'medical', label: 'Rédiger une ordonnance', description: 'Émettre des prescriptions médicales.' },
  { id: 'medical.diagnostic', category: 'medical', label: 'Poser un diagnostic', description: 'Enregistrer un diagnostic dans le dossier.' },
  { id: 'medical.history', category: 'medical', label: 'Voir l\'historique complet', description: 'Consulter l\'historique long du patient.' },

  // Hospitalisation
  { id: 'hospitalization.view', category: 'hospitalization', label: 'Voir le parcours d\'hospitalisation', description: 'Suivre les étapes du parcours patient.' },
  { id: 'hospitalization.create', category: 'hospitalization', label: 'Créer un parcours', description: 'Initier un nouveau parcours d\'hospitalisation.' },
  { id: 'hospitalization.edit', category: 'hospitalization', label: 'Modifier les étapes', description: 'Mettre à jour le contenu des étapes.' },
  { id: 'hospitalization.validate', category: 'hospitalization', label: 'Valider une étape', description: 'Marquer une étape comme terminée.' },
  { id: 'hospitalization.cancel', category: 'hospitalization', label: 'Annuler une hospitalisation', description: 'Interrompre un parcours en cours.' },

  // Sommeil
  { id: 'sleep.view', category: 'sleep', label: 'Consulter l\'agenda du sommeil', description: 'Voir les enregistrements de sommeil du patient.' },
  { id: 'sleep.edit', category: 'sleep', label: 'Modifier l\'agenda du sommeil', description: 'Corriger ou compléter les saisies du patient.' },
  { id: 'sleep.epworth', category: 'sleep', label: 'Administrer le test d\'Epworth', description: 'Lancer et interpréter le test de somnolence.' },
  { id: 'sleep.polysomnography', category: 'sleep', label: 'Programmer une polysomnographie', description: 'Planifier un enregistrement nocturne.' },
  { id: 'sleep.stats', category: 'sleep', label: 'Voir les statistiques sommeil', description: 'Accéder aux indicateurs et tendances.' },

  // Équipe
  { id: 'team.view', category: 'team', label: 'Voir les membres de l\'équipe', description: 'Consulter la liste de l\'équipe.' },
  { id: 'team.invite', category: 'team', label: 'Inviter un nouveau membre', description: 'Envoyer une invitation à rejoindre l\'équipe.' },
  { id: 'team.edit', category: 'team', label: 'Modifier un membre', description: 'Mettre à jour le profil d\'un membre.' },
  { id: 'team.remove', category: 'team', label: 'Retirer un membre', description: 'Révoquer l\'accès d\'un membre.' },
  { id: 'team.permissions', category: 'team', label: 'Gérer les permissions', description: 'Configurer les droits des autres membres.' },

  // Messagerie
  { id: 'messaging.read', category: 'messaging', label: 'Lire les messages', description: 'Accéder à la messagerie interne.' },
  { id: 'messaging.send', category: 'messaging', label: 'Envoyer des messages', description: 'Communiquer avec patients et collègues.' },
  { id: 'messaging.broadcast', category: 'messaging', label: 'Envoyer un message groupé', description: 'Diffuser un message à plusieurs destinataires.' },
  { id: 'messaging.delete', category: 'messaging', label: 'Supprimer un message', description: 'Retirer un message de la conversation.' },

  // Administratif
  { id: 'admin.billing', category: 'admin', label: 'Gérer la facturation', description: 'Créer et suivre les factures patients.' },
  { id: 'admin.appointments', category: 'admin', label: 'Gérer les rendez-vous', description: 'Planifier, déplacer ou annuler des rendez-vous.' },
  { id: 'admin.documents', category: 'admin', label: 'Gérer les documents', description: 'Téléverser et organiser les documents administratifs.' },
  { id: 'admin.consent', category: 'admin', label: 'Gérer les consentements RGPD', description: 'Recueillir et conserver les consentements.' },
  { id: 'admin.reports', category: 'admin', label: 'Générer des rapports', description: 'Produire des rapports d\'activité.' },

  // Système
  { id: 'system.settings', category: 'system', label: 'Modifier les paramètres', description: 'Configurer l\'application.' },
  { id: 'system.integrations', category: 'system', label: 'Configurer les intégrations', description: 'Connecter les services tiers.' },
  { id: 'system.audit', category: 'system', label: 'Consulter les journaux d\'audit', description: 'Suivre les actions effectuées sur la plateforme.' },
  { id: 'system.notifications', category: 'system', label: 'Configurer les notifications', description: 'Paramétrer les alertes et rappels.' },
  { id: 'system.backup', category: 'system', label: 'Lancer une sauvegarde', description: 'Déclencher une sauvegarde manuelle.' },
  { id: 'system.devices', category: 'system', label: 'Gérer les appareils connectés', description: 'Appairer et configurer les capteurs et objets connectés.' },
]

export const ROLE_PRESETS = {
  doctor: [
    'patients.view', 'patients.edit', 'patients.export',
    'medical.view', 'medical.edit', 'medical.prescription', 'medical.diagnostic', 'medical.history',
    'hospitalization.view', 'hospitalization.edit', 'hospitalization.validate',
    'sleep.view', 'sleep.edit', 'sleep.epworth', 'sleep.polysomnography', 'sleep.stats',
    'team.view',
    'messaging.read', 'messaging.send',
    'admin.documents',
  ],
  coordinator: [
    'patients.view', 'patients.create', 'patients.edit', 'patients.export',
    'medical.view', 'medical.history',
    'hospitalization.view', 'hospitalization.create', 'hospitalization.edit', 'hospitalization.cancel',
    'sleep.view',
    'team.view', 'team.invite', 'team.edit', 'team.remove', 'team.permissions',
    'messaging.read', 'messaging.send', 'messaging.broadcast',
    'admin.billing', 'admin.appointments', 'admin.documents', 'admin.consent', 'admin.reports',
    'system.notifications',
  ],
  technician: [
    'patients.view',
    'hospitalization.view',
    'sleep.view', 'sleep.edit', 'sleep.polysomnography', 'sleep.stats',
    'team.view',
    'messaging.read', 'messaging.send',
    'system.devices',
  ],
}

export function getPresetFor(role) {
  return [...(ROLE_PRESETS[role] || [])]
}
