import { NextResponse } from "next/server"

// Resolves Tenor page URLs (tenor.com/view/...) to direct GIF URLs (media.tenor.com/...)
// Non-Tenor URLs are returned as-is.
// Strategy: Use Tenor oEmbed API to get thumbnail, then convert to GIF format.

async function resolveTenorUrl(url: string): Promise<string> {
  if (!url.includes("tenor.com/view/")) return url

  try {
    // Use Tenor's oEmbed API — reliable and doesn't require an API key
    const oembedUrl = `https://tenor.com/oembed?url=${encodeURIComponent(url)}`
    const res = await fetch(oembedUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; bot)" },
    })

    if (!res.ok) return url

    const data = await res.json()
    const thumbnail: string | undefined = data.thumbnail_url

    if (thumbnail && thumbnail.includes("media.tenor.com")) {
      // Convert thumbnail PNG to GIF format
      // Tenor thumbnail: https://media.tenor.com/XXAAAAN/name.png  (PNG preview)
      // Tenor GIF:       https://media.tenor.com/XXAAAAC/name.gif  (actual GIF)
      const gifUrl = thumbnail
        .replace(/AAAA[A-Z]\//, "AAAAC/")
        .replace(/\.png$/, ".gif")

      // Verify the GIF URL actually works
      try {
        const check = await fetch(gifUrl, { method: "HEAD" })
        if (check.ok) return gifUrl
      } catch {
        // If HEAD check fails, try the thumbnail as fallback
      }

      // Fallback: return thumbnail (at least it's a valid image)
      return thumbnail
    }

    return url
  } catch {
    return url
  }
}

// Process URLs in batches to avoid overwhelming Tenor
function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

export async function POST(request: Request) {
  try {
    const { urls } = (await request.json()) as { urls: string[] }

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: "Missing urls array" }, { status: 400 })
    }

    const resolved: string[] = new Array(urls.length)

    // Separate Tenor URLs from others
    const tenorIndices: number[] = []
    const tenorUrls: string[] = []

    urls.forEach((url, i) => {
      if (url.includes("tenor.com/view/")) {
        tenorIndices.push(i)
        tenorUrls.push(url)
      } else {
        resolved[i] = url // Pass through non-Tenor URLs
      }
    })

    // Resolve Tenor URLs in batches of 5
    const batches = chunk(tenorUrls, 5)
    let batchIdx = 0

    for (const batch of batches) {
      const results = await Promise.allSettled(batch.map(resolveTenorUrl))

      for (let j = 0; j < results.length; j++) {
        const globalIdx = tenorIndices[batchIdx + j]
        const result = results[j]
        resolved[globalIdx] =
          result.status === "fulfilled" ? result.value : tenorUrls[batchIdx + j]
      }

      batchIdx += batch.length

      // Small delay between batches
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise((r) => setTimeout(r, 200))
      }
    }

    return NextResponse.json({ resolved })
  } catch {
    return NextResponse.json({ error: "Failed to resolve URLs" }, { status: 500 })
  }
}
