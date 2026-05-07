/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * scripts/fix-cover-images.ts
 *
 * Retroactively fix the listing cover images: the original scraper saved
 * gallery photos but skipped each listing's `cover_image_url` (the BaT hero
 * shot). This script:
 *   1. Builds a map of scrapper records keyed by the 3-paragraph description
 *      slice the seeder used as vehicleHistory.
 *   2. For each DB listing whose vehicleHistory matches, downloads the BaT
 *      cover URL, uploads to Cloudflare Images (tagged project=jmm), and
 *      prepends it as the new cover (sortOrder 0, isCover=true).
 *   3. Marks the new media row with altText="cover_from_bat" so re-runs are
 *      idempotent.
 */

import { config as loadDotenv } from "dotenv"
loadDotenv({ path: ".env.local" })
loadDotenv({ path: ".env" })

import { PrismaClient } from "@prisma/client"
import fs from "node:fs"
import path from "node:path"

const prisma = new PrismaClient()

const SCRAPPER_ROOT = path.resolve(process.cwd(), "../japanese-scrapper")
const DATA_DIRS = [
  path.join(SCRAPPER_ROOT, "data"),
  path.join(SCRAPPER_ROOT, "data-older-1y"),
]

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN
const FIXED_MARKER = "cover_from_bat"

async function uploadUrlToCloudflare(url: string): Promise<string | null> {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    console.error("Missing CF credentials")
    return null
  }
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
    })
    if (!res.ok) {
      console.warn(`Fetch ${res.status} for ${url}`)
      return null
    }
    const buf = new Uint8Array(await res.arrayBuffer())
    const filename = url.split("/").pop()?.split("?")[0] || "cover.jpg"
    const contentType = res.headers.get("content-type") || "image/jpeg"

    const file = new File([buf], filename, { type: contentType })
    const fd = new FormData()
    fd.append("file", file)
    fd.append("metadata", JSON.stringify({ project: "jmm", source: "cover-fix" }))

    const cfRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1`,
      { method: "POST", headers: { Authorization: `Bearer ${CF_API_TOKEN}` }, body: fd as any }
    )
    const cfJson: any = await cfRes.json()
    if (!cfJson.success) {
      console.error("CF upload failed:", cfJson.errors)
      return null
    }
    return cfJson.result.id as string
  } catch (e) {
    console.warn(`Upload failed for ${url}:`, (e as Error).message)
    return null
  }
}

async function main() {
  // 1. Build vehicleHistory → cover_image_url map
  const records = new Map<string, string>()
  for (const dir of DATA_DIRS) {
    const file = path.join(dir, "listings.json")
    if (!fs.existsSync(file)) continue
    const data = JSON.parse(fs.readFileSync(file, "utf8"))
    for (const r of data) {
      const desc =
        (r.description as string | undefined)?.split("\n\n").slice(0, 3).join("\n\n") ?? ""
      if (desc && r.cover_image_url) {
        records.set(desc, r.cover_image_url)
      }
    }
  }
  console.log(`Loaded ${records.size} scrapper records with cover URLs`)

  // 2. Walk DB listings, match by vehicleHistory
  const listings = await prisma.listing.findMany({
    include: { media: { orderBy: { sortOrder: "asc" } } },
  })
  console.log(`Found ${listings.length} listings in DB`)

  let fixed = 0
  let skipped = 0
  let nomatch = 0

  for (const listing of listings) {
    const alreadyFixed = listing.media.some((m) => m.altText === FIXED_MARKER)
    if (alreadyFixed) {
      skipped++
      continue
    }

    const coverUrl = records.get(listing.vehicleHistory ?? "")
    if (!coverUrl) {
      nomatch++
      continue
    }

    const coverId = await uploadUrlToCloudflare(coverUrl)
    if (!coverId) {
      console.warn(`Failed cover upload for listing ${listing.id}`)
      continue
    }

    // Demote existing covers + shift sortOrders +1, then insert new cover at 0
    await prisma.$transaction([
      prisma.listingMedia.updateMany({
        where: { listingId: listing.id },
        data: { isCover: false },
      }),
      prisma.$executeRaw`UPDATE listing_media SET "sortOrder" = "sortOrder" + 1 WHERE "listingId" = ${listing.id}`,
      prisma.listingMedia.create({
        data: {
          listingId: listing.id,
          type: "image",
          provider: "cloudflare_images",
          providerId: coverId,
          sortOrder: 0,
          isCover: true,
          altText: FIXED_MARKER,
        },
      }),
    ])

    fixed++
    if (fixed % 10 === 0) console.log(`  ${fixed} listings fixed...`)
  }

  console.log(`✓ done. fixed=${fixed} skipped=${skipped} no-match=${nomatch}`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
