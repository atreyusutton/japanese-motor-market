import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Car, Settings, LogOut, Bookmark } from "lucide-react"
import { SignOutButton } from "@clerk/nextjs"

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/sign-in")

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0 space-y-4">
          <div className="font-display text-lg uppercase tracking-[0.04em] px-4 mb-2">
            My Account
          </div>
          <nav className="flex flex-col space-y-1">
            <Button variant="ghost" className="justify-start" asChild>
              <Link href="/account/listings">
                <Car className="mr-2 h-4 w-4" />
                My Listings
              </Link>
            </Button>
            <Button variant="ghost" className="justify-start" asChild>
              <Link href="/account/watchlist">
                <Bookmark className="mr-2 h-4 w-4" />
                Watchlist
              </Link>
            </Button>
            <Button variant="ghost" className="justify-start" asChild>
              <Link href="/account/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
          </nav>
          <Separator />
          <div className="px-4">
            <SignOutButton redirectUrl="/">
              <Button
                variant="ghost"
                className="w-full justify-start text-jmm-red hover:text-jmm-red hover:bg-jmm-red/5"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </SignOutButton>
          </div>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
