import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ListingCard } from "@/components/listing/listing-card"

export default async function WatchlistPage() {
  const session = await auth()
  if (!session?.user) redirect("/sign-in")

  const savedListings = await prisma.savedListing.findMany({
    where: { userId: session.user.dbId },
    include: {
      listing: {
        include: {
          media: { orderBy: { sortOrder: "asc" } },
          seller: { select: { username: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display uppercase tracking-[0.04em]">My Watchlist</CardTitle>
        <CardDescription>Vehicles you are keeping an eye on</CardDescription>
      </CardHeader>
      <CardContent>
        {savedListings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedListings.map((saved) => (
              <ListingCard key={saved.id} listing={saved.listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            Your watchlist is empty. Browse listings to save vehicles you like.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
