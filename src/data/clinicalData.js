// Demo clinical readings for the "Données cliniques" panel of "Mon dossier".
// These mirror the persistent clinical fields (CLINICAL_DISPLAY_KEYS in
// patientFields.js) so the panel always has content to show in the MVP. They are
// applied as fallbacks only — a real patient/doctor edit takes precedence.
export const FAKE_CLINICAL_DATA = {
  bloodPressure: '120/80 mmHg',
  oxygenSaturation: '98 %',
  iah: '18,5 /h',
}
