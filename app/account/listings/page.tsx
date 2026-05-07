import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import Image from "next/image"
import { generateListingSlug, formatCurrency, getCloudflareImageUrl } from "@/lib/utils"
import { CarFront } from "lucide-react"
import { ListingActions } from "@/components/listing/listing-actions"

export default async function AccountListingsPage() {
  const session = await auth()
  if (!session?.user) redirect("/sign-in")

  const listings = await prisma.listing.findMany({
    where: { sellerId: session.user.dbId },
    include: { media: { where: { isCover: true }, take: 1 } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <CardTitle className="text-xl sm:text-2xl">My Listings</CardTitle>
            <CardDescription>Manage your vehicle listings</CardDescription>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/sell">List New Vehicle</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="md:hidden space-y-4">
          {listings.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              You haven&apos;t listed any vehicles yet.
            </div>
          ) : (
            listings.map((listing) => (
              <Card key={listing.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Link
                      href={generateListingSlug(listing)}
                      className="group relative block h-20 w-24 sm:h-24 sm:w-32 overflow-hidden border border-jmm-black/15 hover:border-jmm-red transition flex-shrink-0"
                    >
                      {listing.media[0] ? (
                        <Image
                          src={getCloudflareImageUrl(listing.media[0].providerId)}
                          alt="Vehicle thumbnail"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground bg-muted">
                          <CarFront className="h-6 w-6" />
                        </div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <Link href={generateListingSlug(listing)} className="hover:underline">
                          <div className="font-medium text-base">
                            {listing.year} {listing.make} {listing.model}
                          </div>
                        </Link>
                        <div className="text-sm font-semibold mt-1">
                          {formatCurrency(listing.askingPrice)}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant={listing.listingStatus === "active" ? "default" : "secondary"}>
                          {listing.listingStatus}
                        </Badge>
                      </div>
                      <div className="pt-2">
                        <ListingActions listingId={listing.id} status={listing.listingStatus} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Image</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <Link
                        href={generateListingSlug(listing)}
                        className="group relative block h-12 w-16 overflow-hidden border border-jmm-black/15 hover:border-jmm-red transition"
                      >
                        {listing.media[0] ? (
                          <Image
                            src={getCloudflareImageUrl(listing.media[0].providerId)}
                            alt="Vehicle thumbnail"
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground bg-muted">
                            <CarFront className="h-5 w-5" />
                          </div>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link href={generateListingSlug(listing)} className="hover:underline">
                        {listing.year} {listing.make} {listing.model}
                      </Link>
                    </TableCell>
                    <TableCell>{formatCurrency(listing.askingPrice)}</TableCell>
                    <TableCell>
                      <Badge variant={listing.listingStatus === "active" ? "default" : "secondary"}>
                        {listing.listingStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <ListingActions listingId={listing.id} status={listing.listingStatus} />
                    </TableCell>
                  </TableRow>
                ))}
                {listings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      You haven&apos;t listed any vehicles yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
