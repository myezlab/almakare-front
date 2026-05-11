import { functions } from "@/firebase"
import { httpsCallable } from "firebase/functions"
const callUploadPicture = httpsCallable(functions, "pictures-uploadPicture")
const callUploadPictureOnly = httpsCallable(functions, "pictures-uploadPictureOnly")

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = reject
  reader.readAsDataURL(file)
})

export function usePicture() {

  async function uploadPicture({ pictureName, pictureData, storagePath, docPath, hasThumbnail = false }) {
    const pictureUrl = URL.createObjectURL(pictureData)

    fileToBase64(pictureData).then(base64Data => 
      callUploadPicture({
        pictureData: base64Data,
        pictureName,
        storagePath,
        docPath,
        hasThumbnail
      })
    )

    return { pictureUrl }
  }

  async function uploadPictureOnly({ pictureName, pictureData, storagePath, hasThumbnail = false }) {
    const [base64Data, pictureUrl] = await Promise.all([
      fileToBase64(pictureData),
      Promise.resolve(URL.createObjectURL(pictureData))
    ])

    const { data } = await callUploadPictureOnly({
      pictureData: base64Data,
      pictureName,
      storagePath,
      hasThumbnail
    })

    return data
  }

  return { uploadPicture, uploadPictureOnly }
}

