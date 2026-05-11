import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

let isConfigured = false
let placesLibraryPromise = null

export async function loadPlacesLibrary() {
  if (!isConfigured) {
    setOptions({
      key: 'AIzaSyCN7012z6PqjD9mVK84XQnqA8bc2mL7aQ8',
      libraries: ['places'],
      version: 'weekly',
    })
    isConfigured = true
  }

  if (!placesLibraryPromise) {
    placesLibraryPromise = importLibrary('places')
  }

  return placesLibraryPromise
}