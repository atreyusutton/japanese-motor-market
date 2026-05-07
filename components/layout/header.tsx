import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, Menu } from "lucide-react"
import { SignedIn, SignedOut, SignOutButton } from "@clerk/nextjs"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { NavLink } from "@/types/navigation"

import { SiteContainer } from "./site-container"

export async function Header() {
  const session = await auth()
  const isAuthed = Boolean(session?.user)

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  let events = await prisma.event
    .findMany({
      where: { active: true, date: { gte: oneDayAgo } },
      orderBy: { date: "asc" },
    })
    .catch(() => [] as Array<{ id: number; title: string; shortTitle: string | null; date: Date }>)

  if (events.length === 0) {
    const next = await prisma.event
      .findFirst({ where: { date: { gte: oneDayAgo } }, orderBy: { date: "asc" } })
      .catch(() => null)
    if (next) events = [next]
  }

  const fallbackLong =
    "旧車 · JAPANESE MOTOR MARKET · FREE LISTINGS · FREE MEMBERSHIP · BUILT BY JDM ENTHUSIASTS"
  const fallbackShort = "旧車 · FREE TO LIST · FREE TO JOIN"
  const longText = events.length === 0 ? fallbackLong : events.map((e) => e.title).join(" • ")
  const shortText =
    events.length === 0 ? fallbackShort : events.map((e) => e.shortTitle || e.title).join(" • ")

  const menuLinks: NavLink[] = [
    { label: "Browse Vehicles", href: "/listings" },
    { label: "List a Vehicle", href: "/sell" },
    { label: "Blog", href: "/blog" },
    ...(!isAuthed ? [{ label: "Sign Up — Free", href: "/sign-up" }] : []),
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/contact" },
    isAuthed
      ? {
          label: session?.user?.username ?? session?.user?.name ?? session?.user?.email ?? "Account",
          href: "/account",
        }
      : { label: "Log In", href: "/sign-in" },
  ]

  const headerCta = isAuthed
    ? { label: "List Vehicle", href: "/sell" }
    : { label: "Join Free", href: "/sign-up" }

  return (
    <>
      {/* Top marquee — black bar with the kanji */}
      <div className="bg-jmm-black text-white overflow-hidden">
        <SiteContainer className="py-2 text-center text-[0.6rem] min-[800px]:text-[0.68rem] font-semibold uppercase tracking-[0.18em] min-[800px]:tracking-[0.22em] px-4 whitespace-nowrap overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <span className="hidden min-[1080px]:inline">{longText}</span>
          <span className="min-[1080px]:hidden">{shortText}</span>
        </SiteContainer>
      </div>

      <header className="sticky top-0 left-0 right-0 z-50 border-b-2 border-jmm-black bg-white shadow-sm">
        <SiteContainer bleed className="py-2 min-[800px]:py-3 max-w-none px-3 sm:px-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-3 text-jmm-black min-w-0 flex-shrink-0"
              aria-label="Japanese Motor Market home"
            >
              <Image
                src="/assets/jmm-minimal-logo.png"
                alt="Japanese Motor Market"
                width={48}
                height={48}
                className="h-8 min-[800px]:h-10 w-auto flex-shrink-0 border border-jmm-black/10"
                priority
              />
              <span className="kanji text-jmm-red text-xl min-[800px]:text-2xl leading-none -mr-1">
                旧車
              </span>
              <span className="font-display font-semibold text-[0.7rem] sm:text-base md:text-lg uppercase tracking-[0.12em] sm:tracking-[0.18em] whitespace-nowrap">
                Japanese Motor Market
              </span>
            </Link>

            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              <SignedOut>
                <Link
                  href="/sign-in"
                  className="hidden min-[800px]:inline-flex items-center uppercase tracking-[0.18em] text-[0.7rem] font-semibold text-jmm-black hover:text-jmm-red transition-colors px-2 h-9 md:h-10"
                >
                  Log In
                </Link>
              </SignedOut>
              <Button
                asChild
                variant="outline"
                className="hidden min-[800px]:inline-flex uppercase tracking-[0.18em] text-[0.7rem] px-4 h-9 md:h-10 border-jmm-black text-jmm-black bg-white hover:bg-jmm-black hover:text-white"
              >
                <Link href="/listings">Browse Vehicles</Link>
              </Button>
              <Button
                asChild
                variant="default"
                className="hidden min-[800px]:inline-flex uppercase tracking-[0.18em] text-[0.7rem] px-4 h-9 md:h-10 bg-jmm-red text-white hover:bg-jmm-red-soft"
              >
                <Link href={headerCta.href}>{headerCta.label}</Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-10 w-10 shrink-0 p-0 text-jmm-black transition hover:bg-jmm-black/5 hover:text-jmm-red focus-visible:ring-0 focus-visible:ring-offset-0"
                    aria-label="Open menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 border-2 border-jmm-black bg-white p-2 text-jmm-black shadow-2xl"
                  align="end"
                >
                  <DropdownMenuLabel className="text-[0.65rem] uppercase tracking-[0.22em] text-jmm-black font-display">
                    Menu
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-jmm-black/30" />
                  {menuLinks.map((link) => (
                    <DropdownMenuItem
                      key={link.href}
                      asChild
                      className="text-[0.7rem] uppercase tracking-[0.18em]"
                    >
                      <Link
                        href={link.href}
                        className="flex w-full items-center justify-between gap-2 text-jmm-black"
                      >
                        <span>{link.label}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 text-jmm-black/70" />
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <SignedIn>
                    <DropdownMenuSeparator className="bg-jmm-black/30" />
                    <SignOutButton redirectUrl="/">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-2 px-2 py-1.5 text-[0.7rem] uppercase tracking-[0.18em] text-jmm-red hover:bg-jmm-red/5 transition-colors"
                      >
                        <span>Sign Out</span>
                      </button>
                    </SignOutButton>
                  </SignedIn>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </SiteContainer>
      </header>
    </>
  )
}
