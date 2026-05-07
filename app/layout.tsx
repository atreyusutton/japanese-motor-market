import type { Metadata } from "next"
import { Oswald, Inter, Noto_Serif_JP } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import "./globals.css"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { DisclaimerGate } from "@/components/legal/disclaimer-gate"

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

const notoSerifJp = Noto_Serif_JP({
  variable: "--font-noto-serif-jp",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
})

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://japanesemotormarket.com"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Japanese Motor Market — 旧車",
    template: "%s · Japanese Motor Market",
  },
  description:
    "Japanese Motor Market (旧車) — a free, enthusiast-driven marketplace for JDM and Japanese-made vehicles in the United States.",
  icons: {
    icon: "/assets/jmm-minimal-logo.png",
    shortcut: "/assets/jmm-minimal-logo.png",
    apple: "/assets/jmm-minimal-logo.png",
  },
  openGraph: {
    title: "Japanese Motor Market — 旧車",
    description:
      "A free marketplace for JDM and Japanese-made vehicles, built by enthusiasts.",
    url: SITE_URL,
    siteName: "Japanese Motor Market",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${oswald.variable} ${inter.variable} ${notoSerifJp.variable} min-h-screen bg-page text-text-main font-sans antialiased`}
        >
          <DisclaimerGate>
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </DisclaimerGate>
        </body>
      </html>
    </ClerkProvider>
  )
}
