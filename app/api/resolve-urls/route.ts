import { NextResponse } from "next/server"

// Resolves Tenor page URLs (tenor.com/view/...) to direct media URLs (media.tenor.com/...)
// Non-Tenor URLs are returned as-is.

async function resolveTenorUrl(url: string): Promise<string> {
  if (!url.includes("tenor.com/view/")) return url

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; bot)" },
      redirect: "follow",
    })
    const html = await res.text()

    // Try extracting og:image / og:video meta tag (contains the direct media URL)
    const patterns = [
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
      /<meta[^>]*property=["']og:video["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:video["']/i,
      /content="(https:\/\/media\.tenor\.com\/[^"]+)"/i,
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match?.[1] && match[1].includes("media.tenor.com")) {
        return match[1]
      }
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

      // Small delay between batches to be nice to Tenor
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise((r) => setTimeout(r, 200))
      }
    }

    return NextResponse.json({ resolved })
  } catch {
    return NextResponse.json({ error: "Failed to resolve URLs" }, { status: 500 })
  }
}
