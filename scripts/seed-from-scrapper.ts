/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * scripts/seed-from-scrapper.ts
 *
 * Seeds the database with ~100 JDM/Japanese listings sourced from
 * `../japanese-scrapper/data/` and `../japanese-scrapper/data-older-1y/`.
 *
 * - Creates 24 fake JDM-themed users + 1 placeholder for atreyusutton@proton.me
 *   (linked to Clerk on first sign-in via lib/auth.ts).
 * - Uploads local listing images to Cloudflare Images.
 * - Distributes listings across users.
 * - Randomizes publishedAt + createdAt across the last 3 years.
 *
 * Run:  pnpm seed         (or npm/yarn/bun equivalents)
 * Dry:  pnpm seed:dry     (no DB writes, no Cloudflare uploads)
 */

import { config as loadDotenv } from "dotenv"
loadDotenv({ path: ".env.local" })
loadDotenv({ path: ".env" })

import { PrismaClient, Prisma } from "@prisma/client"
import { init } from "@paralleldrive/cuid2"
import fs from "node:fs"
import path from "node:path"
import { readFile } from "node:fs/promises"

const DRY = process.argv.includes("--dry")
const SCRAPPER_ROOT = path.resolve(process.cwd(), "../japanese-scrapper")
const DATA_DIRS = [
  path.join(SCRAPPER_ROOT, "data"),
  path.join(SCRAPPER_ROOT, "data-older-1y"),
]

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN

const prisma = new PrismaClient()
const createShortId = init({ length: 6 })

// 24 JDM-themed fake usernames + 1 owner slot
const FAKE_USERS = [
  { username: "r32_fan", name: "Ken Watanabe" },
  { username: "kei_truck_dad", name: "Marcus Reyes" },
  { username: "jza80_supra", name: "Tyler Brooks" },
  { username: "ae86_initial", name: "Sho Tanaka" },
  { username: "fd_rotary_life", name: "Devin Park" },
  { username: "nsx_owner", name: "Leah Kim" },
  { username: "hakosuka_pdx", name: "Ryan Iwata" },
  { username: "midnight_purple", name: "Akira Sato" },
  { username: "eclipse_gsx", name: "Jordan Cole" },
  { username: "evo_ix_mr", name: "Casey Nakamura" },
  { username: "drift_works", name: "Harold Yamada" },
  { username: "stance_squad", name: "Priya Singh" },
  { username: "wagon_only", name: "Ben Tovar" },
  { username: "kei_imports_la", name: "Mika Aoki" },
  { username: "rb26_or_die", name: "Chris Doyle" },
  { username: "fc3s_garage", name: "Sam Olsson" },
  { username: "z32_collector", name: "Rina Yoshida" },
  { username: "lan_evo_iv", name: "Owen Zhao" },
  { username: "bnr32_godzilla", name: "Aaron Frost" },
  { username: "mr2_mid_engine", name: "Hiro Mori" },
  { username: "celica_gt4", name: "Eduardo Vega" },
  { username: "starlet_glanza", name: "Pat Nguyen" },
  { username: "import_paddock", name: "Sara Ito" },
  { username: "land_cruiser_60", name: "Theo Maeda" },
] as const

const OWNER = {
  email: "atreyusutton@proton.me",
  username: "atreyu",
  name: "Atreyu Sutton",
  isAdmin: true,
}

const TRANSMISSIONS = [
  "5-Speed Manual",
  "6-Speed Manual",
  "4-Speed Automatic",
  "5-Speed Automatic",
] as const

const TITLE_STATUSES = ["clean", "clean", "clean", "clean", "salvage"] as const
const CONDITION_GRADES = ["show_car", "driver", "driver", "driver", "it_runs", "project"] as const

// Helpers ─────────────────────────────────────────────────────────────────────
const rand = (min: number, max: number) => Math.random() * (max - min) + min
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1))

function randomDateInLast3Years(): Date {
  const now = Date.now()
  const threeYearsAgo = now - 3 * 365 * 24 * 60 * 60 * 1000
  return new Date(rand(threeYearsAgo, now))
}

