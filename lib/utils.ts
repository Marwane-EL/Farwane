import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function normalizeMemeUrls(urls: string[]): Promise<string[]> {
  const normalizedUrls = await Promise.all(
    urls.map(async (url) => {
      try {
        if (url.match(/^https?:\/\/(www\.)?tenor\.com\/(?:fr\/)?view\//i)) {
          const res = await fetch(url)
          if (!res.ok) return url
          const html = await res.text()
          const matches = html.match(/https:\/\/(?:media|c)\.tenor\.com\/[^"']+/g)
          if (matches && matches.length > 0) {
             const mp4Match = matches.find(m => m.endsWith('.mp4'))
             if (mp4Match) return mp4Match
             const gifMatch = matches.find(m => m.endsWith('.gif'))
             if (gifMatch) return gifMatch
             return matches[0]
          }
        }
        return url
      } catch (err) {
        return url
      }
    })
  )
  return normalizedUrls
}
