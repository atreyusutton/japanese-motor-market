import { prisma } from "@/lib/prisma"
import { ListingCard } from "@/components/listing/listing-card"
import { AdSlot } from "@/components/ads/ad-slot"
import { SiteContainer } from "@/components/layout/site-container"

export const dynamic = "force-dynamic"

export default async function BrowsePage() {
  const activeListings = await prisma.listing.findMany({
    where: { listingStatus: "active" },
    orderBy: { publishedAt: "desc" },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      seller: { select: { username: true, name: true } },
    },
  })

  const soldListings = await prisma.listing.findMany({
    where: { listingStatus: "sold" },
    orderBy: { updatedAt: "desc" },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      seller: { select: { username: true, name: true } },
    },
  })

  return (
    <div className="bg-page py-12 md:py-16">
      <SiteContainer className="space-y-10">
        <div className="flex flex-col gap-3 border-b-2 border-jmm-black pb-6">
          <div className="flex items-center gap-3">
            <span className="kanji text-jmm-red text-3xl leading-none">旧車</span>
            <p className="text-xs uppercase tracking-[0.32em] text-text-muted">Catalog</p>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-[0.02em] text-jmm-black">
            All Vehicles
          </h1>
          <p className="text-sm text-text-muted max-w-2xl">
            Free to browse. Free to list. Contact sellers directly — no fees, no commissions, no noise.
          </p>
        </div>

        <div className="space-y-12">
          <div className="space-y-6">
            <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-[0.02em] text-jmm-black border-b border-jmm-black/15 pb-2">
              Available
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeListings.length > 0 ? (
                activeListings.map((listing, idx) =>
                  idx === 7 ? (
                    <AdSlot key="ad-card" placement="card" />
                  ) : (
                    <ListingCard key={listing.id} listing={listing} />
                  )
                )
              ) : (
                <div className="col-span-full px-6 py-12 text-center text-xs uppercase tracking-[0.18em] text-text-muted">
                  No vehicles listed yet. Check back soon.
                </div>
              )}
            </div>
          </div>

          {soldListings.length > 0 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-[0.02em] text-jmm-black border-b border-jmm-black/15 pb-2">
                Recently Sold
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {soldListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </div>
          )}
        </div>
      </SiteContainer>
    </div>
  )
}
