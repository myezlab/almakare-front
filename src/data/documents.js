// Catalog of documents the patient can upload.
//
// Consumed by DocumentsTab (the full upload grid) and by ActivitesTab, where a
// consultation's `requestedDocuments` (in activities.json) references documents
// by `key` to show one upload card + dialog per requested document. Uploaded
// files live on the patient record at `selfStore.item.documents[key]` as
// `{ name, size, type, uploadedAt }`.
//
// `capture` drives the in-app camera (DocumentCaptureOverlay): `shape` picks the
// guide frame — 'card' for ID-1 cards (CNI, Vitale, mutuelle), 'page' for A4
// documents — and `guide` is the on-screen framing instruction.

import {
  mdiCardAccountDetailsOutline,
  mdiCreditCardOutline,
  mdiFileDocumentCheckOutline,
  mdiFileDocumentOutline,
  mdiFileSign,
  mdiShieldCheckOutline
} from "@mdi/js"

export const REQUIRED_DOCUMENTS = [
  {
    key: 'idFront',
    title: "Carte d'identité",
    subtitle: 'Recto',
    icon: mdiCardAccountDetailsOutline,
    accept: 'image/*,application/pdf',
    capture: { shape: 'card', guide: "Placez le recto de votre carte d'identité dans le cadre" }
  },
  {
    key: 'idBack',
    title: "Carte d'identité",
    subtitle: 'Verso',
    icon: mdiCardAccountDetailsOutline,
    accept: 'image/*,application/pdf',
    capture: { shape: 'card', guide: "Placez le verso de votre carte d'identité dans le cadre" }
  },
  {
    key: 'carteVitale',
    title: 'Carte vitale',
    subtitle: 'Attestation de droits',
    icon: mdiCreditCardOutline,
    accept: 'image/*,application/pdf',
    capture: { shape: 'card', guide: 'Placez votre carte Vitale dans le cadre' }
  },
  {
    key: 'mutuelle',
    title: 'Carte de mutuelle',
    subtitle: 'Complémentaire santé',
    icon: mdiShieldCheckOutline,
    accept: 'image/*,application/pdf',
    capture: { shape: 'card', guide: 'Placez votre carte de mutuelle dans le cadre' }
  },
  {
    key: 'priseEnCharge',
    title: 'Prise en charge',
    subtitle: 'Notification organisme',
    icon: mdiFileDocumentCheckOutline,
    accept: 'image/*,application/pdf',
    capture: { shape: 'page', guide: 'Cadrez votre notification de prise en charge' }
  }
]

export const ORDONNANCE_DOCUMENTS = [
  {
    key: 'lettreAdressage',
    title: "Lettre d'adressage",
    subtitle: 'Médecin référent',
    icon: mdiFileDocumentOutline,
    accept: 'image/*,application/pdf',
    capture: { shape: 'page', guide: "Cadrez la lettre d'adressage dans le cadre" }
  },
  {
    key: 'ordonnance',
    title: 'Ordonnance',
    subtitle: 'Prescription médicale',
    icon: mdiFileSign,
    accept: 'image/*,application/pdf',
    capture: { shape: 'page', guide: 'Cadrez votre ordonnance dans le cadre' }
  }
]

export const DOCUMENTS = [...REQUIRED_DOCUMENTS, ...ORDONNANCE_DOCUMENTS]

export const DOCUMENTS_BY_KEY = DOCUMENTS.reduce((acc, doc) => {
  acc[doc.key] = doc
  return acc
}, {})