/** Pull year/make/model out of a BaT-style title. Returns best-effort fields. */
function parseTitle(title: string): { year?: number; make?: string; model?: string } {
  const yearMatch = title.match(/\b(19[5-9]\d|20[0-2]\d)\b/)
  const year = yearMatch ? parseInt(yearMatch[1], 10) : undefined

  const KNOWN_MAKES = [
    "Toyota", "Nissan", "Honda", "Mazda", "Subaru", "Mitsubishi", "Suzuki",
    "Lexus", "Acura", "Infiniti", "Daihatsu", "Isuzu",
    "Yamaha", "Kawasaki", "Datsun", "Toyopet", "Mitsuoka", "Hino",
  ]
  const remainder = year ? title.replace(yearMatch![0], "").trim() : title.trim()
  const make = KNOWN_MAKES.find((m) => remainder.toLowerCase().includes(m.toLowerCase()))
  let model: string | undefined
  if (make) {
    const idx = remainder.toLowerCase().indexOf(make.toLowerCase())
    const after = remainder.slice(idx + make.length).trim()
    // Strip trailing trim/spec noise after first 4-5 tokens
    model = after.split(/\s+/).slice(0, 5).join(" ").replace(/\s*[-–]\s*$/, "").trim() || undefined
  }
  return { year, make, model }
}

function parseMileage(description: string): number | undefined {
  // "89k kilometers (~55k miles)" or "55,000 miles" patterns
  const milesMatch = description.match(/([\d,]+)\s*miles/i) ||
    description.match(/([\d.]+)k\s*miles/i)
  if (!milesMatch) return undefined
  const raw = milesMatch[1].replace(/,/g, "")
  const num = raw.includes(".") ? parseFloat(raw) * 1000 : parseInt(raw, 10)
  return Number.isFinite(num) ? Math.round(num) : undefined
}

function locationFromCountry(code: string, essentials: any): string {
  const declared = essentials?.location
  if (declared && typeof declared === "string") return declared
  if (code === "JP") return "Japan (imported)"
  if (code === "CA") return "Canada"
  return "United States"
}

function essentialsToText(essentials: any): { options: string; mods: string } {
  const details: string[] = essentials?.details ?? []
  const options = details.length > 0
    ? details.map((d) => `• ${d}`).join("\n")
    : "Refer to the seller-provided photos and description."
  const mods = "Reported as a stock-spec example unless described otherwise — confirm with the seller before purchase."
  return { options, mods }
}

