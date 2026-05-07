"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { listingSchema } from "@/lib/validations/listing"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { init } from "@paralleldrive/cuid2"
import { generateListingSlug } from "@/lib/utils"

const createShortId = init({ length: 6 })

async function deleteCloudflareImage(idOrUrl: string) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const token = process.env.CLOUDFLARE_API_TOKEN
  if (!accountId || !token) return

  // Accept either a raw image ID or a delivery URL
  let imageId = idOrUrl
  if (idOrUrl.startsWith("http")) {
    const parts = idOrUrl.split("/")
    imageId = parts[parts.length - 2]
  }
  if (!imageId) return

  try {
    await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/${imageId}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
    )
  } catch (e) {
    console.error("Failed to delete CF image", e)
  }
}

type ListingIntent = "draft" | "publish"

export async function createListing(
  rawData: z.infer<typeof listingSchema>,
  intent: ListingIntent = "draft"
) {
  const session = await auth()
  if (!session?.user) return { error: "Not authenticated" }
  const userId = session.user.dbId

  const validated = listingSchema.safeParse(rawData)
  if (!validated.success) return { error: "Invalid fields" }

  const { images, ...listingData } = validated.data
  const isPublishing = intent === "publish"

  const normalized = {
    ...listingData,
    askingPrice: listingData.askingPrice,
    vehicleIdentifier: listingData.vehicleIdentifier?.trim(),
    location: listingData.location?.trim(),
    optionsAndFeatures: listingData.optionsAndFeatures?.trim() || null,
    modifications: listingData.modifications?.trim() || null,
    vehicleHistory: listingData.vehicleHistory?.trim(),
    maintenanceHistory: listingData.maintenanceHistory?.trim(),
  }

  try {
    if (rawData.id) {
      const existing = await prisma.listing.findUnique({
        where: { id: rawData.id },
        include: { media: true },
      })
      if (!existing || (existing.sellerId !== userId && !session.user.isAdmin)) {
        return { error: "Unauthorized or not found" }
      }

      const imagesToDelete = existing.media.filter((m) => !images.includes(m.providerId))
      await Promise.all(imagesToDelete.map((m) => deleteCloudflareImage(m.providerId)))

      await prisma.listingMedia.deleteMany({ where: { listingId: rawData.id } })

      const now = new Date()
      const updated = await prisma.listing.update({
        where: { id: rawData.id },
        data: {
          ...normalized,
          listingStatus: isPublishing ? "active" : existing.listingStatus,
          publishedAt: isPublishing ? (existing.publishedAt ?? now) : existing.publishedAt,
          media: {
            create: images.map((url, index) => ({
              type: "image" as const,
              provider: "cloudflare_images" as const,
              providerId: url,
              sortOrder: index,
              isCover: index === 0,
            })),
          },
        },
      })

      revalidatePath("/account/listings")
      revalidatePath("/listings")
      revalidatePath(generateListingSlug(updated))

      return {
        success: true,
        listingId: updated.id,
        listing: updated,
        redirectPath: isPublishing ? generateListingSlug(updated) : "/account/listings",
      }
    }

    const listing = await prisma.listing.create({
      data: {
        ...normalized,
        publicId: createShortId(),
        sellerId: userId,
        listingStatus: isPublishing ? "active" : "draft",
        publishedAt: isPublishing ? new Date() : null,
        media: {
          create: images.map((url, index) => ({
            type: "image" as const,
            provider: "cloudflare_images" as const,
            providerId: url,
            sortOrder: index,
            isCover: index === 0,
          })),
        },
      },
    })

    const slug = generateListingSlug(listing)
    revalidatePath("/account/listings")
    revalidatePath("/listings")
    revalidatePath(slug)

    return {
      success: true,
      listingId: listing.id,
      listing,
      redirectPath: isPublishing ? slug : "/account/listings",
    }
  } catch (error) {
    console.error(error)
    return { error: "Failed to create listing" }
  }
}

export async function updateListingStatus(listingId: number, status: "active" | "sold" | "draft") {
  const session = await auth()
  if (!session?.user) return { error: "Unauthorized" }
  const userId = session.user.dbId

  try {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } })
    if (!listing) return { error: "Listing not found" }
    if (listing.sellerId !== userId && !session.user.isAdmin) {
      return { error: "Unauthorized" }
    }

    await prisma.listing.update({
      where: { id: listingId },
      data: {
        listingStatus: status,
        publishedAt: status === "active" ? listing.publishedAt ?? new Date() : listing.publishedAt,
      },
    })

    revalidatePath(generateListingSlug(listing))
    revalidatePath("/account/listings")
    revalidatePath("/admin/listings")
    revalidatePath("/listings")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Failed to update status" }
  }
}

export async function deleteListing(listingId: number) {
  const session = await auth()
  if (!session?.user) return { error: "Unauthorized" }
  const userId = session.user.dbId

  try {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { media: true },
    })
    if (!listing) return { error: "Listing not found" }
    if (listing.sellerId !== userId && !session.user.isAdmin) {
      return { error: "Unauthorized" }
    }

    await Promise.all(listing.media.map((m) => deleteCloudflareImage(m.providerId)))
    await prisma.listing.delete({ where: { id: listingId } })

    revalidatePath("/account/listings")
    revalidatePath("/admin/listings")
    revalidatePath("/listings")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Delete error:", error)
    return { error: "Failed to delete listing" }
  }
}
