import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { Separator } from "@/components/ui/separator"
import { ContactSellerDialog } from "@/components/listing/contact-seller-dialog"
import { WatchlistButton } from "@/components/listing/watchlist-button"
import { ShareButton } from "@/components/listing/share-button"
import { ReportButton } from "@/components/listing/report-button"
import { formatCurrency, getCloudflareImageUrl } from "@/lib/utils"
import { ListingGallery } from "@/components/listing/listing-gallery"
import { SiteContainer } from "@/components/layout/site-container"
import { ListingCard } from "@/components/listing/listing-card"
import { AdSlot } from "@/components/ads/ad-slot"
import { Button } from "@/components/ui/button"

const CONDITION_LABELS = {
  show_car: "Show car",
  driver: "Driver",
  it_runs: "It runs",
  project: "Project",
} as const

export default async function VehicleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const publicId = slug.split("-").pop() || slug

  const session = await auth()
  const currentUserId = session?.user?.dbId

  const listing = await prisma.listing.findUnique({
    where: { publicId },
    include: {
      seller: { select: { name: true, username: true, createdAt: true } },
      media: { orderBy: { sortOrder: "asc" } },
      ...(currentUserId
        ? { savedListings: { where: { userId: currentUserId } } }
        : {}),
    },
  })

  if (!listing) notFound()

  const allOtherListings = await prisma.listing.findMany({
    where: { listingStatus: "active", id: { not: listing.id } },
    orderBy: { publishedAt: "desc" },
    take: 12,
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      seller: { select: { username: true, name: true } },
    },
  })

  const relatedListings = [...allOtherListings]
  for (let i = relatedListings.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[relatedListings[i], relatedListings[j]] = [relatedListings[j], relatedListings[i]]
  }

  const savedCount = currentUserId ? ((listing as { savedListings?: unknown[] }).savedListings?.length ?? 0) : 0
  const isSaved = savedCount > 0
  const price = formatCurrency(listing.askingPrice)
  const isOwner = currentUserId === listing.sellerId
  const isLoggedIn = Boolean(currentUserId)
  const sellerHandle = listing.seller.username || listing.seller.name?.split(" ")[0] || "seller"
  const conditionLabel = listing.conditionGrade
    ? CONDITION_LABELS[listing.conditionGrade as keyof typeof CONDITION_LABELS]
    : undefined
  const canViewIdentifier = Boolean(session?.user)
  const identifier = listing.vehicleIdentifier || ""
  const displayIdentifier = canViewIdentifier ? identifier || "N/A" : "Sign In to See VIN"
  const isSold = listing.listingStatus === "sold"
  const coverImage = listing.media.find((m) => m.isCover) || listing.media[0]

  return (
    <div className="bg-page">
      <SiteContainer className="space-y-2 pt-6 sm:pt-8 pb-4 sm:pb-6">
        <div className="flex items-baseline justify-between gap-4 mb-3 sm:mb-4">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl uppercase tracking-[0.02em] text-jmm-black">
            {listing.year} {listing.make} {listing.model}
          </h1>
          <span className="font-display text-2xl sm:text-3xl md:text-4xl text-jmm-black shrink-0">
            {price}
          </span>
        </div>

        {coverImage && (
          <a
            href="#gallery"
            className="block relative aspect-[16/9] w-full overflow-hidden bg-card border border-jmm-black/15 cursor-pointer"
          >
            <Image
              src={getCloudflareImageUrl(coverImage.providerId)}
              alt={`${listing.year} ${listing.make} ${listing.model}`}
              fill
              className="object-cover"
              priority
            />
            {isSold && (
              <div className="absolute top-3 right-3 bg-jmm-red text-white px-3 py-1.5 font-display font-bold text-sm uppercase tracking-[0.1em] shadow-lg">
                Sold
              </div>
            )}
          </a>
        )}

        <div className="grid gap-8 sm:gap-10 lg:grid-cols-[2fr_1fr] mt-6 sm:mt-8">
          <div className="space-y-6 sm:space-y-8">
            <div className="grid gap-4 bg-page-alt border border-jmm-black/10 p-4 sm:p-6 text-sm sm:text-base uppercase tracking-[0.1em] text-jmm-black/80 grid-cols-1 sm:grid-cols-2">
              <SpecRow label="Engine" value={listing.engine || "—"} />
              <SpecRow label="Transmission" value={listing.transmission || "—"} />
              <SpecRow label="Exterior" value={listing.exteriorColor || "—"} />
              <SpecRow label="Interior" value={listing.interiorColorMaterial || "—"} />
              <SpecRow
                label="Mileage"
                value={listing.mileage ? `${listing.mileage.toLocaleString()} miles` : "—"}
              />
              <SpecRow label="Location" value={listing.location || "United States"} />
              <SpecRow label="VIN" value={displayIdentifier} />
              <SpecRow
                label="Title"
                value={
                  listing.titleStatus
                    ? `${listing.titleStatus.charAt(0).toUpperCase() + listing.titleStatus.slice(1)} Title${listing.carfaxAvailable ? " with Carfax" : ""}`
                    : listing.carfaxAvailable
                    ? "Carfax Available"
                    : "—"
                }
              />
              {conditionLabel && <SpecRow label="Condition" value={conditionLabel} />}
            </div>

            <NarrativeCard
              title="Story"
              body={listing.vehicleHistory || "Seller has not provided a detailed story yet."}
            />
            <NarrativeCard
              title="Maintenance"
              body={listing.maintenanceHistory || "Maintenance information will be supplied upon request."}
            />
            <NarrativeCard
              title="Options & Features"
              body={listing.optionsAndFeatures || "Seller did not include additional options or notable equipment."}
            />
            <NarrativeCard
              title="Modifications & Originality"
              body={listing.modifications || "No modifications reported — believed to retain its stock specification."}
            />
          </div>

          <aside className="space-y-5 sm:space-y-6 bg-page-alt border border-jmm-black/10 p-4 sm:p-6 lg:order-last lg:sticky lg:top-20 lg:self-start">
            <div>
              <p className="font-display text-xl sm:text-2xl uppercase tracking-[0.02em] text-jmm-black">
                {listing.year} {listing.make} {listing.model}
              </p>
              <p className="font-display text-2xl sm:text-3xl text-jmm-black">{price}</p>
            </div>
            <div className="space-y-3">
              {isSold ? (
                <Button className="w-full bg-jmm-red text-white hover:bg-jmm-red cursor-default" disabled>
                  Vehicle Sold
                </Button>
              ) : isOwner ? (
                <Button className="w-full" asChild>
                  <Link href="/account/listings">View My Listings</Link>
                </Button>
              ) : !isLoggedIn ? (
                <Button className="w-full bg-jmm-red text-white hover:bg-jmm-red-soft" asChild>
                  <Link href="/sign-in">Sign In to Contact</Link>
                </Button>
              ) : (
                <ContactSellerDialog
                  listingId={listing.id}
                  listingTitle={`${listing.year} ${listing.make} ${listing.model}`}
                  sellerName={sellerHandle}
                />
              )}
              {!isSold && (
                <WatchlistButton
                  listingId={listing.id}
                  initialSaved={isSaved}
                  isLoggedIn={isLoggedIn}
                />
              )}
              <ShareButton title={`${listing.year} ${listing.make} ${listing.model}`} />
              <div className="text-center">
                <ReportButton listingId={listing.id} />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-[0.65rem] sm:text-xs uppercase tracking-[0.18em] text-text-muted">
                Seller
              </p>
              <p className="font-display text-base sm:text-lg text-jmm-black">
                @{sellerHandle}
              </p>
              <p className="text-[0.65rem] sm:text-xs uppercase tracking-[0.18em] text-text-muted">
                Member since{" "}
                {new Date(listing.seller.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <p className="text-[10px] sm:text-[11px] leading-relaxed text-text-muted">
              Japanese Motor Market facilitates introductions between members. Inspect vehicles independently and complete your own due diligence before transacting.
            </p>
            <div className="text-[0.65rem] sm:text-xs uppercase tracking-[0.18em] text-text-muted">
              Listing ID {listing.publicId}
            </div>
          </aside>
        </div>

        {listing.media.length > 1 && (
          <div className="space-y-4 pt-6" id="gallery">
            <h2 className="font-display text-xl sm:text-2xl uppercase tracking-[0.02em] text-jmm-black">
              Gallery
            </h2>
            <ListingGallery media={listing.media} isSold={isSold} />
          </div>
        )}
        <div className="pt-10 sm:pt-14">
          <AdSlot placement="detail" className="mx-auto max-w-5xl" />
        </div>
      </SiteContainer>

      <section className="bg-page-alt py-12 sm:py-16 border-t border-jmm-black/10">
        <SiteContainer className="space-y-6">
          <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-[0.02em] text-jmm-black">
            More from JMM
          </h2>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {relatedListings.length > 0 ? (
              relatedListings
                .slice(0, 6)
                .map((related) => <ListingCard key={related.id} listing={related} />)
            ) : (
              <div className="col-span-full px-6 py-12 text-center text-xs uppercase tracking-[0.18em] text-text-muted">
                Additional listings arrive shortly.
              </div>
            )}
          </div>
        </SiteContainer>
      </section>
    </div>
  )
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-jmm-black/15 pb-3">
      <span className="text-[0.55rem] sm:text-xs uppercase tracking-[0.18em] text-text-muted">
        {label}
      </span>
      <span className="font-display text-sm sm:text-base text-jmm-black normal-case">{value}</span>
    </div>
  )
}

function NarrativeCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-card border border-jmm-black/10 px-5 py-4 space-y-3">
      <h3 className="font-display text-base sm:text-lg uppercase tracking-[0.18em] text-jmm-black">
        {title}
      </h3>
      <Separator className="border-jmm-black/15" />
      <p className="text-sm sm:text-base leading-relaxed text-jmm-black/80 whitespace-pre-wrap">
        {body}
      </p>
    </div>
  )
}
