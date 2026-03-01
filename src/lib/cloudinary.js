const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

export const uploadQR = async (base64Image, publicId) => {
  const formData = new FormData()
  
  const response = await fetch(base64Image)
  const blob = await response.blob()
  
  formData.append('file', blob, `qr-${publicId}.png`)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('public_id', publicId) // ⭐ hapus folder prefix
  formData.append('folder', 'rptra/qr-form') // ⭐ pake folder parameter terpisah
  formData.append('api_key', API_KEY)

  const res = await fetch(CLOUDINARY_URL, {
    method: 'POST',
    body: formData
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error?.message || 'Upload failed')
  }

  return await res.json()
}

export const deleteQR = async (publicId) => {
  console.warn('Delete QR butuh server-side signature, lewati')
  return true
}