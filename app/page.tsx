import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { ListingCard } from "@/components/listing/listing-card"
import { SiteContainer } from "@/components/layout/site-container"
import { getCloudflareImageUrl, generateListingSlug } from "@/lib/utils"
import { MembershipBenefits } from "@/components/membership-benefits"
import { AdSlot } from "@/components/ads/ad-slot"

export const dynamic = "force-dynamic"

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border-soft pb-3">
      <span className="text-[0.55rem] sm:text-xs uppercase tracking-[0.18em] text-text-muted">{label}</span>
      <span className="font-display text-sm sm:text-base text-jmm-black">{value}</span>
    </div>
  )
}

export default async function Home() {
  const featuredRaw = await prisma.listing.findMany({
    where: { listingStatus: "active", featured: true },
    orderBy: { publishedAt: "desc" },
    take: 5,
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      seller: { select: { username: true, name: true } },
    },
  })

  let displayListings = featuredRaw
  if (featuredRaw.length < 5) {
    const recent = await prisma.listing.findMany({
      where: {
        listingStatus: "active",
        featured: false,
        id: { notIn: featuredRaw.map((l) => l.id) },
      },
      orderBy: { publishedAt: "desc" },
      take: 5 - featuredRaw.length,
      include: {
        media: { orderBy: { sortOrder: "asc" } },
        seller: { select: { username: true, name: true } },
      },
    })
    displayListings = [...featuredRaw, ...recent]
  }

  const largeListings = displayListings.slice(0, 2)
  const cardListings = displayListings.slice(2, 5)

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="relative isolate min-h-[80vh] sm:min-h-[88vh] overflow-hidden bg-jmm-black">
        <div className="absolute inset-y-0 right-0 w-[60%] bg-jmm-red opacity-[0.07] -skew-x-12 origin-top-right pointer-events-none" />
        <SiteContainer className="relative flex min-h-[80vh] sm:min-h-[88vh] flex-col items-center justify-center gap-6 sm:gap-8 px-4 text-center text-white">
          <div className="flex flex-col items-center gap-3">
            <Image
              src="/assets/jmm-minimal-logo.png"
              alt="Japanese Motor Market"
              width={140}
              height={140}
              className="h-20 sm:h-28 w-auto border border-white/20 p-2"
              priority
            />
            <span className="kanji text-jmm-red text-5xl sm:text-7xl leading-none">旧車</span>
          </div>
          <div className="max-w-3xl space-y-4 sm:space-y-6 px-2">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl uppercase tracking-[0.04em] leading-[1.05] text-white">
              The marketplace for <span className="text-jmm-red">JDM</span>.
            </h1>
            <p className="text-base sm:text-lg md:text-xl leading-relaxed text-white/85">
              Free to list. Free to join. Built by enthusiasts for the JDM and Japanese-made vehicle community in the United States.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 w-full sm:w-auto px-2">
            <Button
              asChild
              size="lg"
              className="h-10 sm:h-12 px-6 sm:px-10 text-xs sm:text-sm uppercase tracking-[0.18em] min-w-[140px] sm:min-w-[200px] bg-jmm-red text-white border-2 border-jmm-red hover:bg-jmm-red-soft hover:border-jmm-red-soft"
            >
              <Link href="/listings">Browse Vehicles</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-10 sm:h-12 px-6 sm:px-10 text-xs sm:text-sm uppercase tracking-[0.18em] min-w-[140px] sm:min-w-[200px] bg-transparent text-white border-2 border-white hover:bg-white hover:text-jmm-black"
            >
              <Link href="/sell">List a Vehicle</Link>
            </Button>
          </div>
        </SiteContainer>
      </section>

      <div className="h-1 w-full bg-jmm-red" />

      {/* WHY JMM */}
      <section className="relative bg-jmm-black text-white py-14 sm:py-20">
        <SiteContainer className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="kanji text-jmm-red text-3xl sm:text-4xl leading-none">旧車</span>
            <span className="font-display text-[0.7rem] sm:text-xs uppercase tracking-[0.32em] text-white/60">
              Why Japanese Motor Market
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl uppercase tracking-[0.02em] text-white max-w-3xl">
            For people who actually drive these cars.
          </h2>
          <p className="max-w-2xl text-base sm:text-lg text-white/80 leading-relaxed">
            JMM is a free, focused marketplace for JDM and Japanese-made vehicles in the U.S. — kei trucks, Skyline GT-Rs, MR2s, Land Cruisers, AE86s, RX-7s, NSXs, Supras, and everything in between. No fees. No commissions. No noise.
          </p>
        </SiteContainer>
      </section>

      {/* BENEFITS */}
      <section className="bg-page py-12 sm:py-16">
        <SiteContainer className="space-y-8 sm:space-y-10">
          <div className="flex items-center gap-4 border-b-2 border-jmm-black pb-4">
            <Image
              src="/assets/jmm-minimal-logo.png"
              alt="Japanese Motor Market"
              width={60}
              height={60}
              className="h-12 sm:h-14 w-auto flex-shrink-0 border border-jmm-black/20"
            />
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl uppercase tracking-[0.02em] text-jmm-black">
              Reasons to join
            </h2>
          </div>
          <MembershipBenefits />
          <div className="pt-2">
            <Button
              asChild
              className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-12 text-sm sm:text-base bg-jmm-red text-white hover:bg-jmm-red-soft uppercase tracking-[0.18em] font-semibold"
            >
              <Link href="/sign-up">Join Free — Sign Up</Link>
            </Button>
          </div>
        </SiteContainer>
      </section>

      {/* FEATURED LISTINGS */}
      <section className="bg-white py-12 sm:py-16 md:py-20 border-t border-jmm-black/10">
        <SiteContainer className="space-y-12 sm:space-y-16">
          <div className="space-y-2">
            <p className="text-[0.65rem] sm:text-xs uppercase tracking-[0.32em] text-jmm-red font-semibold">
              Featured Vehicles
            </p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl uppercase tracking-[0.02em] text-jmm-black">
              On the market now
            </h2>
          </div>

          <div className="space-y-12 sm:space-y-20">
            {largeListings.map((listing) => {
              const coverImage = listing.media.find((m) => m.isCover) || listing.media[0]
              const href = generateListingSlug(listing)
              const sellerLabel = listing.seller?.username ?? listing.seller?.name ?? null

              return (
                <div
                  key={listing.id}
                  className="bg-card border border-jmm-black/15 p-6 sm:p-8 md:p-10"
                >
                  <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-start">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <p className="text-[0.65rem] sm:text-xs uppercase tracking-[0.18em] text-jmm-red font-semibold">
                          Featured Showcase
                        </p>
                        <Link href={href}>
                          <h3 className="font-display text-3xl sm:text-4xl md:text-5xl uppercase tracking-[0.02em] text-jmm-black hover:text-jmm-red transition-colors">
                            {listing.year} {listing.make} {listing.model}
                          </h3>
                        </Link>
                        {sellerLabel && (
                          <p className="text-xs uppercase tracking-[0.18em] text-text-muted">
                            Listed by <span className="text-jmm-black font-semibold">@{sellerLabel}</span>
                          </p>
                        )}
                      </div>

                      <div className="space-y-4 text-sm sm:text-base text-jmm-black/80 leading-relaxed">
                        {listing.optionsAndFeatures && (
                          <p className="line-clamp-4">{listing.optionsAndFeatures}</p>
                        )}
                        {listing.vehicleHistory && (
                          <p className="line-clamp-4">{listing.vehicleHistory}</p>
                        )}
                        {!listing.optionsAndFeatures && !listing.vehicleHistory && (
                          <p>
                            A clean {listing.make} ready for the next caretaker. Inspect, ask questions, deal directly with the seller.
                          </p>
                        )}
                      </div>

                      <Button asChild variant="outline" className="w-full sm:w-auto border-jmm-black text-jmm-black hover:bg-jmm-black hover:text-white">
                        <Link href={href}>View Full Details</Link>
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <Link
                        href={href}
                        className="relative group block aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden bg-muted border border-jmm-black/15"
                      >
                        {coverImage ? (
                          <Image
                            src={getCloudflareImageUrl(coverImage.providerId)}
                            alt={`${listing.year} ${listing.make} ${listing.model}`}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.18em] text-text-muted">
                            No Imagery
                          </div>
                        )}
                      </Link>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-page-alt border border-jmm-black/10 p-4 sm:p-5 text-sm uppercase tracking-[0.1em] text-jmm-black/80">
                        <SpecRow label="Engine" value={listing.engine || "—"} />
                        <SpecRow label="Transmission" value={listing.transmission || "—"} />
                        <SpecRow label="Exterior" value={listing.exteriorColor || "—"} />
                        <SpecRow label="Interior" value={listing.interiorColorMaterial || "—"} />
                        <SpecRow
                          label="Mileage"
                          value={listing.mileage ? `${listing.mileage.toLocaleString()} mi` : "—"}
                        />
                        <SpecRow label="Location" value={listing.location || "United States"} />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 pt-6">
            {cardListings.length > 0 ? (
              cardListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)
            ) : largeListings.length === 0 ? (
              <div className="col-span-full px-6 py-12 text-center text-sm uppercase tracking-[0.18em] text-text-muted">
                No listings yet. Be the first to list a vehicle.
              </div>
            ) : null}
          </div>

          <div className="pt-4 sm:pt-8">
            <AdSlot placement="home" className="mx-auto max-w-5xl" />
          </div>

          <div className="flex justify-center pt-8 sm:pt-12">
            <Button
              asChild
              size="lg"
              className="h-12 sm:h-14 px-8 sm:px-12 text-sm sm:text-base bg-jmm-black text-white hover:bg-jmm-red uppercase tracking-[0.18em] font-semibold"
            >
              <Link href="/listings">Browse All Vehicles</Link>
            </Button>
          </div>
        </SiteContainer>
      </section>
    </div>
  )
}