async function uploadToCloudflare(filePath: string): Promise<string | null> {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    if (DRY) return `dry-run-${path.basename(filePath)}`
    console.warn("⚠ Missing CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN — skipping image upload")
    return null
  }

  const buffer = await readFile(filePath)
  const file = new File([new Uint8Array(buffer)], path.basename(filePath), {
    type: filePath.endsWith(".jpeg") || filePath.endsWith(".jpg")
      ? "image/jpeg"
      : "image/png",
  })
  const fd = new FormData()
  fd.append("file", file)
  fd.append("metadata", JSON.stringify({ project: "jmm", source: "seed" }))

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1`,
    { method: "POST", headers: { Authorization: `Bearer ${CF_API_TOKEN}` }, body: fd as any }
  )
  const json: any = await res.json()
  if (!json.success) {
    console.error("CF upload failed:", json.errors)
    return null
  }
  return json.result.id as string
}

// Main ────────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`▸ JMM seed ${DRY ? "(dry run)" : ""}`)

  // 1. Load all listings
  const allListings: Array<{ raw: any; baseDir: string }> = []
  for (const dir of DATA_DIRS) {
    const file = path.join(dir, "listings.json")
    if (!fs.existsSync(file)) continue
    const data = JSON.parse(fs.readFileSync(file, "utf8"))
    for (const raw of data) allListings.push({ raw, baseDir: dir })
  }
  console.log(`  loaded ${allListings.length} listings from scrapper`)

  // 2. Create users
  console.log("  creating users...")
  const userIds: number[] = []
  if (!DRY) {
    const owner = await prisma.user.upsert({
      where: { email: OWNER.email },
      update: {},
      create: {
        email: OWNER.email,
        username: OWNER.username,
        name: OWNER.name,
        isAdmin: OWNER.isAdmin,
      },
    })
    userIds.push(owner.id)

    for (const fake of FAKE_USERS) {
      const user = await prisma.user.upsert({
        where: { email: `${fake.username}@example.com` },
        update: {},
        create: {
          email: `${fake.username}@example.com`,
          username: fake.username,
          name: fake.name,
          isAdmin: false,
        },
      })
      userIds.push(user.id)
    }
    console.log(`  ✓ ${userIds.length} users ready`)
  }

  // 3. Upload images + create listings
  console.log("  creating listings...")
  let made = 0
  for (const { raw, baseDir } of allListings) {
    const { year, make, model } = parseTitle(raw.title || "")
    const mileage = parseMileage(raw.description || "") ?? randInt(40_000, 150_000)
    const location = locationFromCountry(raw.country_code, raw.essentials)
    const { options, mods } = essentialsToText(raw.essentials)

    // BaT data is all completed auctions (every row has sold_text), but we
    // want a fake JMM marketplace that mostly looks "for sale". Distribute:
    // ~75% active, ~20% sold, ~5% draft.
    const r = Math.random()
    const status: "active" | "sold" | "draft" =
      r < 0.05 ? "draft" : r < 0.25 ? "sold" : "active"

    const askingPrice = typeof raw.current_bid === "number" && raw.current_bid > 0
      ? raw.current_bid
      : randInt(8_000, 120_000)

    const created = randomDateInLast3Years()
    const sellerId = pick(userIds)

    const description = (raw.description as string | undefined)?.split("\n\n").slice(0, 3).join("\n\n") ?? ""

    const data = {
      publicId: createShortId(),
      sellerId,
      listingStatus: status,
      publishedAt: status === "draft" ? null : created,
      featured: Math.random() < 0.12,
      year,
      make,
      model,
      vehicleIdentifier: raw.essentials?.details
        ?.find((d: string) => /chassis|vin/i.test(d))
        ?.replace(/^[^:]+:\s*/, "") ?? null,
      mileage,
      location,
      engine: raw.essentials?.details?.find((d: string) => /cc|liter|engine|inline|flat|v\d|rotary/i.test(d)) ?? null,
      transmission: raw.essentials?.details?.find((d: string) => /transmission|speed/i.test(d)) ?? pick(TRANSMISSIONS),
      exteriorColor: raw.essentials?.details?.find((d: string) => /paint|color|over/i.test(d)) ?? null,
      interiorColorMaterial: raw.essentials?.details?.find((d: string) => /upholstery|leather|cloth|interior/i.test(d)) ?? null,
      askingPrice,
      optionsAndFeatures: options,
      modifications: mods,
      conditionGrade: pick(CONDITION_GRADES) as Prisma.ListingCreateInput["conditionGrade"],
      vehicleHistory: description || `${year ?? ""} ${make ?? ""} ${model ?? ""}`.trim(),
      maintenanceHistory: "Maintenance and service history available upon request from the seller.",
      titleStatus: pick(TITLE_STATUSES) as Prisma.ListingCreateInput["titleStatus"],
      carfaxAvailable: Math.random() < 0.7,
      createdAt: created,
      updatedAt: created,
    }

    if (DRY) {
      console.log(`    · ${data.year ?? "?"} ${data.make ?? "?"} ${data.model ?? "?"} → @${userIds.length ? "user" : "?"} | $${data.askingPrice.toLocaleString()} | ${created.toISOString().slice(0, 10)}`)
      made++
      continue
    }

    // Upload images (cap at 12 per listing to keep CF cost reasonable)
    const imagePaths: string[] = (raw.image_paths || []).slice(0, 12)
    const mediaCreates: Prisma.ListingMediaCreateWithoutListingInput[] = []
    for (let i = 0; i < imagePaths.length; i++) {
      const rel = imagePaths[i]
      const abs = path.join(baseDir, rel)
      if (!fs.existsSync(abs)) continue
      const id = await uploadToCloudflare(abs)
      if (!id) continue
      mediaCreates.push({
        type: "image",
        provider: "cloudflare_images",
        providerId: id,
        sortOrder: i,
        isCover: i === 0,
      })
    }

    await prisma.listing.create({
      data: {
        ...data,
        media: mediaCreates.length > 0 ? { create: mediaCreates } : undefined,
      },
    })
    made++
    if (made % 5 === 0) console.log(`    ${made} listings created...`)
  }

  console.log(`  ✓ ${made} listings ${DRY ? "(would be) " : ""}created`)
  console.log("done.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
