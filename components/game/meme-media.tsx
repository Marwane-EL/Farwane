"use client"

interface MemeMediaProps {
  src: string
  alt: string
  className?: string
}

export function MemeMedia({ src, alt, className }: MemeMediaProps) {
  const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(src)

  if (isVideo) {
    return (
      <video
        src={src}
        className={className}
        autoPlay
        loop
        muted
        playsInline
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  )
}
