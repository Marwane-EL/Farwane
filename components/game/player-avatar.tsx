"use client"

export function isImageAvatar(avatar?: string | null): boolean {
  if (!avatar) return false
  return (
    avatar.startsWith("data:image/") ||
    avatar.startsWith("http://") ||
    avatar.startsWith("https://")
  )
}

/**
 * Center-crops and compresses an uploaded image file into a tiny square WebP/JPEG data URL (~2-4 KB).
 */
export async function compressImageToAvatarDataUrl(file: File, size = 96): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Sélectionne un fichier image valide")
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = objectUrl
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error("Impossible de lire cette image"))
    })

    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas non supporté")

    // Center-crop square
    const minSide = Math.min(img.naturalWidth, img.naturalHeight)
    const sx = (img.naturalWidth - minSide) / 2
    const sy = (img.naturalHeight - minSide) / 2

    ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size)

    const webp = canvas.toDataURL("image/webp", 0.8)
    if (webp.startsWith("data:image/webp")) return webp
    return canvas.toDataURL("image/jpeg", 0.82)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

interface PlayerAvatarProps {
  avatar?: string | null
  className?: string
  imgClassName?: string
}

export function PlayerAvatar({
  avatar,
  className = "",
  imgClassName = "w-6 h-6 rounded-full object-cover inline-block shrink-0",
}: PlayerAvatarProps) {
  const safe = avatar || "🎮"
  if (isImageAvatar(safe)) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={safe}
        alt="Avatar"
        className={`${imgClassName} ${className}`}
      />
    )
  }
  return <span className={className}>{safe}</span>
}
