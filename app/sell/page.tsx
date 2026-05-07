import { ListingWizard } from "@/components/listing/listing-wizard"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function SellPage() {
  const session = await auth()
  if (!session) redirect("/sign-in?redirect_url=/sell")

  return (
    <div className="container py-10">
      <div className="mb-8 text-center space-y-2">
        <span className="kanji text-jmm-red text-3xl leading-none">旧車</span>
        <h1 className="font-display text-3xl uppercase tracking-[0.02em] text-jmm-black">
          List Your Vehicle
        </h1>
        <p className="text-muted-foreground">Free to list. No fees, no commissions, no nonsense.</p>
      </div>
      <ListingWizard />
    </div>
  )
}
