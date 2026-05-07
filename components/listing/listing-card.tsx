import Link from "next/link"
import Image from "next/image"
import { Listing, ListingMedia } from "@prisma/client"
import { formatCurrency, generateListingSlug, getCloudflareImageUrl } from "@/lib/utils"

interface ListingCardProps {
  listing: Listing & {
    media: ListingMedia[]
    seller?: { username: string | null; name: string | null } | null
  }
}

export function ListingCard({ listing }: ListingCardProps) {
  const coverImage = listing.media.find((m) => m.isCover) || listing.media[0]
  const price = formatCurrency(listing.askingPrice)
  const isSold = listing.listingStatus === "sold"
  const sellerLabel = listing.seller?.username ?? listing.seller?.name ?? null

  return (
    <Link
      href={generateListingSlug(listing as { year: number | null; make: string | null; model: string | null; publicId: string })}
      className="group flex flex-col h-full bg-card border border-jmm-black/15 hover:border-jmm-red transition-colors"
    >
      <div className="relative aspect-[4/3] bg-muted border-b border-jmm-black/10 overflow-hidden">
        {coverImage ? (
          <Image
            src={getCloudflareImageUrl(coverImage.providerId)}
            alt={`${listing.year ?? ""} ${listing.make ?? ""} ${listing.model ?? ""}`.trim()}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.18em] text-text-muted">
            No Imagery
          </div>
        )}
        {isSold && (
          <div className="absolute top-2 right-2 bg-jmm-red text-white px-2.5 py-1 font-display font-bold text-xs uppercase tracking-[0.1em] shadow-lg">
            Sold
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col px-5 py-4">
        <div>
          <h3 className="font-display text-2xl text-jmm-black uppercase tracking-[0.02em] group-hover:text-jmm-red transition-colors">
            {listing.year} {listing.make} {listing.model}
          </h3>
          <div className="mt-1 space-y-0.5">
            {listing.mileage != null && (
              <p className="text-xs uppercase tracking-[0.12em] font-semibold text-text-muted">
                {Math.round(listing.mileage / 1000)}k miles
              </p>
            )}
            <p className="text-xs uppercase tracking-[0.12em] font-semibold text-text-muted">
              {listing.location || "United States"}
            </p>
            {sellerLabel && (
              <p className="text-xs uppercase tracking-[0.12em] text-text-muted">
                Seller: <span className="text-jmm-black font-semibold">@{sellerLabel}</span>
              </p>
            )}
          </div>
        </div>
        <div className="mt-auto pt-3 flex items-center justify-between border-t border-jmm-black/10">
          <p className="font-display text-2xl font-bold text-jmm-black">{price}</p>
          <span className="text-[0.65rem] uppercase tracking-[0.18em] font-semibold text-jmm-red">
            View →
          </span>
        </div>
      </div>
    </Link>
  )
}
