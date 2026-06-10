// Fake "Établissements du sommeil" where a sleep recording (e.g. polygraphie
// ventilatoire nocturne) can be performed. Used by the slot-booking dialog on an
// acte that lets the patient pick where and when the exam takes place. Seed only —
// there is no admin UI to manage these (the app is patient-facing).
export const SLEEP_ESTABLISHMENTS = [
  {
    id: "sommeil-nantes",
    name: "Centre du Sommeil de Nantes",
    address: "12 rue de Strasbourg, 44000 Nantes"
  },
  {
    id: "sommeil-saint-herblain",
    name: "Clinique du Sommeil Atlantique",
    address: "3 boulevard Salvador Allende, 44800 Saint-Herblain"
  },
  {
    id: "sommeil-reze",
    name: "Laboratoire du Sommeil Sud-Loire",
    address: "8 avenue des Sorinières, 44400 Rezé"
  },
  {
    id: "sommeil-orvault",
    name: "Institut du Sommeil et de la Vigilance",
    address: "25 route de Vannes, 44700 Orvault"
  }
]
